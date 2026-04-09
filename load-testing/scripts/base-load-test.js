// Brenna Lauren Tan Jia Ern, A0254710M
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, createOptions } from './config.js';

export const options = createOptions();

export default function () {
  const res = http.get(`${BASE_URL}/`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}