const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    const saltRounds = 12;

    // Demo teachers (same as Login page / DEMO_ACCOUNTS.md)
    const teachers = [
      { email: 'john.doe@onlinestudy.com', firstName: 'John', lastName: 'Doe' },
      { email: 'sarah.smith@onlinestudy.com', firstName: 'Sarah', lastName: 'Smith' },
      { email: 'mike.johnson@onlinestudy.com', firstName: 'Mike', lastName: 'Johnson' }
    ];

    let teacherId;
    for (const t of teachers) {
      const passwordHash = await bcrypt.hash('teacher123', saltRounds);
      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'teacher', 'approved')
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           status = EXCLUDED.status
         RETURNING id`,
        [uuidv4(), t.email, passwordHash, t.firstName, t.lastName]
      );
      if (!teacherId) teacherId = result.rows[0].id;
    }

    // Demo students (same as Login page; approved)
    const students = [
      { email: 'alice.student@onlinestudy.com', firstName: 'Alice', lastName: 'Williams' },
      { email: 'bob.student@onlinestudy.com', firstName: 'Bob', lastName: 'Brown' },
      { email: 'carol.student@onlinestudy.com', firstName: 'Carol', lastName: 'Davis' },
      { email: 'david.student@onlinestudy.com', firstName: 'David', lastName: 'Miller' },
      { email: 'emma.student@onlinestudy.com', firstName: 'Emma', lastName: 'Wilson' }
    ];

    const studentIds = [];
    for (const s of students) {
      const passwordHash = await bcrypt.hash('student123', saltRounds);
      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'student', 'approved')
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           status = EXCLUDED.status
         RETURNING id`,
        [uuidv4(), s.email, passwordHash, s.firstName, s.lastName]
      );
      studentIds.push(result.rows[0].id);
    }

    // Create sample class
    const classResult = await pool.query(
      `INSERT INTO classes (id, name, description, teacher_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [uuidv4(), 'Mathematics 101', 'Introduction to Algebra and Geometry', teacherId]
    );
    
    const classId = classResult.rows[0].id;

    // Enroll students in class
    for (const studentId of studentIds) {
      const enrollmentId = uuidv4();
      await pool.query(
        `INSERT INTO class_enrollments (id, class_id, student_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (class_id, student_id) DO NOTHING`,
        [enrollmentId, classId, studentId]
      );
    }

    // Create sample video
    const videoId = uuidv4();
    await pool.query(
      `INSERT INTO videos (id, title, description, file_key, file_size, class_id, teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [videoId, 'Introduction to Algebra', 'Basic concepts of algebraic expressions', 'videos/sample.mp4', 1024000, classId, teacherId]
    );

    // Create sample assignment
    const assignmentId = uuidv4();
    await pool.query(
      `INSERT INTO assignments (id, title, description, file_key, file_size, class_id, teacher_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [assignmentId, 'Algebra Practice Problems', 'Complete the exercises in the attached PDF', 'assignments/sample.pdf', 512000, classId, teacherId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    // Create sample attendance records
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < studentIds.length; i++) {
      const attendanceId = uuidv4();
      const status = i === 0 ? 'present' : i === 1 ? 'late' : 'absent';
      
      await pool.query(
        `INSERT INTO attendance (id, class_id, student_id, date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (class_id, student_id, date) DO NOTHING`,
        [attendanceId, classId, studentIds[i], today, status, teacherId]
      );
    }

    // Create sample remarks
    const remarkId = uuidv4();
    await pool.query(
      `INSERT INTO remarks (id, class_id, student_id, teacher_id, content)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [remarkId, classId, studentIds[0], teacherId, 'Great participation in today\'s class! Keep up the excellent work.']
    );

    console.log('Database seeding completed successfully!');
    console.log('\nDemo accounts (use these on the Login page):');
    console.log('Teachers (password: teacher123): john.doe@onlinestudy.com, sarah.smith@onlinestudy.com, mike.johnson@onlinestudy.com');
    console.log('Students (password: student123): alice.student@onlinestudy.com, bob.student@onlinestudy.com, carol.student@onlinestudy.com, david.student@onlinestudy.com, emma.student@onlinestudy.com');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
