// Brenna Lauren Tan Jia Ern, A0254710M
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const res = http.get('http://localhost:3000');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}