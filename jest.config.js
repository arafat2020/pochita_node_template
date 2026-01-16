module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['reflect-metadata'],
  testMatch: ['**/*.spec.ts'],
  verbose: true,
};
