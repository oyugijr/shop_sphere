module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js',
    '!**/node_modules/**'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
