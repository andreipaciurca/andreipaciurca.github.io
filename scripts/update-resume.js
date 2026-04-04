/**
 * update-resume.js — LinkedIn → Gemini → profile-data.js pipeline
 *
 * Reads data/linkedin.json (written by Apify in the GitHub Actions workflow),
 * strips unused fields, runs Gemini Flash summarization with quality gates,
 * and writes the result to profile-data.js and health.json.
 *
 * Fallback strategy: when Gemini output fails quality checks (raw dump detection),
 * curated hand-written content from FALLBACK_EXPERIENCES / FALLBACK_SUMMARY is
 * used instead. The site never publishes raw LinkedIn data.
 */

const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 'gemini-flash-latest' is a stable Google alias that always resolves to the
// newest Flash model (currently gemini-3-flash-preview). The SDK handles the
// alias directly — no model discovery call is needed.
const GEMINI_MODEL = 'gemini-flash-latest';

// ---------------------------------------------------------------------------
// CURATED FALLBACK — used when Gemini output fails quality checks.
// Hand-crafted for maximum recruiter + tech appeal. Update this when the
// actual job changes, not via the pipeline.
// ---------------------------------------------------------------------------
const FALLBACK_SUMMARY =
  'Senior Software Engineer building systems that handle complexity, scale, and real-world constraints — ' +
  'from embedded automotive C/C++ to cloud-native distributed pipelines using AWS, Kafka, and Spark. ' +
  'Focused on reliable data flows, complex business logic, and performance under real production load.';

const FALLBACK_EXPERIENCES = [
  {
    title: 'Senior Java Software Engineer',
    company: 'Deloitte',
    bullets: [
      'Designed and maintained distributed data pipelines processing millions of events daily for a major Norwegian banking platform using Kafka, AWS Glue, and Spark — implementing financial business logic and optimising for production reliability.',
      'Built scalable Python data pipelines and reusable Terraform infrastructure for an enterprise automotive analytics platform in Germany.',
      'Contributed to system design decisions, production debugging, performance tuning, mentoring, and code reviews across cross-functional teams.'
    ]
  },
  {
    title: 'Java Software Engineer',
    company: 'Deloitte',
    bullets: [
      'Built an NHS eCommerce platform from scratch using Java 17, Micronaut, and JUnit, delivering production microservices for UK public healthcare.',
      'Worked on the UK Home Office platform across platform support and new feature delivery using Scala, Java, Python, Groovy, and Bash in a multicultural Agile team.'
    ]
  },
  {
    title: 'Embedded C Junior Software Developer',
    company: 'Vitesco Technologies',
    bullets: [
      'Developed embedded C software for automotive ECUs on single and multicore microcontrollers under ISO 26262 functional safety requirements and AUTOSAR architecture.',
      'Wrote unit tests using Tessy and PTU frameworks following MISRA C 2012 and ASPICE process standards.'
    ]
  },
  {
    title: 'C++ Intern Software Developer',
    company: 'Continental',
    bullets: [
      'Built an end-to-end IoT project using Raspberry Pi Zero W and Python Flask, including a C/C++ HTTP server and a jQuery Chrome extension, as a solo Summer Practice project.',
      'Wrote unit tests with Google Test Framework and gained practical experience with Agile methodology and code review workflows.'
    ]
  }
];

// ---------------------------------------------------------------------------
// Curated skill groups with FA icons — preserved across pipeline runs.
// Labels match i18n-data.js keys so Romanian translation works locally.
// ---------------------------------------------------------------------------
const SKILL_GROUPS = [
  {
    id: 'backend', label: 'Backend Engineering',
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
    id: 'data', label: 'Data and Streaming',
    items: [
      { iconClass: 'fa-solid fa-shuffle',         label: 'Kafka' },
      { iconClass: 'fa-solid fa-bolt',            label: 'Spark' },
      { iconClass: 'fa-solid fa-diagram-project', label: 'Data Pipelines' },
      { iconClass: 'fa-solid fa-network-wired',   label: 'Distributed Systems' }
    ]
  },
  {
    id: 'cloud', label: 'Cloud and Infrastructure',
    items: [
      { iconClass: 'fa-brands fa-aws',         label: 'AWS' },
      { iconClass: 'fa-solid fa-layer-group',  label: 'Terraform' },
      { iconClass: 'fa-brands fa-docker',      label: 'Docker' },
      { iconClass: 'fa-solid fa-dharmachakra', label: 'Kubernetes' }
    ]
  },
  {
    id: 'delivery', label: 'Delivery and Engineering Process',
    items: [
      { iconClass: 'fa-solid fa-rotate',          label: 'CI/CD' },
      { iconClass: 'fa-brands fa-git-alt',        label: 'Git' },
      { iconClass: 'fa-solid fa-chalkboard-user', label: 'Mentoring' },
      { iconClass: 'fa-solid fa-shield-halved',   label: 'Production Reliability' }
    ]
  }
];

