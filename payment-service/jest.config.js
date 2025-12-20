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
      branches: 10,
      functions: 10,
      lines: 20,
      statements: 20
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
