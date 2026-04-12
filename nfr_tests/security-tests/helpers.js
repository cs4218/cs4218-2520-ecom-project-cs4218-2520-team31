// Fajar Ibnu Fatihan, A0314606L

import http from "k6/http";
import { ENDPOINTS, HEADERS } from "./config.js";

export function registerUser(name, email, password, phone, address, answer) {
  return http.post(
    ENDPOINTS.register,
    JSON.stringify({ name, email, password, phone, address, answer }),
    { headers: HEADERS.json }
  );
}

export function loginUser(email, password) {
  const res = http.post(
    ENDPOINTS.login,
    JSON.stringify({ email, password }),
    { headers: HEADERS.json }
  );
  const body = JSON.parse(res.body || "{}");
  return { res, token: body.token || null };
}
