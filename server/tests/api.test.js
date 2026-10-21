import test from 'node:test';
import assert from 'node:assert';
import request from 'http';
import app from '../app.js';

let server;
let baseUrl;

test.before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

const makeGet = (path) => {
  return new Promise((resolve, reject) => {
    request.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
};

const makePost = (path, payload) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = request.request(
      `${baseUrl}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

test('GET /api/health returns 200 OK and healthy status', async () => {
  const res = await makeGet('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'healthy');
  assert.ok(res.body.weatherService);
});

test('GET /api/weather/search returns search results for London', async () => {
  const res = await makeGet('/api/weather/search?q=London');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.results));
  assert.ok(res.body.results.length > 0);
  assert.strictEqual(res.body.results[0].name.toLowerCase(), 'london');
});

test('GET /api/weather/current validates missing city and coordinates', async () => {
  const res = await makeGet('/api/weather/current');
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/register rejects mismatched passwords', async () => {
  const res = await makePost('/api/auth/register', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'differentpassword'
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/ai/chat returns intelligent weather analysis', async () => {
  const res = await makePost('/api/ai/chat', {
    message: 'Should I carry an umbrella?',
    weatherContext: {
      current: { city: 'Tokyo', condition: 'Rain', tempC: 15, humidity: 85 },
      hourly: [{ time: '14:00', pop: 80 }]
    }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.reply.includes('umbrella'));
});

test('POST /api/auth/google creates or logs in a Google user', async () => {
  const res = await makePost('/api/auth/google', {
    name: 'Google Test User',
    email: 'googletest@example.com',
    googleId: 'google_123456789',
    picture: 'https://example.com/avatar.png'
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.email, 'googletest@example.com');
  assert.strictEqual(res.body.user.name, 'Google Test User');
});

