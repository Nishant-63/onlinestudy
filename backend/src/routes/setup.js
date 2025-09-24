const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const router = express.Router();

// Helper function to run database queries
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Create demo accounts endpoint
router.post('/create-demo-accounts', async (req, res) => {
  try {
    console.log('Creating demo accounts...');

    // Demo Teachers
    const teachers = [
      {
        id: uuidv4(),
        email: 'john.doe@onlinestudy.com',
        password: 'teacher123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'teacher',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'sarah.smith@onlinestudy.com',
        password: 'teacher123',
        first_name: 'Sarah',
        last_name: 'Smith',
        role: 'teacher',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'mike.johnson@onlinestudy.com',
        password: 'teacher123',
        first_name: 'Mike',
        last_name: 'Johnson',
        role: 'teacher',
        status: 'approved'
      }
    ];

    // Demo Students
    const students = [
      {
        id: uuidv4(),
        email: 'alice.student@onlinestudy.com',
        password: 'student123',
        first_name: 'Alice',
        last_name: 'Williams',
        role: 'student',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'bob.student@onlinestudy.com',
        password: 'student123',
        first_name: 'Bob',
        last_name: 'Brown',
        role: 'student',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'carol.student@onlinestudy.com',
        password: 'student123',
        first_name: 'Carol',
        last_name: 'Davis',
        role: 'student',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'david.student@onlinestudy.com',
        password: 'student123',
        first_name: 'David',
        last_name: 'Miller',
        role: 'student',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'emma.student@onlinestudy.com',
        password: 'student123',
        first_name: 'Emma',
        last_name: 'Wilson',
        role: 'student',
        status: 'approved'
      },
      {
        id: uuidv4(),
        email: 'frank.student@onlinestudy.com',
        password: 'student123',
        first_name: 'Frank',
        last_name: 'Moore',
        role: 'student',
        status: 'pending'
      },
      {
        id: uuidv4(),
        email: 'grace.student@onlinestudy.com',
        password: 'student123',
        first_name: 'Grace',
        last_name: 'Taylor',
        role: 'student',
        status: 'pending'
      }
    ];

    const createdAccounts = [];

    // Create teachers
    for (const teacher of teachers) {
      const hashedPassword = await bcrypt.hash(teacher.password, 10);
      await runQuery(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        [teacher.id, teacher.email, hashedPassword, teacher.first_name, teacher.last_name, teacher.role, teacher.status]
      );
      createdAccounts.push({
        email: teacher.email,
        password: teacher.password,
        name: `${teacher.first_name} ${teacher.last_name}`,
        role: teacher.role,
        status: teacher.status
      });
    }

    // Create students
    for (const student of students) {
      const hashedPassword = await bcrypt.hash(student.password, 10);
      await runQuery(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        [student.id, student.email, hashedPassword, student.first_name, student.last_name, student.role, student.status]
      );
      createdAccounts.push({
        email: student.email,
        password: student.password,
        name: `${student.first_name} ${student.last_name}`,
        role: student.role,
        status: student.status
      });
    }

    res.json({
      success: true,
      message: 'Demo accounts created successfully!',
      accounts: createdAccounts
    });

  } catch (error) {
    console.error('Error creating demo accounts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create demo accounts',
      details: error.message
    });
  }
});

module.exports = router;
