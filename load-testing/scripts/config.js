// Brenna Lauren Tan Jia Ern, A0254710M

export const BASE_URL = 'http://localhost:3000';

export const defaultStages = [
  { duration: '30s', target: 5 },   // ramp up to 5 users
  { duration: '1m', target: 5 },    // stay at 5 users
  { duration: '30s', target: 20 },  // ramp up to 20 users
  { duration: '1m', target: 20 },   // stay at 20 users
  { duration: '30s', target: 0 },   // ramp down
];

export const defaultThresholds = {
  http_req_failed: ['rate<0.01'],      // error rate < 1%
  http_req_duration: ['p(95)<2000'],   // 95% of requests < 2s
};

export function createOptions(stages = defaultStages) {
  return {
    stages,
    thresholds: defaultThresholds,
  };
}