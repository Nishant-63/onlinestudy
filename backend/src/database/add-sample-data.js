const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

async function addSampleData() {
  try {
    console.log('Adding sample data...');

    // Get existing teacher ID
    const teacherResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      ['teacher@onlinestudy.com', 'teacher']
    );
    
    if (teacherResult.rows.length === 0) {
      console.log('Teacher not found!');
      return;
    }
    
    const teacherId = teacherResult.rows[0].id;
    console.log('Teacher ID:', teacherId);

    // Get existing student IDs
    const studentsResult = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      ['student']
    );
    
    const studentIds = studentsResult.rows.map(row => row.id);
    console.log('Student IDs:', studentIds);

    // Create sample class
    const classResult = await pool.query(
      `INSERT INTO classes (id, name, description, teacher_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description
       RETURNING id`,
      [uuidv4(), 'Mathematics 101', 'Introduction to Algebra and Geometry', teacherId]
    );
    
    const classId = classResult.rows[0].id;
    console.log('Class created with ID:', classId);

    // Enroll students in class
    for (const studentId of studentIds) {
      await pool.query(
        `INSERT INTO class_enrollments (id, class_id, student_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (class_id, student_id) DO NOTHING`,
        [uuidv4(), classId, studentId]
      );
    }
    console.log('Students enrolled in class');

    // Create sample assignment
    const assignmentResult = await pool.query(
      `INSERT INTO assignments (id, class_id, teacher_id, title, description, file_key, file_size, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [uuidv4(), classId, teacherId, 'Algebra Homework 1', 'Complete exercises 1-10 from chapter 3', 'assignments/sample-assignment.pdf', 1024000, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );
    
    const assignmentId = assignmentResult.rows[0].id;
    console.log('Assignment created with ID:', assignmentId);

    // Create sample video
    const videoResult = await pool.query(
      `INSERT INTO videos (id, class_id, teacher_id, title, description, file_key, file_size, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [uuidv4(), classId, teacherId, 'Introduction to Algebra', 'Basic concepts of algebra', 'videos/sample-video.mp4', 1024000, 1800]
    );
    
    const videoId = videoResult.rows[0].id;
    console.log('Video created with ID:', videoId);

    // Create sample attendance record
    const attendanceResult = await pool.query(
      `INSERT INTO attendance (id, class_id, student_id, date, status, marked_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [uuidv4(), classId, studentIds[0], new Date(), 'present', teacherId]
    );
    
    console.log('Attendance record created');

    // Create sample remark
    const remarkResult = await pool.query(
      `INSERT INTO remarks (id, class_id, student_id, teacher_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [uuidv4(), classId, studentIds[0], teacherId, 'Excellent work on the algebra homework!']
    );
    
    console.log('Remark created');

    console.log('✅ Sample data added successfully!');
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await pool.end();
  }
}

addSampleData();
