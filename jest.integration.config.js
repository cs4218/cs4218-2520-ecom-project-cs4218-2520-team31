// This config is for running integration tests only via: npm run test:integration
// Integration tests are also included in jest.backend.config.js (npm run test:backend)
module.exports = {
    displayName: "integration",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/controllers/_tests_/integration/setupEnv.js"],
    testMatch: [
        "<rootDir>/controllers/_tests_/integration/**/*.integration.test.js"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        "controllers/**/*.js",
        "middlewares/**/*.js",
        "routes/**/*.js",
        "!**/*.test.js"
    ]
};