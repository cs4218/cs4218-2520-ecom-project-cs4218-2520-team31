// Fajar Ibnu Fatihan, A0314606L
// Story 4.2: Authentication Security Tests
// Category: Broken Authentication
// Technique: Penetration Testing

import http from "k6/http";
import encoding from "k6/encoding";
import { check, group } from "k6";
import { ENDPOINTS, HEADERS, authHeader } from "./config.js";
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

function decodeBase64url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = encoding.b64decode(base64, "rawstd");
  return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

function encodeBase64url(str) {
  const bytes = new Uint8Array(str.split("").map((c) => c.charCodeAt(0)));
  return encoding
    .b64encode(bytes, "rawstd")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export default function () {
  const { token } = loginUser(ADMIN_EMAIL, ADMIN_PASSWORD);

  // Test 1: JWT Tampering — modified payload
  group("JWT Tampering - modified payload", function () {
    if (token) {
      const parts = token.split(".");
      const payload = JSON.parse(decodeBase64url(parts[1]));
      payload._id = "000000000000000000000000";
      const tamperedPayload = encodeBase64url(JSON.stringify(payload));
      const tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

      const res = http.get(ENDPOINTS.userAuth, {
        headers: authHeader(tamperedToken),
      });
      check(res, {
        "tampered JWT returns 401": (r) => r.status === 401,
      });
    }
  });

  // Test 2: Forged JWT with wrong secret
  group("JWT Forged with wrong secret", function () {
    const fakeHeader = encodeBase64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const fakePayload = encodeBase64url(
      JSON.stringify({ _id: "000000000000000000000000", iat: Math.floor(Date.now() / 1000) })
    );
    const forgedToken = fakeHeader + "." + fakePayload + ".fakesignature123";

    const res = http.get(ENDPOINTS.userAuth, {
      headers: authHeader(forgedToken),
    });
    check(res, {
      "forged JWT returns 401": (r) => r.status === 401,
    });
  });

  // Test 3: Algorithm "none" attack (CVE-2015-9235)
  group("Algorithm none attack", function () {
    const noneHeader = encodeBase64url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const nonePayload = encodeBase64url(
      JSON.stringify({
        _id: "000000000000000000000000",
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const noneToken1 = noneHeader + "." + nonePayload + ".";
    const noneToken2 = noneHeader + "." + nonePayload;

    const res1 = http.get(ENDPOINTS.userAuth, {
      headers: authHeader(noneToken1),
    });
    const res2 = http.get(ENDPOINTS.userAuth, {
      headers: authHeader(noneToken2),
    });
    check(res1, {
      "alg:none with empty signature returns 401": (r) => r.status === 401,
    });
    check(res2, {
      "alg:none without signature returns 401": (r) => r.status === 401,
    });
  });

  // Test 4: Malformed Authorization header
  group("Malformed Authorization header", function () {
    const malformedValues = [
      "not-a-jwt",
      "Bearer ",
      "Bearer not.valid.token",
      "12345",
      "",
    ];

    malformedValues.forEach((val, i) => {
      const res = http.get(ENDPOINTS.userAuth, {
        headers: { Authorization: val },
      });
      check(res, {
        [`malformed auth header #${i + 1} returns 401`]: (r) => r.status === 401,
      });
    });
  });

  // Test 5: No Authorization header
  group("No Authorization header", function () {
    const res = http.get(ENDPOINTS.userAuth);
    check(res, {
      "no auth header returns 401": (r) => r.status === 401,
    });
  });

  // Test 6: Password hash not in login response
  group("Password not exposed in login response", function () {
    const res = http.post(
      ENDPOINTS.login,
      JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      { headers: HEADERS.json }
    );
    check(res, {
      "login response does not contain password field": (r) => {
        const parsed = JSON.parse(r.body);
        return parsed.user && parsed.user.password === undefined;
      },
      "login response body does not contain bcrypt hash pattern": (r) =>
        !(r.body || "").includes("$2b$") && !(r.body || "").includes("$2a$"),
    });
  });
}
