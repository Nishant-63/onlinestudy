const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create sample teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    
    const teacherResult = await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role,
         status = EXCLUDED.status
       RETURNING id`,
      [uuidv4(), 'teacher@onlinestudy.com', teacherPassword, 'John', 'Doe', 'teacher', 'approved']
    );
    
    const teacherId = teacherResult.rows[0].id;

    // Create sample students
    const students = [
      { email: 'student1@onlinestudy.com', firstName: 'Alice', lastName: 'Smith' },
      { email: 'student2@onlinestudy.com', firstName: 'Bob', lastName: 'Johnson' },
      { email: 'student3@onlinestudy.com', firstName: 'Carol', lastName: 'Williams' }
    ];

    const studentIds = [];
    for (const student of students) {
      const studentPassword = await bcrypt.hash('student123', 12);
      
      const studentResult = await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           status = EXCLUDED.status
         RETURNING id`,
        [uuidv4(), student.email, studentPassword, student.firstName, student.lastName, 'student', 'approved']
      );
      
      studentIds.push(studentResult.rows[0].id);
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
    console.log('\nSample accounts created:');
    console.log('Teacher: teacher@onlinestudy.com / teacher123');
    console.log('Students: student1@onlinestudy.com / student123');
    console.log('Students: student2@onlinestudy.com / student123');
    console.log('Students: student3@onlinestudy.com / student123');

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
