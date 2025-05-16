module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
};
