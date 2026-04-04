const fs = require('fs');

const profileContent = fs.readFileSync('profile-data.js', 'utf8');
const profile = JSON.parse(profileContent.split('export const profileData = ')[1].replace(/;\s*$/, ''));
const health = JSON.parse(fs.readFileSync('health.json', 'utf8'));

describe('Profile Data — Structure', () => {
  test('has all top-level required keys', () => {
    ['candidateName', 'summary', 'experiences', 'skillGroups', 'education', 'certifications', 'contact'].forEach(key => {
      expect(profile[key]).toBeDefined();
    });
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
});

describe('Profile Data — Content Quality', () => {
  test('summary is present and ends with proper punctuation', () => {
    expect(typeof profile.summary).toBe('string');
    expect(profile.summary.trim().length).toBeGreaterThan(100);
    expect(['.', '!', '?']).toContain(profile.summary.trim().slice(-1));
  });

  test('experiences exist and each has required fields', () => {
    expect(Array.isArray(profile.experiences)).toBe(true);
    expect(profile.experiences.length).toBeGreaterThan(0);
    profile.experiences.forEach((exp, i) => {
      expect(exp.title).toBeTruthy();
      expect(exp.company).toBeTruthy();
      expect(exp.period).toBeTruthy();
      expect(Array.isArray(exp.bullets)).toBe(true);
      expect(exp.bullets.length).toBeGreaterThan(0);
      expect(exp.bullets[0].trim().length).toBeGreaterThan(0);
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
    });
  });
});

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
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});

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
});

describe('Source File Integrity', () => {
  test('translation.js does not contain the encodeeURIComponent typo', () => {
    const src = fs.readFileSync('js/modules/translation.js', 'utf8');
    expect(src).not.toContain('encodeeURIComponent');
  });

  test('update-resume.js uses dynamic model resolution with a stable fallback', () => {
    const src = fs.readFileSync('scripts/update-resume.js', 'utf8');
    expect(src).toContain('resolveLatestFlashModel');
    expect(src).toContain('gemini-2.0-flash');
  });

  test('profile-data.js exports a valid JS module', () => {
    expect(profileContent.trim().startsWith('export const profileData')).toBe(true);
    expect(profileContent.trim().endsWith('};')).toBe(true);
  });
});
