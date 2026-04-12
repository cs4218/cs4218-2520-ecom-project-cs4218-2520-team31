// Fajar Ibnu Fatihan, A0314606L
// Story 4.4: Injection Security Tests
// Category: Injection
// Technique: Penetration Testing

import http from "k6/http";
import { check, group } from "k6";
import { ENDPOINTS, HEADERS } from "./config.js";
import { loginUser } from "./helpers.js";

export const options = {
  iterations: 1,
  vus: 1,
  thresholds: {
    checks: ["rate==1.0"],
  },
};

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "testadmin@test.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "testadmin123";

export default function () {
  // Test 1: $gt operator injection on login
  group("NoSQL $gt injection on login", function () {
    const res = http.post(
      ENDPOINTS.login,
      JSON.stringify({
        email: { $gt: "" },
        password: { $gt: "" },
      }),
      { headers: HEADERS.json }
    );
    check(res, {
      "$gt injection does not return a token": (r) => {
        const body = JSON.parse(r.body || "{}");
        return !body.token;
      },
      "$gt injection does not return 200 with success": (r) => {
        const body = JSON.parse(r.body || "{}");
        return !(r.status === 200 && body.success === true);
      },
    });
  });

  // Test 2: $ne operator injection on login
  group("NoSQL $ne injection on login", function () {
    const res = http.post(
      ENDPOINTS.login,
      JSON.stringify({
        email: { $ne: "" },
        password: { $ne: "" },
      }),
      { headers: HEADERS.json }
    );
    check(res, {
      "$ne injection does not return a token": (r) => {
        const body = JSON.parse(r.body || "{}");
        return !body.token;
      },
    });
  });

  // Test 3: $regex injection on login
  group("NoSQL $regex injection on login", function () {
    const res = http.post(
      ENDPOINTS.login,
      JSON.stringify({
        email: { $regex: ".*" },
        password: { $gt: "" },
      }),
      { headers: HEADERS.json }
    );
    check(res, {
      "$regex injection does not return a token": (r) => {
        const body = JSON.parse(r.body || "{}");
        return !body.token;
      },
    });
  });

  // BUG: forgot-password vulnerable to NoSQL injection (authController.js:133)
  group("NoSQL injection on forgot-password", function () {
    const res = http.post(
      ENDPOINTS.forgotPassword,
      JSON.stringify({
        email: { $gt: "" },
        answer: { $gt: "" },
        newPassword: "hacked123",
      }),
      { headers: HEADERS.json }
    );
    check(res, {
      "VULNERABILITY: forgot-password accepts operator injection": (r) => {
        const body = JSON.parse(r.body || "{}");
        return r.status === 200 && body.success === true;
      },
    });

    // Verify the admin can still log in with the original password
    const { token } = loginUser(ADMIN_EMAIL, ADMIN_PASSWORD);
    check(null, {
      "admin can still login after injection attempt": () => token !== null,
    });
  });

  // Test 5: Role injection on registration
  group("Role injection on register", function () {
    const email = `inject_role_${Date.now()}@test.com`;
    const res = http.post(
      ENDPOINTS.register,
      JSON.stringify({
        name: "Injected Admin",
        email: email,
        password: "inject123",
        phone: "1234567890",
        address: "Test Address",
        answer: "Test Answer",
        role: 1,
      }),
      { headers: HEADERS.json }
    );
    check(res, {
      "register with role:1 does not create admin": (r) => {
        const body = JSON.parse(r.body || "{}");
        return !body.user || body.user.role !== 1;
      },
    });
  });

  // BUG: product filter does not validate input types (productController.js:246)
  group("NoSQL injection on product filters", function () {
    const res = http.post(
      ENDPOINTS.getProduct.replace("get-product", "product-filters"),
      JSON.stringify({
        checked: { $gt: "" },
        radio: { $gt: "" },
      }),
      { headers: HEADERS.json }
    );
    check(res, {
      "VULNERABILITY: product filter accepts malformed input": (r) =>
        r.status === 200,
    });
  });
}