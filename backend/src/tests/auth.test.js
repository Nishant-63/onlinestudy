const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new teacher successfully', async () => {
      const userData = {
        email: 'test-teacher@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Teacher',
        role: 'teacher'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Teacher account created successfully');
      expect(response.body.user.role).toBe('teacher');
      expect(response.body.user.status).toBe('approved');
      expect(response.body.accessToken).toBeDefined();
    });

    it('should register a new student with pending status', async () => {
      const userData = {
        email: 'test-student@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Student account created. Awaiting teacher approval.');
      expect(response.body.user.role).toBe('student');
      expect(response.body.user.status).toBe('pending');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await pool.query(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['test-user-id', 'test-login@example.com', passwordHash, 'Test', 'User', 'student', 'approved']
      );
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('test-login@example.com');
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for unapproved user', async () => {
      // Create pending user
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await pool.query(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['pending-user-id', 'pending@example.com', passwordHash, 'Pending', 'User', 'student', 'pending']
      );

      const loginData = {
        email: 'pending@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.error).toBe('Account not approved');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      // Create and login user
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('password123', 12);
      
      await pool.query(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['me-user-id', 'me@example.com', passwordHash, 'Me', 'User', 'teacher', 'approved']
      );

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'me@example.com', password: 'password123' });

      const token = loginResponse.body.accessToken;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.email).toBe('me@example.com');
      expect(response.body.user.role).toBe('teacher');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});
