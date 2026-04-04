const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Folosim modelul din env sau default-ul 2.0 Flash Lite Preview
const modelName = process.env.MODEL_NAME || "gemini-2.0-flash-lite-preview-02-05";
const model = genAI.getGenerativeModel({ model: modelName });

async function processWithAI(text, type) {
  if (!text) return type === 'bullets' ? [] : "";
  const safeText = text.substring(0, 1500); // Mărim limita la 1500
  
  const prompt = type === 'bullets' 
    ? `Summarize this experience into exactly 3 professional bullet points (English). 
       Strictly return only the bullet points as a list, no extra text. 
       Text: ${safeText}`
    : `Summarize/Translate this text into professional English CV tone. 
       Return only the text, no intro/outro. 
       Text: ${safeText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    return type === 'bullets' 
      ? content.split('\n').filter(l => l.trim()).map(l => l.replace(/^[*\-]\s*/, ''))
      : content;
  } catch (e) {
    console.error("AI summarization failed, falling back to basic formatting.", e);
    return type === 'bullets' ? text.split('\n').slice(0, 3) : text;
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
  console.log(`Updated successfully using ${modelName}`);
}

run();
