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