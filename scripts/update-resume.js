const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Mapping table for professional icons based on skill labels.
 */
const iconMap = {
  java: "fa-brands fa-java",
  aws: "fa-brands fa-aws",
  kafka: "fa-solid fa-database",
  spark: "fa-solid fa-bolt",
  python: "fa-brands fa-python",
  docker: "fa-brands fa-docker",
  kubernetes: "fa-solid fa-dharmachakra",
  spring: "fa-solid fa-seedling",
  git: "fa-brands fa-git-alt",
  javascript: "fa-brands fa-js",
  typescript: "fa-brands fa-square-js",
  default: "fa-solid fa-code"
};

function getIcon(label) {
  const key = Object.keys(iconMap).find(k => label.toLowerCase().includes(k));
  return iconMap[key] || iconMap.default;
}

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

  const summary = await processText(linkedinData.about, "Rewrite into a professional, high-impact paragraph for a Senior Software Engineer CV.");
  
  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location?.includes("helped") ? "Iaşi, Romania" : exp.location,
    bullets: [await processText(exp.description, "Summarize experience into a concise, impactful paragraph (3-4 sentences). Focus on achievements and tech.")]
  })));

  const skills = (linkedinData.skills || []).slice(0, 15).map(s => ({ 
    iconClass: getIcon(s.name), 
    label: s.name 
  }));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    skillGroups: [{ id: "tech", label: "Technical Expertise", items: skills }]
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify({ status: 'ok', timestamp: new Date() }));
  console.log("Profile data updated successfully!");
}

run();
