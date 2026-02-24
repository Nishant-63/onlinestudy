const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  it('returns 200 with success and database connected when DB is up', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
  });
});
