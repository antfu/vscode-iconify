/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ['<rootDir>/tests.setup.js'],
  transform: {
    '\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.test.json'
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    'strip-json-comments': '<rootDir>/tests.setup.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(strip-json-comments|@iconify/utils|reactive-vscode|vscode-uri|ofetch|node-fetch-native)/)'
  ],
};