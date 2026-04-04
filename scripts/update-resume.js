const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const iconMap = {
  java: "fa-brands fa-java", aws: "fa-brands fa-aws", kafka: "fa-solid fa-database",
  spark: "fa-solid fa-bolt", python: "fa-brands fa-python", docker: "fa-brands fa-docker",
  kubernetes: "fa-solid fa-dharmachakra", spring: "fa-solid fa-seedling",
  git: "fa-brands fa-git-alt", javascript: "fa-brands fa-js", typescript: "fa-brands fa-square-js",
  react: "fa-brands fa-react", node: "fa-brands fa-node", scala: "fa-solid fa-code-branch",
  sql: "fa-solid fa-database", default: "fa-solid fa-code"
};

function getIcon(label) {
  const key = Object.keys(iconMap).find(k => label.toLowerCase().includes(k));
  return iconMap[key] || iconMap.default;
}

async function processWithAI(text, type) {
  if (!text) return type === 'bullets' ? [] : "";
  // Truncate heavily to stay well under the 500-character limit
  const safeText = text.substring(0, 450); 
  
  const prompt = type === 'bullets' 
    ? `Summarize this experience into a high-impact paragraph (max 3 sentences). Professional English tone. No bullet points. Text: ${safeText}`
    : `Summarize this into a compelling professional summary (max 3 sentences). Professional English tone. Text: ${safeText}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    return text.substring(0, 400); // Fallback
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfile = JSON.parse(fs.readFileSync('profile-data.js', 'utf8').split('export const profileData = ')[1].replace(';', ''));

  const summary = await processWithAI(linkedinData.about, 'summary');
  
  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processWithAI(exp.description, 'bullets')]
  })));

  const skills = (linkedinData.skills || []).slice(0, 15).map(s => ({ 
    iconClass: getIcon(s.name), 
    label: s.name 
  }));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    skillGroups: [{ id: "technical", label: "Technical Expertise", items: skills }]
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }, null, 2));
}
run();
