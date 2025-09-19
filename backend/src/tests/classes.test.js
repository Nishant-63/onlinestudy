const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

describe('Classes Endpoints', () => {
  let teacherToken;
  let studentToken;
  let teacherId;
  let studentId;
  let classId;

  beforeAll(async () => {
    // Create test teacher
    const bcrypt = require('bcryptjs');
    const teacherPasswordHash = await bcrypt.hash('password123', 12);
    
    const teacherResult = await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      ['test-teacher-id', 'teacher@test.com', teacherPasswordHash, 'Test', 'Teacher', 'teacher', 'approved']
    );
    teacherId = teacherResult.rows[0].id;

    // Create test student
    const studentPasswordHash = await bcrypt.hash('password123', 12);
    
    const studentResult = await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      ['test-student-id', 'student@test.com', studentPasswordHash, 'Test', 'Student', 'student', 'approved']
    );
    studentId = studentResult.rows[0].id;

    // Login teacher
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'password123' });
    teacherToken = teacherLogin.body.accessToken;

    // Login student
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'password123' });
    studentToken = studentLogin.body.accessToken;
  });

  beforeEach(async () => {
    // Clean up classes
    await pool.query('DELETE FROM classes WHERE teacher_id = $1', [teacherId]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [teacherId, studentId]);
    await pool.end();
  });

  describe('POST /api/classes', () => {
    it('should create a new class as teacher', async () => {
      const classData = {
        name: 'Test Class',
        description: 'A test class for unit testing'
      };

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(classData)
        .expect(201);

      expect(response.body.message).toBe('Class created successfully');
      expect(response.body.class.name).toBe('Test Class');
      expect(response.body.class.teacher_id).toBe(teacherId);
      
      classId = response.body.class.id;
    });

    it('should reject class creation by student', async () => {
      const classData = {
        name: 'Test Class',
        description: 'A test class for unit testing'
      };

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(classData)
        .expect(403);

      expect(response.body.error).toBe('Teacher access required');
    });

    it('should reject class creation without authentication', async () => {
      const classData = {
        name: 'Test Class',
        description: 'A test class for unit testing'
      };

      const response = await request(app)
        .post('/api/classes')
        .send(classData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should validate required fields', async () => {
      const classData = {
        description: 'A test class without name'
      };

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(classData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/classes/teacher', () => {
    beforeEach(async () => {
      // Create test class
      const classResult = await pool.query(
        'INSERT INTO classes (id, name, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test-class-id', 'Test Class', 'Test Description', teacherId]
      );
      classId = classResult.rows[0].id;
    });

    it('should get teacher classes', async () => {
      const response = await request(app)
        .get('/api/classes/teacher')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.classes).toHaveLength(1);
      expect(response.body.classes[0].name).toBe('Test Class');
      expect(response.body.pagination).toBeDefined();
    });

    it('should reject request from student', async () => {
      const response = await request(app)
        .get('/api/classes/teacher')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.error).toBe('Teacher access required');
    });
  });

  describe('GET /api/classes/student', () => {
    beforeEach(async () => {
      // Create test class and enroll student
      const classResult = await pool.query(
        'INSERT INTO classes (id, name, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test-class-id-2', 'Student Test Class', 'Test Description', teacherId]
      );
      classId = classResult.rows[0].id;

      await pool.query(
        'INSERT INTO class_enrollments (id, class_id, student_id) VALUES ($1, $2, $3)',
        ['test-enrollment-id', classId, studentId]
      );
    });

    it('should get student enrolled classes', async () => {
      const response = await request(app)
        .get('/api/classes/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.classes).toHaveLength(1);
      expect(response.body.classes[0].name).toBe('Student Test Class');
    });

    it('should reject request from teacher', async () => {
      const response = await request(app)
        .get('/api/classes/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.error).toBe('Student access required');
    });
  });

  describe('POST /api/classes/:id/enroll', () => {
    beforeEach(async () => {
      // Create test class
      const classResult = await pool.query(
        'INSERT INTO classes (id, name, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test-class-id-3', 'Enrollment Test Class', 'Test Description', teacherId]
      );
      classId = classResult.rows[0].id;
    });

    it('should enroll student in class', async () => {
      const response = await request(app)
        .post(`/api/classes/${classId}/enroll`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ studentId })
        .expect(201);

      expect(response.body.message).toBe('Student enrolled successfully');
    });

    it('should reject enrollment of non-existent student', async () => {
      const response = await request(app)
        .post(`/api/classes/${classId}/enroll`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ studentId: 'non-existent-id' })
        .expect(404);

      expect(response.body.error).toBe('Student not found');
    });

    it('should reject duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post(`/api/classes/${classId}/enroll`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ studentId })
        .expect(201);

      // Second enrollment
      const response = await request(app)
        .post(`/api/classes/${classId}/enroll`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ studentId })
        .expect(400);

      expect(response.body.error).toBe('Student already enrolled in this class');
    });
  });

  describe('GET /api/classes/:id', () => {
    beforeEach(async () => {
      // Create test class
      const classResult = await pool.query(
        'INSERT INTO classes (id, name, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test-class-id-4', 'Details Test Class', 'Test Description', teacherId]
      );
      classId = classResult.rows[0].id;
    });

    it('should get class details for teacher', async () => {
      const response = await request(app)
        .get(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.class.name).toBe('Details Test Class');
      expect(response.body.class.teacher_id).toBe(teacherId);
    });

    it('should get class details for enrolled student', async () => {
      // Enroll student
      await pool.query(
        'INSERT INTO class_enrollments (id, class_id, student_id) VALUES ($1, $2, $3)',
        ['test-enrollment-id-2', classId, studentId]
      );

      const response = await request(app)
        .get(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.class.name).toBe('Details Test Class');
    });

    it('should reject access for non-enrolled student', async () => {
      const response = await request(app)
        .get(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied to this class');
    });
  });
});
