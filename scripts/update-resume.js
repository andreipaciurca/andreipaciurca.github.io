const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Resolves the actual model name behind the 'gemini-flash-latest' alias via REST API.
// This alias always points to the newest Flash model (currently gemini-3-flash-preview).
// Falls back to the stable gemini-2.0-flash if the probe fails.
async function resolveLatestFlashModel() {
  try {
    const https = require('https');
    const apiKey = process.env.GEMINI_API_KEY;
    const body = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'generativelanguage.googleapis.com',
          path: '/v1beta/models/gemini-flash-latest:generateContent',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          }
        },
        res => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
      req.write(JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }));
      req.end();
    });
    const resolved = JSON.parse(body).modelVersion;
    if (resolved) {
      console.log(`Using model: ${resolved} (via gemini-flash-latest)`);
      return resolved;
    }
  } catch (e) {
    console.warn('Could not resolve latest flash model:', e.message);
  }
  console.log('Using model: gemini-2.0-flash (stable fallback)');
  return 'gemini-2.0-flash';
}

// ---------------------------------------------------------------------------
// CURATED FALLBACK — used when Gemini output fails quality checks.
// Hand-crafted for maximum recruiter + tech appeal. Update this when the
// actual job changes, not via the pipeline.
// ---------------------------------------------------------------------------
const FALLBACK_SUMMARY =
  'I build production systems that stay reliable under scale, complexity, and real business pressure. ' +
  'My work spans Java backend engineering, cloud data platforms, and low-level software foundations.';

const FALLBACK_EXPERIENCES = [
  {
    title: 'Senior Java Software Engineer',
    company: 'Deloitte',
    bullets: [
      'Engineered distributed data pipelines processing millions of daily events for a major Norwegian banking platform using Kafka, AWS Glue, and Spark.',
      'Built reusable AWS and Terraform infrastructure and Python data pipelines for an enterprise automotive analytics platform in Germany.',
      'Own system design, production debugging, performance tuning, and technical mentoring across cross-functional teams.'
    ]
  },
  {
    title: 'Java Software Engineer',
    company: 'Deloitte',
    bullets: [
      'Built the NHS e-commerce platform from scratch using Java 17 and Micronaut — end-to-end delivery of production-grade microservices for UK public healthcare.',
      'Extended the UK Home Office platform in a multicultural Agile team, working in Scala, Python, Groovy, and Bash.',
      'Operated across two high-profile UK government engagements, adapting quickly between different stacks and delivery processes.'
    ]
  },
  {
    title: 'Embedded C Junior Software Developer',
    company: 'Vitesco Technologies',
    bullets: [
      'Developed safety-critical automotive ECU software in embedded C under ISO 26262 functional safety requirements.',
      'Implemented software on multicore microcontrollers using AUTOSAR architecture and MISRA C 2012 coding standards.',
      'Validated software quality through Tessy and PTU unit testing frameworks following ASPICE process standards.'
    ]
  },
  {
    title: 'C++ Intern Software Developer',
    company: 'Continental',
    bullets: [
      'Designed and built an end-to-end IoT system using Raspberry Pi Zero W and Python Flask as a full Summer Practice project.',
      'Developed a C/C++ HTTP server, extended a Chrome extension in jQuery, and wrote unit tests with Google Test Framework.'
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
async function processExperienceBullets(text, modelName) {
  if (!text || text.length < 50) return null;
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
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

async function processSummary(text, modelName) {
  if (!text || text.length < 50) return null;
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
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

  const modelName = await resolveLatestFlashModel();

  // Summary — AI first, fallback to curated
  const aiSummary = await processSummary(linkedinData.about, modelName);
  const summary = aiSummary || FALLBACK_SUMMARY;
  console.log(aiSummary ? 'Summary: AI' : 'Summary: fallback');

  // Experiences — AI bullets first, fallback per-entry to curated
  const experiences = await Promise.all(
    (linkedinData.experience || []).map(async (exp, i) => {
      const aiBullets = await processExperienceBullets(exp.description, modelName);
      const fallback = FALLBACK_EXPERIENCES[i];
      const bullets = (aiBullets && bulletsAreGood(aiBullets))
        ? aiBullets
        : (fallback ? fallback.bullets : [`${exp.position} at ${exp.companyName}`]);
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

  const updatedProfile = {
    ...currentProfile,
    summary,
    experiences,
    location: cleanLocation(linkedinData.location?.linkedinText || 'Iaşi, Romania'),
    skillGroups: SKILL_GROUPS
  };

  fs.writeFileSync('profile-data.js', `export const profileData = ${JSON.stringify(updatedProfile, null, 2)};`);
  fs.writeFileSync('health.json', JSON.stringify(healthStatus, null, 2));
  console.log('Pipeline sync complete.');
}

run();