// ---------------------------------------------------------------------------
// Quality gate — rejects raw LinkedIn dump / Gemini hallucinations
// ---------------------------------------------------------------------------
function looksLikeRawDump(text) {
  if (!text || typeof text !== 'string') return true;
  if (text.includes('\n')) return true;
  if (text.length > 200) return true;
  const dumpPhrases = ['specialization', 'during this period', 'experience:\n', '- core backend'];
  return dumpPhrases.some(p => text.toLowerCase().includes(p));
}

function bulletsAreGood(bullets) {
  return Array.isArray(bullets) &&
    bullets.length >= 2 &&
    bullets.every(b => !looksLikeRawDump(b) && b.length > 20);
}

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------
async function processExperienceBullets(text) {
  if (!text || text.length < 50) return null;
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `Generate 2-3 concise resume bullet points from this job description.
REQUIREMENTS:
- Output ONLY the bullet points, one per line, no leading dashes or numbers
- Each bullet starts with a strong action verb (Built, Engineered, Led, Delivered, etc.)
- Each bullet is under 130 characters and contains NO newlines
- Focus on tech stack, scale, and measurable impact
- NO preamble, NO intro, NO explanations

Job description:
${text.substring(0, 2000)}`;

    const result = await model.generateContent(prompt);
    const bullets = result.response.text().trim()
      .split('\n')
      .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(l => l.length > 20 && l.length < 150);

    return bulletsAreGood(bullets) ? bullets : null;
  } catch (e) {
    console.error('Gemini bullet error:', e.message);
    return null;
  }
}

async function processSummary(text) {
  if (!text || text.length < 50) return null;
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `Rewrite this LinkedIn about section as a 2-sentence professional summary.
REQUIREMENTS:
- Output ONLY the 2 sentences, no preamble or labels
- Sentence 1: core identity / what you build
- Sentence 2: tech stack and domain focus
- Senior Engineer tone, punchy, under 250 characters total, NO newlines

About:
${text.substring(0, 1500)}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim().replace(/\n/g, ' ');
    return content.length > 40 && !looksLikeRawDump(content) ? content : null;
  } catch (e) {
    console.error('Gemini summary error:', e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
// Fields from Apify that are large, unused, or contain third-party PII.
const LINKEDIN_STRIP_KEYS = new Set([
  'moreProfiles', 'receivedRecommendations', 'photo', 'profilePicture', 'coverPicture'
]);

async function run() {
  const allProfiles = JSON.parse(fs.readFileSync('data/linkedin.json', 'utf8'));
  const raw = Array.isArray(allProfiles) ? allProfiles[0] : null;

  // Strip unwanted fields before any processing or writing.
  const linkedinData = raw
    ? Object.fromEntries(Object.entries(raw).filter(([k]) => !LINKEDIN_STRIP_KEYS.has(k)))
    : null;

  // apify: true only when a fresh LinkedIn fetch actually returned data this run.
  // gemini: updated below — true only when at least one AI call produced usable output.
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini: false,
    apify: !!process.env.APIFY_TOKEN && !!linkedinData
  };

  if (!linkedinData) {
    console.log('No LinkedIn data — skipping profile update, writing health.');
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

  console.log(`Using model: ${GEMINI_MODEL}`);

  // Summary — AI first, fallback to curated
  const aiSummary = await processSummary(linkedinData.about);
  const summary = aiSummary || FALLBACK_SUMMARY;
  console.log(aiSummary ? 'Summary: AI' : 'Summary: fallback');

  // Experiences — AI bullets first, fallback per-entry to curated
  let geminiUsed = !!aiSummary;
  const experiences = await Promise.all(
    (linkedinData.experience || []).map(async (exp, i) => {
      const aiBullets = await processExperienceBullets(exp.description);
      const fallback = FALLBACK_EXPERIENCES[i];
      const bullets = (aiBullets && bulletsAreGood(aiBullets))
        ? aiBullets
        : (fallback ? fallback.bullets : [`${exp.position} at ${exp.companyName}`]);
      if (aiBullets) geminiUsed = true;
      console.log(`Exp[${i}] ${exp.companyName}: ${aiBullets ? 'AI' : 'fallback'}`);
      return {
        title: exp.position,
        company: exp.companyName,
        period: `${exp.startDate.text} - ${exp.endDate?.text || 'Present'}`,
        location: cleanLocation(exp.location),
        bullets
      };
    })
  );

  // Reflect whether Gemini actually produced usable output this run.
  healthStatus.gemini = geminiUsed;

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    // Prefer live LinkedIn location; fall back to whatever was last stored, then
    // the hardcoded default only as a last resort.
    location: cleanLocation(linkedinData.location?.linkedinText || currentProfile.location || 'Iaşi, Romania'),
    skillGroups: SKILL_GROUPS
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  // Write back the cleaned linkedin.json (stripped of moreProfiles and other unused fields).
  fs.writeFileSync('data/linkedin.json', JSON.stringify([linkedinData], null, 2));
  fs.writeFileSync('health.json', JSON.stringify(healthStatus, null, 2));
  console.log(`Pipeline sync complete. gemini=${healthStatus.gemini} apify=${healthStatus.apify}`);
}

run();
