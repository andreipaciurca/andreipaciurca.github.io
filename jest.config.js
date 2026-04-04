/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Only pick up unit tests — exclude the e2e/ subdirectory (Playwright handles that)
  testMatch: ['<rootDir>/tests/*.spec.js'],
};
