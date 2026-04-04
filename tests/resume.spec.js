const fs = require('fs');

describe('Resume Pipeline Integration Tests', () => {
  test('Generated profile-data.js must contain valid structure', () => {
    const content = fs.readFileSync('profile-data.js', 'utf8');
    const profile = JSON.parse(content.split('export const profileData = ')[1].replace(';', ''));
    
    expect(profile).toHaveProperty('candidateName');
    expect(profile).toHaveProperty('experiences');
    expect(Array.isArray(profile.experiences)).toBe(true);
  });

  test('Experience items should not be empty', () => {
    const content = fs.readFileSync('profile-data.js', 'utf8');
    const profile = JSON.parse(content.split('export const profileData = ')[1].replace(';', ''));
    
    profile.experiences.forEach(exp => {
        expect(exp.title.length).toBeGreaterThan(0);
        expect(exp.bullets[0].length).toBeGreaterThan(0);
    });
  });
});
