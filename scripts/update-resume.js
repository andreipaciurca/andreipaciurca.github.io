const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

async function processText(text, promptPrefix) {
  if (!text) return "";
  const chunks = text.match(/.{1,499}/g) || [text];
  let fullText = "";
  for (const chunk of chunks) {
    try {
      const prompt = `${promptPrefix} (Professional/Business tone). Text: ${chunk}`;
      const result = await model.generateContent(prompt);
      fullText += result.response.text().trim() + " ";
    } catch(e) { fullText += chunk; }
  }
  // Consolidate and finalize
  const finalPrompt = `Summarize this professional text into a single, cohesive, high-impact paragraph. Text: ${fullText}`;
  const result = await model.generateContent(finalPrompt);
  return result.response.text().trim();
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const profile = JSON.parse(fs.readFileSync('profile-data.js', 'utf8').split('export const profileData = ')[1].replace(';', ''));

  profile.summary = await processText(linkedinData.about, "Summarize this summary for a Senior Software Engineer CV.");
  
  profile.experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processText(exp.description, "Summarize this role focus on impact and tech.")]
  })));

  profile.skillGroups = [{ 
    id: "tech", label: "Technical Expertise", 
    items: (linkedinData.skills || []).slice(0, 15).map(s => ({ 
        iconClass: "fa-solid fa-code", label: s.name 
    })) 
  }];

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(profile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }, null, 2));
}
run();
