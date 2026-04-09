// Brenna Lauren Tan Jia Ern, A0254710M

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, createOptions, lightStages, mediumStages, heavyStages } from './config.js';

export const options = createOptions(heavyStages);

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/product/product-list/1`);

  let body;
  try {
    body = res.json();
  } catch (error) {
    body = null;
  }

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body is not empty': (r) => !!r.body,
    'response is valid JSON': () => body !== null,
    'products array exists': () => body && Array.isArray(body.products),
  });

  sleep(1);
}