const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getModel() {
  // Directly using the specific preview model recommended
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
}

async function processText(text, promptPrefix) {
  if (!text || text.length < 50) return text;
  try {
    const model = await getModel();
    const prompt = `${promptPrefix}\n\nText: ${text.substring(0, 2000)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (e) {
    console.error("AI Error:", e);
    return text.substring(0, 500) + "..."; // Fallback: truncate
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfile = JSON.parse(fs.readFileSync('profile-data.js', 'utf8').split('export const profileData = ')[1].replace(';', ''));

  // AI Summarization: Strict instructions to avoid verbosity
  const summary = await processText(linkedinData.about, "Summarize this into 3 professional, high-impact sentences for a CV summary. Output ONLY the paragraph.");
  
  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processText(exp.description, "Summarize this experience into a concise paragraph (3-4 sentences). Focus on tech impact. No bullet points.")]
  })));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    skillGroups: [{ id: "tech", label: "Technical Expertise", items: (linkedinData.skills || []).slice(0, 15).map(s => ({ iconClass: "fa-solid fa-code", label: s.name })) }]
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  console.log("Sync complete.");
}
run();
