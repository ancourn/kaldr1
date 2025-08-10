import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Less than 10% of requests should fail
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test blockchain status API
  res = http.get(`${BASE_URL}/api/blockchain/status`);
  check(res, {
    'blockchain status API is 200': (r) => r.status === 200,
    'blockchain API response time < 300ms': (r) => r.timings.duration < 300,
    'blockchain API has correct structure': (r) => {
      let body;
      try {
        body = JSON.parse(r.body);
        return body.status !== undefined && body.networks !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test contracts API
  res = http.get(`${BASE_URL}/api/blockchain/contracts`);
  check(res, {
    'contracts API is 200': (r) => r.status === 200,
    'contracts API response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);

  // Test transactions API
  res = http.get(`${BASE_URL}/api/blockchain/transactions?limit=10`);
  check(res, {
    'transactions API is 200': (r) => r.status === 200,
    'transactions API response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'performance-summary.json': JSON.stringify(data),
  };
}