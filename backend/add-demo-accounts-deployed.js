const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
require('dotenv').config();

// Connect to deployed database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://onlinestudy_user:password@dpg-demo123.onrender.com/onlinestudy',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addDemoAccounts() {
  try {
    console.log('Adding demo accounts to deployed database...');

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

    // Create teachers
    for (const teacher of teachers) {
      const hashedPassword = await bcrypt.hash(teacher.password, 10);
      await pool.query(
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
      console.log(`✅ Teacher created: ${teacher.email}`);
    }

    // Create students
    for (const student of students) {
      const hashedPassword = await bcrypt.hash(student.password, 10);
      await pool.query(
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
      console.log(`✅ Student created: ${student.email}`);
    }

    console.log('\n🎉 Demo accounts added successfully!');
    console.log('\n📋 Demo Account Credentials:');
    console.log('\n👨‍🏫 TEACHERS:');
    console.log('  • john.doe@onlinestudy.com / teacher123');
    console.log('  • sarah.smith@onlinestudy.com / teacher123');
    console.log('  • mike.johnson@onlinestudy.com / teacher123');
    
    console.log('\n👨‍🎓 STUDENTS (Approved):');
    console.log('  • alice.student@onlinestudy.com / student123');
    console.log('  • bob.student@onlinestudy.com / student123');
    console.log('  • carol.student@onlinestudy.com / student123');
    console.log('  • david.student@onlinestudy.com / student123');
    console.log('  • emma.student@onlinestudy.com / student123');
    
    console.log('\n⏳ STUDENTS (Pending Approval):');
    console.log('  • frank.student@onlinestudy.com / student123');
    console.log('  • grace.student@onlinestudy.com / student123');

  } catch (error) {
    console.error('Error adding demo accounts:', error);
  } finally {
    await pool.end();
  }
}

addDemoAccounts();
