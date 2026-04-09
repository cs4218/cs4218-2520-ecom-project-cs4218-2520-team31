// Brenna Lauren Tan Jia Ern, A0254710M

export const BASE_URL = 'http://localhost:6060';

export const lightStages = [
  { duration: '20s', target: 5 },
  { duration: '40s', target: 5 },
  { duration: '20s', target: 0 },
];

export const mediumStages = [
  { duration: '30s', target: 10 },
  { duration: '1m', target: 10 },
  { duration: '30s', target: 20 },
  { duration: '1m', target: 20 },
  { duration: '30s', target: 0 },
];

export const heavyStages = [
  { duration: '30s', target: 20 },
  { duration: '1m', target: 20 },
  { duration: '30s', target: 50 },
  { duration: '1m', target: 50 },
  { duration: '30s', target: 0 },
];

export const defaultThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<2000'],
};

export function createOptions(stages = mediumStages) {
  return {
    stages,
    thresholds: defaultThresholds,
  };
}