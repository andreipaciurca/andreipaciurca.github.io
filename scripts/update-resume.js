const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function summarize(text) {
  if (!text) return [];
  const prompt = `Summarize the following professional experience for a Senior Software Engineer CV. 
  Extract exactly 3 key bullet points that are impactful and professional.
  Text: ${text}`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().split('\n').filter(line => line.trim().startsWith('*') || line.trim().startsWith('-')).map(l => l.replace(/^[*\-]\s*/, '').trim());
  } catch (e) {
    console.error("AI summarization failed, falling back to raw text.", e);
    return text.split('\n').slice(0, 3);
  }
}

async function run() {
  const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
  const currentProfileFile = fs.readFileSync('profile-data.js', 'utf8');
  
  // Extract existing profile data structure to maintain consistency
  const match = currentProfileFile.match(/export const profileData = ({[\s\S]*});/);
  const currentProfile = JSON.parse(match[1]);

  const experiences = [];
  for (const exp of (linkedinData.experience || [])) {
    experiences.push({
      title: exp.position,
      company: exp.companyName,
      period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
      location: exp.location,
      bullets: await summarize(exp.description)
    });
  }

  const updatedProfile = {
    ...currentProfile,
    candidateName: `${linkedinData.firstName} ${linkedinData.lastName}`,
    role: linkedinData.headline,
    summary: linkedinData.about,
    location: linkedinData.location.linkedinText,
    experiences: experiences,
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
