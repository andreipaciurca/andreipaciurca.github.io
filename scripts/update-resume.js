const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Dynamically retrieves the latest suitable Gemini model.
 */
async function getLatestFlashPreview() {
  const models = await genAI.listModels();
  const flashPreviewModels = models.models.filter(m => 
    m.name.toLowerCase().includes('flash') && 
    m.name.toLowerCase().includes('preview') &&
    !m.name.toLowerCase().includes('pro') &&
    !m.name.toLowerCase().includes('tts')
  );

  flashPreviewModels.sort((a, b) => b.name.localeCompare(a.name));
  return flashPreviewModels[0]?.name || "gemini-2.0-flash-lite-preview-02-05";
}

async function processWithAI(text, type) {
  if (!text) return type === 'bullets' ? [] : "";
  const safeText = text.substring(0, 1500); 
  
  const prompt = type === 'bullets' 
    ? `Rewrite the following experience into a concise, professional paragraph (3-4 sentences). Focus on impact and tech. No bullet points. Text: ${safeText}`
    : `Summarize this professional summary into a compelling, high-impact paragraph for a Senior Software Engineer CV. No intro/outro. Text: ${safeText}`;

  try {
    const modelName = await getLatestFlashPreview();
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    return type === 'bullets' ? [text.split('\n')[0]] : text;
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const fileContent = fs.readFileSync('profile-data.js', 'utf8');
  
  // Extract the object structure using regex, ignoring JSDoc and exports
  const match = fileContent.match(/export const profileData = ({[\s\S]*});/);
  if (!match) throw new Error("Could not find profileData object in profile-data.js");
  const currentProfile = JSON.parse(match[1]);

  const cleanLocation = (loc) => (!loc || loc.includes("helped me")) ? "Iaşi, Romania" : loc;

  const experiences = [];
  for (const exp of (linkedinData.experience || [])) {
    experiences.push({
      title: exp.position,
      company: exp.companyName,
      period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
      location: cleanLocation(exp.location),
      bullets: [await processWithAI(exp.description, 'bullets')]
    });
  }

  const updatedProfile = {
    ...currentProfile,
    candidateName: `${linkedinData.firstName} ${linkedinData.lastName}`,
    role: linkedinData.headline,
    summary: await processWithAI(linkedinData.about, 'summary'),
    location: cleanLocation(linkedinData.location.linkedinText),
    experiences,
    education: (linkedinData.education || []).map(edu => ({
      title: edu.degree || edu.degreeName,
      details: `${edu.schoolName} (${edu.period})`,
      extra: edu.description || "",
      iconClass: "fa-solid fa-graduation-cap"
    })),
    certifications: (linkedinData.certifications || []).map(cert => ({
      title: cert.title,
      issuer: cert.issuedBy,
      issued: cert.issuedAt,
      iconClass: "fa-solid fa-certificate"
    }))
  };

  const newFileContent = `/*
 * Profile data - Automatically synced from LinkedIn.
 */
export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`;

  fs.writeFileSync('profile-data.js', newFileContent);
  fs.writeFileSync('health.json', JSON.stringify({ status: 'ok', timestamp: new Date() }));
  console.log("profile-data.js updated successfully!");
}

run();
