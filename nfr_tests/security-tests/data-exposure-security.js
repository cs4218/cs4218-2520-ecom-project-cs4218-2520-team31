// Fajar Ibnu Fatihan, A0314606L
// Story 4.5: Sensitive Data Exposure Security Tests
// Category: Exception Handling Flaws (prof slides) / Sensitive Data Exposure (OWASP)
// Technique: Penetration Testing

import http from "k6/http";
import { check, group } from "k6";
import { ENDPOINTS, HEADERS, authHeader } from "./config.js";
import { registerUser, loginUser } from "./helpers.js";

export const options = {
  iterations: 1,
  vus: 1,
  thresholds: {
    checks: ["rate==1.0"],
  },
};

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "testadmin@test.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "testadmin123";

const REG_NAME = "DataExpTestUser";
const REG_EMAIL = `dataexp_${Date.now()}@test.com`;
const REG_PASSWORD = "dataexp123";
const REG_PHONE = "1234567890";
const REG_ADDRESS = "Test Address";
const REG_ANSWER = "Test Answer";

export default function () {
  registerUser(REG_NAME, REG_EMAIL, REG_PASSWORD, REG_PHONE, REG_ADDRESS, REG_ANSWER);
  const { token: regularToken } = loginUser(REG_EMAIL, REG_PASSWORD);
  const { token: adminToken } = loginUser(ADMIN_EMAIL, ADMIN_PASSWORD);

  // Test 1: Server technology fingerprinting
  group("Server technology headers", function () {
    const res = http.get(ENDPOINTS.getProduct);
    check(res, {
      "VULNERABILITY: X-Powered-By header exposes server technology": (r) =>
        r.headers["X-Powered-By"] !== undefined ||
        r.headers["x-powered-by"] !== undefined,
    });
  });

  // Test 2: Registration response leaks password hash (authController.js:53)
  group("Registration response does not leak password hash", function () {
    const uniqueEmail = `dataexp_leak_${Date.now()}@test.com`;
    const res = registerUser(
      "LeakTest",
      uniqueEmail,
      "leaktest123",
      "1234567890",
      "Test Address",
      "Test Answer"
    );
    check(res, {
      "VULNERABILITY: register response contains bcrypt hash": (r) =>
        (r.body || "").includes("$2b$") || (r.body || "").includes("$2a$"),
    });
  });

  // Test 3: Login response does not leak password hash
  group("Login response does not leak password hash", function () {
    const { res } = loginUser(REG_EMAIL, REG_PASSWORD);
    const body = res.body || "";
    check(res, {
      "login response does not contain password field": (r) => {
        const parsed = JSON.parse(r.body || "{}");
        return !parsed.user || parsed.user.password === undefined;
      },
      "login response body has no bcrypt pattern": (r) =>
        !body.includes("$2b$") && !body.includes("$2a$"),
    });
  });

  // Test 4: Error responses leak internal details
  group("Error response does not leak stack traces", function () {
    const res = http.post(
      ENDPOINTS.login,
      "this is not valid json",
      { headers: HEADERS.json }
    );
    check(res, {
      "VULNERABILITY: error response contains stack trace": (r) =>
        (r.body || "").includes("at ") || (r.body || "").includes("node_modules"),
      "VULNERABILITY: error response contains file paths": (r) =>
        (r.body || "").includes("/Users/") ||
        (r.body || "").includes("/home/") ||
        (r.body || "").includes(":\\"),
    });
  });

  // Test 5: Error responses do not leak database info
  group("Error response does not leak database info", function () {
    const res = http.post(
      ENDPOINTS.register,
      JSON.stringify({
        name: "a",
        email: "not-an-email",
        password: "a",
        phone: "a",
        address: "a",
        answer: "a",
      }),
      { headers: HEADERS.json }
    );
    const body = res.body || "";
    check(res, {
      "error response has no MongoDB connection string": (r) =>
        !body.includes("mongodb://") && !body.includes("mongodb+srv://"),
      "error response has no database collection names": (r) =>
        !body.includes("userModel") && !body.includes("users"),
    });
  });

  // Test 6: Profile update leaks password hash (authController.js:190)
  group("Profile update does not leak password hash", function () {
    const res = http.put(
      ENDPOINTS.profile,
      JSON.stringify({ name: "Updated Name" }),
      { headers: authHeader(regularToken) }
    );
    const body = res.body || "";
    check(res, {
      "VULNERABILITY: profile update response contains bcrypt hash": (r) =>
        body.includes("$2b$") || body.includes("$2a$"),
    });
  });

  // Test 7: Registration response leaks security answer
  group("Registration does not leak security answer", function () {
    const uniqueEmail = `dataexp_answer_${Date.now()}@test.com`;
    const secretAnswer = "MySecretAnswer123";
    const res = registerUser(
      "AnswerLeakTest",
      uniqueEmail,
      "answertest123",
      "1234567890",
      "Test Address",
      secretAnswer
    );
    check(res, {
      "VULNERABILITY: register response contains security answer": (r) =>
        (r.body || "").includes(secretAnswer),
    });
  });

  // Test 8: Public product endpoints do not leak seller info
  group("Product listing does not leak sensitive seller data", function () {
    const res = http.get(ENDPOINTS.getProduct);
    const body = res.body || "";
    check(res, {
      "product listing has no bcrypt patterns": (r) =>
        !body.includes("$2b$") && !body.includes("$2a$"),
      "product listing has no email patterns in unexpected places": (r) => {
        const parsed = JSON.parse(r.body || "{}");
        const str = JSON.stringify(parsed.products || []);
        return !str.includes("password");
      },
    });
  });
}