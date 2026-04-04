const fs = require('fs');

describe('End-to-End Integration Tests', () => {
  test('profile-data.js should have all required keys', () => {
    const content = fs.readFileSync('profile-data.js', 'utf8');
    const profile = JSON.parse(content.split('export const profileData = ')[1].replace(';', ''));
    expect(profile.summary).toBeDefined();
    expect(profile.experiences).toBeDefined();
    expect(profile.skillGroups).toBeDefined();
  });
  
  test('health.json should be valid', () => {
    const health = JSON.parse(fs.readFileSync('health.json', 'utf8'));
    expect(health.status).toBe('ok');
  });
});
