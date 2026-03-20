module.exports = {
    displayName: "integration",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/tests/setupEnv.js"],
    testMatch: [
        "<rootDir>/tests/integration/**/*.integration.test.js"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        "controllers/**/*.js",
        "middlewares/**/*.js",
        "routes/**/*.js",
        "!**/*.test.js"
    ]
};