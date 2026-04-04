const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Curated skill groups with Font Awesome icons.
// These match the i18n-data.js dictionary keys so Romanian translation works out of the box.
const SKILL_GROUPS = [
  {
    id: 'backend',
    label: 'Backend Engineering',
    items: [
      { iconClass: 'fa-brands fa-java',    label: 'Java' },
      { iconClass: 'fa-solid fa-code',      label: 'Scala' },
      { iconClass: 'fa-brands fa-python',   label: 'Python' },
      { iconClass: 'fa-solid fa-leaf',      label: 'Spring Boot' },
      { iconClass: 'fa-solid fa-microchip', label: 'Micronaut' },
      { iconClass: 'fa-solid fa-database',  label: 'SQL' }
    ]
  },
  {
    id: 'data',
    label: 'Data and Streaming',
    items: [
      { iconClass: 'fa-solid fa-shuffle',         label: 'Kafka' },
      { iconClass: 'fa-solid fa-bolt',            label: 'Spark' },
      { iconClass: 'fa-solid fa-diagram-project', label: 'Data Pipelines' },
      { iconClass: 'fa-solid fa-network-wired',   label: 'Distributed Systems' }
    ]
  },
  {
    id: 'cloud',
    label: 'Cloud and Infrastructure',
    items: [
      { iconClass: 'fa-brands fa-aws',         label: 'AWS' },
      { iconClass: 'fa-solid fa-layer-group',  label: 'Terraform' },
      { iconClass: 'fa-brands fa-docker',      label: 'Docker' },
      { iconClass: 'fa-solid fa-dharmachakra', label: 'Kubernetes' }
    ]
  },
  {
    id: 'delivery',
    label: 'Delivery and Engineering Process',
    items: [
      { iconClass: 'fa-solid fa-rotate',          label: 'CI/CD' },
      { iconClass: 'fa-brands fa-git-alt',        label: 'Git' },
      { iconClass: 'fa-solid fa-chalkboard-user', label: 'Mentoring' },
      { iconClass: 'fa-solid fa-shield-halved',   label: 'Production Reliability' }
    ]
  }
];

/**
 * Uses Gemini to generate 2-3 short, action-oriented resume bullet points
 * from a raw job description. Returns an array of strings.
 */
async function processExperienceBullets(text) {
  if (!text || text.length < 50) return [text || ''];

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Generate 2-3 concise resume bullet points from this job description.
REQUIREMENTS:
- Output ONLY the bullet points, one per line, no numbering or leading dashes
- Each bullet starts with a strong action verb (Built, Designed, Led, Delivered, Maintained, etc.)
- Each bullet is under 130 characters
- Focus on technologies used, scale, and measurable impact
- NO preamble, NO intro text, NO explanations

Job description:
${text.substring(0, 2000)}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    const bullets = content
      .split('\n')
      .map(line => line.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(line => line.length > 20 && line.length < 150);

    return bullets.length >= 2 ? bullets : [text.substring(0, 200)];
  } catch (e) {
    console.error('AI bullet generation error:', e.message);
    return [text.substring(0, 200)];
  }
}

/**
 * Uses Gemini to rewrite the LinkedIn 'about' section as a tight 2-sentence summary.
 */
async function processSummary(text) {
  if (!text || text.length < 50) return text || '';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Rewrite this LinkedIn about section as a 2-sentence professional summary.
REQUIREMENTS:
- Output ONLY the 2 sentences, no preamble
- Sentence 1: what you build / core identity
- Sentence 2: tech stack and domain focus
- Senior Engineer tone, punchy and specific
- Under 250 characters total

About section:
${text.substring(0, 1500)}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    return content.length > 40 ? content : text.substring(0, 250);
  } catch (e) {
    console.error('AI summary error:', e.message);
    return text.substring(0, 250);
  }
}

async function run() {
  const allProfiles = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'));
  const linkedinData = Array.isArray(allProfiles) ? allProfiles[0] : null;

  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY,
    apify: !!process.env.APIFY_TOKEN && !!linkedinData
  };

  if (!linkedinData) {
    console.log('No LinkedIn data available. Skipping profile update.');
    fs.writeFileSync('health.json', JSON.stringify(healthStatus, null, 2));
    return;
  }

  const currentProfileFile = fs.readFileSync('profile-data.js', 'utf8');
  const match = currentProfileFile.match(/export const profileData = ({[\s\S]*});/);
  const currentProfile = JSON.parse(match[1]);

  const cleanLocation = (loc) => {
    if (!loc || typeof loc !== 'string') return 'Iaşi, Romania';
    return loc.toLowerCase().includes('helped me') ? 'Iaşi, Romania' : loc;
  };

  const summary = await processSummary(linkedinData.about);

  const experiences = await Promise.all((linkedinData.experience || []).map(async exp => ({
    title: exp.position,
    company: exp.companyName,
    period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
    location: cleanLocation(exp.location),
    bullets: await processExperienceBullets(exp.description)
  })));

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    location: cleanLocation(linkedinData.location?.linkedinText || 'Iaşi, Romania'),
    skillGroups: SKILL_GROUPS
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify(healthStatus, null, 2));
  console.log('Pipeline sync successful.');
}

run();
