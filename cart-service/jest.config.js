module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 15,
      lines: 30,
      statements: 30
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
