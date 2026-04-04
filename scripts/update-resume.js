const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processText(text, promptPrefix) {
  if (!text) return text;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
    const prompt = `${promptPrefix}\n\nText: ${text.substring(0, 2000)}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    return text;
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfile = JSON.parse(fs.readFileSync('profile-data.js', 'utf8').split('export const profileData = ')[1].replace(';', ''));

  // AI Summarization Prompts
  const summary = await processText(linkedinData.about, "Rewrite this into a compelling professional summary paragraph for a Senior Software Engineer CV.");
  
  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processText(exp.description, "Summarize this experience into 3 concise high-impact sentences. No bullet points.")]
  })));

  const skills = (linkedinData.skills || []).slice(0, 8).map(s => ({ iconClass: "fa-solid fa-code", label: s.name }));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    skillGroups: [{ id: "tech", label: "Technical Expertise", items: skills }]
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  
  // Health endpoint generation
  const health = {
    services: {
        gemini: !!process.env.GEMINI_API_KEY,
        apify: !!process.env.APIFY_TOKEN
    },
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync('health.json', JSON.stringify(health, null, 2));
}

run();
