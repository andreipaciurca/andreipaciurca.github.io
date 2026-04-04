const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getLatestFlashPreview() {
  const models = await genAI.listModels();
  const flashPreviewModels = models.models.filter(m => 
    m.name.toLowerCase().includes('flash') && 
    m.name.toLowerCase().includes('preview') &&
    !m.name.toLowerCase().includes('pro') &&
    !m.name.toLowerCase().includes('tts')
  );

  flashPreviewModels.sort((a, b) => b.name.localeCompare(a.name));
  const selected = flashPreviewModels[0]?.name || "gemini-2.0-flash-lite-preview-02-05";
  console.log(`Auto-selected model: ${selected}`);
  return selected;
}

async function processWithAI(text, type) {
  if (!text) return type === 'bullets' ? [] : "";
  const safeText = text.substring(0, 1500);
  
  const prompt = type === 'bullets' 
    ? `Rewrite this work experience into a concise, high-impact paragraph (approx. 3-4 sentences). 
       Focus on achievements, technologies used, and the scale of the impact. Use professional, 
       active voice for a Senior Software Engineer. Do not use bullet points, just a paragraph.
       Text: ${safeText}`
    : `Summarize this professional summary into a compelling, high-impact paragraph for a CV. 
       Professional, senior tone. No intro/outro.
       Text: ${safeText}`;

  try {
    const modelName = await getLatestFlashPreview();
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    return type === 'bullets' ? [content] : content;
  } catch (e) {
    console.error("AI summarization failed, falling back.", e);
    return type === 'bullets' ? [text.split('\n')[0]] : text;
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfileFile = fs.readFileSync('profile-data.js', 'utf8');
  
  const match = currentProfileFile.match(/export const profileData = ({[\s\S]*});/);
  const currentProfile = JSON.parse(match[1]);

  const cleanLocation = (loc) => (!loc || loc.includes("helped me")) ? "Iaşi, Romania" : loc;

  const experiences = [];
  for (const exp of (linkedinData.experience || [])) {
    experiences.push({
      title: exp.position,
      company: exp.companyName,
      period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
      location: cleanLocation(exp.location),
      bullets: await processWithAI(exp.description, 'bullets')
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

  const fileContent = `/*
 * Profile data - Automatically synced from LinkedIn.
 */
export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`;

  fs.writeFileSync('profile-data.js', fileContent);
  console.log("profile-data.js updated successfully!");
}

run();
