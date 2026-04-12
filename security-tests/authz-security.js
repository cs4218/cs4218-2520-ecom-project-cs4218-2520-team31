// Fajar Ibnu Fatihan, A0314606L
// Story 4.3: Authorization & Access Control Security Tests
// Category: Broken Access Control
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

const REG_NAME = "AuthzTestUser";
const REG_EMAIL = `authztest_${Date.now()}@test.com`;
const REG_PASSWORD = "authztest123";
const REG_PHONE = "1234567890";
const REG_ADDRESS = "Test Address";
const REG_ANSWER = "Test Answer";

const FAKE_ID = "000000000000000000000000";

export default function () {
  registerUser(REG_NAME, REG_EMAIL, REG_PASSWORD, REG_PHONE, REG_ADDRESS, REG_ANSWER);
  const { token: regularToken } = loginUser(REG_EMAIL, REG_PASSWORD);
  const { token: adminToken } = loginUser(ADMIN_EMAIL, ADMIN_PASSWORD);

  // Test 1: Regular user → admin category routes
  group("Regular user cannot create category", function () {
    const res = http.post(
      ENDPOINTS.createCategory,
      JSON.stringify({ name: "Hacked Category" }),
      { headers: authHeader(regularToken) }
    );
    check(res, {
      "regular user create category returns 401": (r) => r.status === 401,
    });
  });

  group("Regular user cannot update category", function () {
    const res = http.put(
      ENDPOINTS.updateCategory(FAKE_ID),
      JSON.stringify({ name: "Hacked Update" }),
      { headers: authHeader(regularToken) }
    );
    check(res, {
      "regular user update category returns 401": (r) => r.status === 401,
    });
  });

  group("Regular user cannot delete category", function () {
    const res = http.del(ENDPOINTS.deleteCategory(FAKE_ID), null, {
      headers: authHeader(regularToken),
    });
    check(res, {
      "regular user delete category returns 401": (r) => r.status === 401,
    });
  });

  // Test 2: Regular user → admin product routes
  group("Regular user cannot create product", function () {
    const res = http.post(
      ENDPOINTS.createProduct,
      JSON.stringify({ name: "Hacked Product" }),
      { headers: authHeader(regularToken) }
    );
    check(res, {
      "regular user create product returns 401": (r) => r.status === 401,
    });
  });

  group("Regular user cannot update product", function () {
    const res = http.put(
      ENDPOINTS.updateProduct(FAKE_ID),
      JSON.stringify({ name: "Hacked Update" }),
      { headers: authHeader(regularToken) }
    );
    check(res, {
      "regular user update product returns 401": (r) => r.status === 401,
    });
  });

  // BUG: delete-product route has no requireSignIn/isAdmin middleware (productRoutes.js:50)
  group("Regular user cannot delete product", function () {
    const res = http.del(ENDPOINTS.deleteProduct(FAKE_ID), null, {
      headers: authHeader(regularToken),
    });
    check(res, {
      "VULNERABILITY: delete-product has no auth middleware (not 401)": (r) =>
        r.status !== 401,
    });
  });

  // Test 3: Regular user → admin order routes
  group("Regular user cannot access all orders", function () {
    const res = http.get(ENDPOINTS.allOrders, {
      headers: authHeader(regularToken),
    });
    check(res, {
      "regular user all-orders returns 401": (r) => r.status === 401,
    });
  });

  group("Regular user cannot access admin-auth", function () {
    const res = http.get(ENDPOINTS.adminAuth, {
      headers: authHeader(regularToken),
    });
    check(res, {
      "regular user admin-auth returns 401": (r) => r.status === 401,
    });
  });

  // Test 4: Unauthenticated → protected routes
  group("Unauthenticated cannot create category", function () {
    const res = http.post(
      ENDPOINTS.createCategory,
      JSON.stringify({ name: "No Auth Category" }),
      { headers: HEADERS.json }
    );
    check(res, {
      "unauth create category returns 401": (r) => r.status === 401,
    });
  });

  group("Unauthenticated cannot create product", function () {
    const res = http.post(
      ENDPOINTS.createProduct,
      JSON.stringify({ name: "No Auth Product" }),
      { headers: HEADERS.json }
    );
    check(res, {
      "unauth create product returns 401": (r) => r.status === 401,
    });
  });

  group("Unauthenticated cannot access orders", function () {
    const res = http.get(ENDPOINTS.orders, { headers: HEADERS.json });
    check(res, {
      "unauth orders returns 401": (r) => r.status === 401,
    });
  });

  group("Unauthenticated cannot access all orders", function () {
    const res = http.get(ENDPOINTS.allOrders, { headers: HEADERS.json });
    check(res, {
      "unauth all-orders returns 401": (r) => r.status === 401,
    });
  });

  // BUG: same vulnerability as above — unauthenticated delete not blocked
  group("Unauthenticated cannot delete product", function () {
    const res = http.del(ENDPOINTS.deleteProduct(FAKE_ID), null, {
      headers: HEADERS.json,
    });
    check(res, {
      "VULNERABILITY: unauth delete-product not blocked (not 401)": (r) =>
        r.status !== 401,
    });
  });

  // Test 5: Positive control — admin can access admin routes
  group("Admin can access admin-auth", function () {
    const res = http.get(ENDPOINTS.adminAuth, {
      headers: authHeader(adminToken),
    });
    check(res, {
      "admin admin-auth returns 200": (r) => r.status === 200,
    });
  });

  group("Admin can access all orders", function () {
    const res = http.get(ENDPOINTS.allOrders, {
      headers: authHeader(adminToken),
    });
    check(res, {
      "admin all-orders returns 200": (r) => r.status === 200,
    });
  });
}