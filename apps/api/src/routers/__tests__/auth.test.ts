import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

const isDummyDb = process.env.DATABASE_URL?.includes('dummy');

describe.skipIf(isDummyDb)('Auth API', () => {
  describe('POST /api/auth/sign-up/email', () => {
    it('should create a new user with valid data', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Test User',
          email: uniqueEmail,
          password: 'TestPass123',
          role: 'TRAINEE',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(uniqueEmail);
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.role).toBe('TRAINEE');
      expect(response.body.user.emailVerified).toBe(false);
    });

    it('should create a TRAINER user when role is TRAINER', async () => {
      const uniqueEmail = `trainer-${Date.now()}@example.com`;

      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Test Trainer',
          email: uniqueEmail,
          password: 'TestPass123',
          role: 'TRAINER',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('TRAINER');
    });

    it('should reject registration with missing name', async () => {
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'TestPass123',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      const uniqueEmail = `duplicate-${Date.now()}@example.com`;

      // First registration should succeed
      await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          name: 'First User',
          email: uniqueEmail,
          password: 'TestPass123',
        })
        .set('Content-Type', 'application/json');

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/sign-up/email')
        .send({
          name: 'Second User',
          email: uniqueEmail,
          password: 'TestPass123',
        })
        .set('Content-Type', 'application/json');

      // With requireEmailVerification enabled, Better Auth returns 200 with a
      // synthetic user to prevent email enumeration attacks
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.token).toBeNull();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
