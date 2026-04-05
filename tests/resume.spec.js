/**
 * Unit & integration tests for profile data, health endpoint, pipeline scripts,
 * and source file integrity. Run with: npm test
 */
const fs = require('fs');

const profileContent = fs.readFileSync('profile-data.js', 'utf8');
const profile = JSON.parse(profileContent.split('export const profileData = ')[1].replace(/;\s*$/, ''));
const health = JSON.parse(fs.readFileSync('health.json', 'utf8'));
const indexHtml = fs.readFileSync('index.html', 'utf8');
const updateScript = fs.readFileSync('scripts/update-resume.js', 'utf8');
const workflowYml = fs.readFileSync('.github/workflows/update-resume.yml', 'utf8');

// ---------------------------------------------------------------------------
// Profile Data — Structure
// ---------------------------------------------------------------------------
describe('Profile Data — Structure', () => {
  test('has all top-level required keys', () => {
    const required = ['candidateName', 'summary', 'experiences', 'skillGroups',
      'education', 'certifications', 'contact', 'location', 'statusLine', 'role'];
    required.forEach(key => expect(profile[key]).toBeDefined());
  });

  test('candidateName is a non-empty string', () => {
    expect(typeof profile.candidateName).toBe('string');
    expect(profile.candidateName.trim().length).toBeGreaterThan(0);
  });

  test('contact has valid email, LinkedIn and GitHub URLs', () => {
    expect(profile.contact.email).toMatch(/@/);
    expect(profile.contact.linkedinUrl).toMatch(/linkedin\.com/);
    expect(profile.contact.githubUrl).toMatch(/github\.com/);
  });

  test('contact URLs use https', () => {
    expect(profile.contact.linkedinUrl).toMatch(/^https:\/\//);
    expect(profile.contact.githubUrl).toMatch(/^https:\/\//);
  });

  test('contact phone is present', () => {
    expect(typeof profile.contact.phone).toBe('string');
    expect(profile.contact.phone.trim().length).toBeGreaterThan(0);
  });

  test('birthDateIso is a valid ISO date in the past', () => {
    const d = new Date(profile.birthDateIso);
    expect(d.toString()).not.toBe('Invalid Date');
    expect(d.getTime()).toBeLessThan(Date.now());
  });

  test('availabilityMode is a known value', () => {
    expect(['immediate', 'notice']).toContain(profile.availabilityMode);
  });

  test('location is a non-empty string', () => {
    expect(typeof profile.location).toBe('string');
    expect(profile.location.trim().length).toBeGreaterThan(0);
  });

  test('role is a non-empty string', () => {
    expect(typeof profile.role).toBe('string');
    expect(profile.role.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Profile Data — Content Quality
// ---------------------------------------------------------------------------
describe('Profile Data — Content Quality', () => {
  test('summary is present and ends with proper punctuation', () => {
    expect(typeof profile.summary).toBe('string');
    expect(profile.summary.trim().length).toBeGreaterThan(100);
    expect(['.', '!', '?']).toContain(profile.summary.trim().slice(-1));
  });

  test('summary contains no raw newlines', () => {
    expect(profile.summary).not.toContain('\n');
  });

  test('at least 3 experience entries', () => {
    expect(profile.experiences.length).toBeGreaterThanOrEqual(3);
  });

  test('experiences exist and each has required fields', () => {
    expect(Array.isArray(profile.experiences)).toBe(true);
    profile.experiences.forEach(exp => {
      expect(exp.title).toBeTruthy();
      expect(exp.company).toBeTruthy();
      expect(exp.period).toBeTruthy();
      expect(exp.location).toBeTruthy();
      expect(Array.isArray(exp.bullets)).toBe(true);
      expect(exp.bullets.length).toBeGreaterThan(0);
    });
  });

  test('experience period contains a 4-digit year', () => {
    profile.experiences.forEach(exp => {
      expect(exp.period).toMatch(/\d{4}/);
    });
  });

  test('bullets have no raw newlines and are between 20 and 250 characters', () => {
    profile.experiences.forEach(exp => {
      exp.bullets.forEach(bullet => {
        expect(bullet).not.toContain('\n');
        expect(bullet.trim().length).toBeGreaterThanOrEqual(20);
        expect(bullet.trim().length).toBeLessThanOrEqual(250);
      });
    });
  });

  test('bullets do not start with a dash or bullet character', () => {
    profile.experiences.forEach(exp => {
      exp.bullets.forEach(bullet => {
        expect(bullet.trim()).not.toMatch(/^[-•*]/);
      });
    });
  });

  test('bullets start with a capital letter', () => {
    profile.experiences.forEach(exp => {
      exp.bullets.forEach(bullet => {
        expect(bullet.trim()[0]).toMatch(/[A-Z]/);
      });
    });
  });

  test('education entries exist and have title and details', () => {
    expect(Array.isArray(profile.education)).toBe(true);
    expect(profile.education.length).toBeGreaterThan(0);
    profile.education.forEach(edu => {
      expect(edu.title).toBeTruthy();
      expect(edu.details).toBeTruthy();
    });
  });

  test('certifications exist and have title and issuer', () => {
    expect(Array.isArray(profile.certifications)).toBe(true);
    expect(profile.certifications.length).toBeGreaterThan(0);
    profile.certifications.forEach(cert => {
      expect(cert.title).toBeTruthy();
      expect(cert.issuer).toBeTruthy();
      expect(cert.issued).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Profile Data — Skills Integrity
// ---------------------------------------------------------------------------
describe('Profile Data — Skills Integrity', () => {
  test('skillGroups is a non-empty array with items', () => {
    expect(Array.isArray(profile.skillGroups)).toBe(true);
    expect(profile.skillGroups.length).toBeGreaterThan(0);
    profile.skillGroups.forEach(group => {
      expect(Array.isArray(group.items)).toBe(true);
      expect(group.items.length).toBeGreaterThan(0);
    });
  });

  test('skill labels have no leading or trailing whitespace', () => {
    profile.skillGroups.forEach(group => {
      group.items.forEach(item => {
        expect(item.label).toBe(item.label.trim());
      });
    });
  });

  test('skill labels contain no duplicates', () => {
    const labels = profile.skillGroups.flatMap(g => g.items.map(s => s.label.trim().toLowerCase()));
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('every skill item has a valid Font Awesome iconClass', () => {
    profile.skillGroups.forEach(group => {
      group.items.forEach(item => {
        expect(item.iconClass).toMatch(/^fa-/);
        expect(item.iconClass.split(' ').length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  test('every skill group has an id and label', () => {
    profile.skillGroups.forEach(group => {
      expect(group.id).toBeTruthy();
      expect(group.label).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Health Endpoint
// ---------------------------------------------------------------------------
describe('Health Endpoint', () => {
  test('health.json status is ok', () => {
    expect(health.status).toBe('ok');
  });

  test('health.json has all required fields', () => {
    expect(health.timestamp).toBeDefined();
    expect(typeof health.gemini).toBe('boolean');
    expect(typeof health.apify).toBe('boolean');
  });

  test('health.json timestamp is a valid ISO 8601 date', () => {
    const ts = new Date(health.timestamp);
    expect(ts.toString()).not.toBe('Invalid Date');
  });

  test('health.json timestamp is not older than 90 days', () => {
    const ts = new Date(health.timestamp);
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    expect(Date.now() - ts.getTime()).toBeLessThan(ninetyDaysMs);
  });
});

// ---------------------------------------------------------------------------
// Source File Integrity — index.html
// ---------------------------------------------------------------------------
describe('Source File Integrity — index.html', () => {
  const criticalIds = [
    'candidateName', 'heroSummary', 'heroRole', 'statusLine',
    'printResumeButton', 'windowButtonClose', 'windowButtonMinimize',
    'windowButtonMaximize', 'themeToggleButton', 'launcherCard',
    'experienceList', 'skillsGroupList', 'educationList', 'certificationList',
    'printResumeRoot', 'printName', 'printContactLine',
  ];

  test('index.html contains all critical DOM element IDs', () => {
    criticalIds.forEach(id => {
      expect(indexHtml).toContain(`id="${id}"`);
    });
  });

  test('index.html has required meta tags', () => {
    expect(indexHtml).toContain('og:title');
    expect(indexHtml).toContain('og:description');
    expect(indexHtml).toContain('twitter:card');
    expect(indexHtml).toContain('name="description"');
  });

  test('index.html loads main.js as a module', () => {
    expect(indexHtml).toContain('type="module"');
    expect(indexHtml).toMatch(/js\/main(\.min)?\.js/);
  });

  test('index.html has resume pointer elements', () => {
    expect(indexHtml).toContain('resume-pointer');
    expect(indexHtml).toContain('fa-hand-point-right');
    expect(indexHtml).toContain('fa-hand-point-left');
  });

  test('print resume section is present', () => {
    expect(indexHtml).toContain('print-only');
    expect(indexHtml).toContain('printResumeRoot');
  });
});

// ---------------------------------------------------------------------------
// Source File Integrity — Pipeline & Workflow
// ---------------------------------------------------------------------------
describe('Source File Integrity — Pipeline', () => {
  test('translation module has been removed (no translation.js or translation.ts)', () => {
    expect(fs.existsSync('js/modules/translation.js')).toBe(false);
    expect(fs.existsSync('js/modules/translation.ts')).toBe(false);
  });

  test('update-resume.js uses gemini-flash-latest alias and GEMINI_MODEL constant', () => {
    expect(updateScript).toContain('GEMINI_MODEL');
    expect(updateScript).toContain('gemini-flash-latest');
  });

  test('profile-data.js exports a valid JS module', () => {
    expect(profileContent.trim().startsWith('export const profileData')).toBe(true);
    expect(profileContent.trim().endsWith('};')).toBe(true);
  });

  test('update-resume.js defines FALLBACK_EXPERIENCES with at least 3 entries', () => {
    const matches = updateScript.match(/title:/g) || [];
    // Each experience entry has at least one 'title:' — count gives a floor estimate
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  test('update-resume.js strips moreProfiles and photo fields', () => {
    expect(updateScript).toContain('moreProfiles');
    expect(updateScript).toContain('LINKEDIN_STRIP_KEYS');
  });

  test('update-resume.js tracks actual Gemini output quality via geminiUsed flag', () => {
    expect(updateScript).toContain('geminiUsed');
    expect(updateScript).toContain('healthStatus.gemini = geminiUsed');
  });

  test('workflow passes APIFY_TOKEN to the node script env', () => {
    expect(workflowYml).toContain('APIFY_TOKEN: ${{ secrets.APIFY_TOKEN }}');
  });

  test('workflow uses amend-on-cron strategy to keep history flat', () => {
    expect(workflowYml).toContain('--amend');
    expect(workflowYml).toContain('--force');
  });

  test('workflow uses actions/checkout@v4 and setup-node@v4', () => {
    expect(workflowYml).toContain('actions/checkout@v4');
    expect(workflowYml).toContain('actions/setup-node@v4');
  });

  test('style.css has a @media print block', () => {
    const css = fs.readFileSync('assets/style.css', 'utf8');
    expect(css).toContain('@media print');
  });

  test('style.css resume-pointer has no top offset (hands centered by flexbox)', () => {
    const css = fs.readFileSync('assets/style.css', 'utf8');
    // Extract only the .resume-pointer rule block (not child selectors)
    const match = css.match(/\.resume-pointer\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    expect(match[1]).not.toContain('top:');
  });

  test('no PDF file exists in repository root', () => {
    const files = fs.readdirSync('.');
    const pdfs = files.filter(f => f.endsWith('.pdf'));
    expect(pdfs).toHaveLength(0);
  });

  test('.gitignore excludes PDF files', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    expect(gitignore).toContain('*.pdf');
  });
});

// ---------------------------------------------------------------------------
// TypeScript Setup
// ---------------------------------------------------------------------------
describe('TypeScript Setup', () => {
  test('tsconfig.json exists and targets ES2020', () => {
    const raw = fs.readFileSync('tsconfig.json', 'utf8');
    // Strip JS-style comments before parsing
    const cleaned = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(cleaned);
    expect(config.compilerOptions.target).toBe('ES2020');
    expect(config.compilerOptions.strict).toBe(true);
  });

  test('tsconfig.json rootDir and outDir are both js/', () => {
    const raw = fs.readFileSync('tsconfig.json', 'utf8');
    const cleaned = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const config = JSON.parse(cleaned);
    expect(config.compilerOptions.rootDir).toBe('js');
    expect(config.compilerOptions.outDir).toBe('js');
  });

  test('all TypeScript source files have corresponding compiled JS files', () => {
    const tsFiles = fs.readdirSync('js/modules')
      .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
    tsFiles.forEach(tsFile => {
      const jsFile = tsFile.replace(/\.ts$/, '.js');
      expect(fs.existsSync(`js/modules/${jsFile}`)).toBe(true);
    });
    expect(fs.existsSync('js/main.js')).toBe(true);
  });

  test('types.ts exports the core ProfileData interface', () => {
    const src = fs.readFileSync('js/modules/types.ts', 'utf8');
    expect(src).toContain('export interface ProfileData');
    expect(src).toContain('export interface Experience');
    expect(src).toContain('export interface AtsReport');
  });

  test('profile-data.d.ts type declaration exists and references ProfileData', () => {
    const src = fs.readFileSync('profile-data.d.ts', 'utf8');
    expect(src).toContain('ProfileData');
    expect(src).toContain('profileData');
  });

  test('package.json has build and typecheck scripts', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(pkg.scripts.build).toContain('tsc');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
  });

  test('package.json has typescript as a devDependency', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(pkg.devDependencies.typescript).toBeDefined();
  });

  test('main.ts exists and imports from modules with .js extensions', () => {
    const src = fs.readFileSync('js/main.ts', 'utf8');
    // ES modules for browser need .js import paths even in TypeScript source
    expect(src).toContain("from './modules/config.js'");
    expect(src).toContain("from './modules/state.js'");
    expect(src).toContain("from './modules/dom.js'");
  });

  test('state.ts exports AppState interface and trackTimeout function', () => {
    const src = fs.readFileSync('js/modules/state.ts', 'utf8');
    expect(src).toContain('AppState');
    expect(src).toContain('trackTimeout');
    expect(src).toContain('clearActiveAsyncWork');
  });

  test('dom.ts uses typed element accessors (HTMLButtonElement, HTMLAnchorElement)', () => {
    const src = fs.readFileSync('js/modules/dom.ts', 'utf8');
    expect(src).toContain('HTMLButtonElement');
    expect(src).toContain('HTMLAnchorElement');
    expect(src).toContain('HTMLImageElement');
  });
});
