const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Summarizes text using a strict JSON-forcing prompt to ensure AI compliance.
 */
async function processText(text, promptPrefix) {
  if (!text || text.length < 50) return text;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
    const prompt = `${promptPrefix} 
    Output the result as a strict JSON object: {"content": "your_text_here"}. 
    No other text or formatting.
    Text: ${text.substring(0, 1500)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean potential markdown code block formatting
    const jsonString = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonString).content;
  } catch (e) {
    console.error("AI Error:", e);
    return text.substring(0, 500) + "...";
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfile = JSON.parse(fs.readFileSync('profile-data.js', 'utf8').split('export const profileData = ')[1].replace(';', ''));

  const summary = await processText(linkedinData.about, "Rewrite into a high-impact professional paragraph for a Senior Software Engineer CV.");
  
  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processText(exp.description, "Summarize experience into a concise, high-impact paragraph (3-4 sentences). Focus on achievements and tech.")]
  })));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    skillGroups: [{ id: "tech", label: "Technical Expertise", items: (linkedinData.skills || []).slice(0, 15).map(s => ({ iconClass: "fa-solid fa-code", label: s.name })) }]
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify({ status: 'ok', timestamp: new Date(), gemini: !!process.env.GEMINI_API_KEY, apify: !!process.env.APIFY_TOKEN }, null, 2));
  console.log("Sync complete.");
}
run();
