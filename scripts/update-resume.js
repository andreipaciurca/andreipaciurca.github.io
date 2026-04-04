const fs = require('fs');

// Citim datele de la Apify
const linkedinData = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'))[0];

const updatedProfile = {
  availabilityMode: "notice",
  birthDateIso: "1998-05-07",
  candidateName: `${linkedinData.firstName} ${linkedinData.lastName}`,
  profilePictureUrl: "profile-photo.jpg",
  profileInitials: `${linkedinData.firstName[0]}${linkedinData.lastName[0]}`,
  location: linkedinData.location.linkedinText,
  jobType: "Full-time / Remote",
  driversLicense: "Category B",
  role: linkedinData.headline,
  statusLine: "ACTIVE CANDIDATE · OPEN TO WORK",
  summary: linkedinData.about,
  activityMessages: [
    "Analyzing production constraints and engineering trade-offs...",
    "Compiling a concise impact report for distributed data pipelines...",
    "Optimizing backend architecture for reliability, scale, and maintainability..."
  ],
  topBar: {
    firstVisitMessage: "Welcome to my 127.0.0.1",
    commandMessage: "$ code session --agent=viewer --profile=andrei",
    commandCursor: "|",
    buttonLabels: { close: "x", minimize: "-", maximize: "+" },
    launcherSpeechText: "Pss! Please open and hire me!",
    launcherIconClass: "fa-solid fa-robot"
  },
  contact: {
    email: "andreipaciurca@icloud.com",
    phone: "+40748376161",
    linkedinUrl: linkedinData.linkedinUrl,
    githubUrl: "https://github.com/andreipaciurca"
  },
  skillGroups: [
    {
      id: "backend",
      label: "Skills",
      items: (linkedinData.skills || []).slice(0, 10).map(s => ({ iconClass: "fa-solid fa-code", label: s.name }))
    }
  ],
  experiences: (linkedinData.experience || []).map(exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: exp.location,
    bullets: exp.description ? exp.description.split('\n').filter(line => line.trim()) : []
  })),
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
 * Single source of truth for profile data.
 * Keep content in English; app.js handles automatic runtime translation.
 */
export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`;

fs.writeFileSync('profile-data.js', fileContent);
console.log("profile-data.js a fost actualizat cu succes!");
