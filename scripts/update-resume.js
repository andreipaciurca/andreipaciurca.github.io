const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Enhanced summarization with strict output control.
 */
async function processText(text, promptPrefix) {
  if (!text || text.length < 50) return text;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
    const prompt = `${promptPrefix}. 
    REQUIREMENTS: 
    - Output ONLY the final paragraph. 
    - NO bullet points. 
    - Professional, punchy, Senior Engineer tone. 
    - Max 3 sentences.
    Text: ${text.substring(0, 1500)}`;
    
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    
    // Validate that the AI didn't just dump the original text
    return content.length > 50 ? content : text.substring(0, 499);
  } catch (e) {
    console.error("AI summarization error:", e);
    return text.substring(0, 499);
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfileFile = fs.readFileSync('profile-data.js', 'utf8');
  const match = currentProfileFile.match(/export const profileData = ({[\s\S]*});/);
  const currentProfile = JSON.parse(match[1]);

  // Clean location: remove "helped me" referrals
  const cleanLocation = (loc) => {
    if (!loc || typeof loc !== 'string') return "Iaşi, Romania";
    return loc.toLowerCase().includes("helped me") ? "Iaşi, Romania" : loc;
  };

  // Summarize About and Experience
  const summary = await processText(linkedinData.about, "Rewrite this into a compelling professional summary paragraph for a Senior Software Engineer.");
  
  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: cleanLocation(exp.location),
    bullets: [await processText(exp.description, "Summarize this experience into a concise, high-impact paragraph. Focus on impact and tech.")]
  })));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    location: cleanLocation(linkedinData.location?.linkedinText || "Iaşi, Romania"),
    skillGroups: [{ 
      id: "technical", 
      label: "Technical Expertise", 
      items: (linkedinData.skills || []).slice(0, 15).map(s => ({ 
        iconClass: "fa-solid fa-code", label: s.name 
      })) 
    }]
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  
  const healthStatus = { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY,
    apify: !!process.env.APIFY_TOKEN
  };
  fs.writeFileSync('health.json', JSON.stringify(healthStatus, null, 2));
  console.log("Pipeline sync successful.");
}
run();
