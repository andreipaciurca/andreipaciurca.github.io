const fs = require('fs');

const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];
const currentProfileFile = fs.readFileSync('profile-data.js', 'utf8');

// Extract current object structure
const match = currentProfileFile.match(/export const profileData = ({[\s\S]*});/);
const currentProfile = JSON.parse(match[1]);

const updatedProfile = {
  ...currentProfile,
  candidateName: `${linkedinData.firstName} ${linkedinData.lastName}`,
  role: linkedinData.headline,
  summary: linkedinData.about,
  location: linkedinData.location.linkedinText,
  experiences: linkedinData.experience.map(exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location,
    bullets: exp.description ? exp.description.split('\n').filter(line => line.trim()) : []
  })),
  education: linkedinData.education.map(edu => ({
    title: edu.degree || edu.degreeName,
    details: `${edu.schoolName} (${edu.period})`,
    extra: edu.description || ""
  })),
  certifications: linkedinData.certifications.map(cert => ({
    title: cert.title,
    issuer: cert.issuedBy,
    issued: cert.issuedAt
  }))
};

const fileContent = `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`;
fs.writeFileSync('profile-data.js', fileContent);
console.log("profile-data.js a fost actualizat cu succes!");
