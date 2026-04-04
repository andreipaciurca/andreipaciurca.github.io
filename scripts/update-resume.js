const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

async function processWithAI(text, type) {
  if (!text) return type === 'bullets' ? [] : "";
  const prompt = `Rewrite into a professional Senior Software Engineer CV style. 
  ${type === 'bullets' ? 'Return exactly 3 high-impact sentences (no bullet symbols).' : 'Professional summary.'}
  Text: ${text.substring(0, 1500)}`;
  
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const profile = JSON.parse(fs.readFileSync('profile-data.js', 'utf8').replace('export const profileData = ', '').replace(';', ''));

  profile.summary = await processWithAI(linkedinData.about, 'summary');
  profile.experiences = await Promise.all(linkedinData.experience.map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processWithAI(exp.description, 'bullets')]
  })));
  
  profile.skillGroups = [{
      id: "technical",
      label: "Technical Expertise",
      items: (linkedinData.skills || []).slice(0, 10).map(s => ({ iconClass: "fa-solid fa-code", label: s.name }))
  }];

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(profile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify({ status: 'ok', timestamp: new Date() }));
}
run();
