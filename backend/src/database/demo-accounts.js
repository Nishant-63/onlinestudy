const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

async function createDemoAccounts() {
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
           updated_at = NOW()
         RETURNING id`,
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
           updated_at = NOW()
         RETURNING id`,
        [student.id, student.email, hashedPassword, student.first_name, student.last_name, student.role, student.status]
      );
      console.log(`✅ Student created: ${student.email}`);
    }

    // Get teacher IDs for creating classes
    const teacherResult = await pool.query(
      `SELECT id, email FROM users WHERE role = 'teacher' ORDER BY created_at`
    );
    const teacherIds = teacherResult.rows;

    // Get student IDs for enrollment
    const studentResult = await pool.query(
      `SELECT id, email FROM users WHERE role = 'student' AND status = 'approved' ORDER BY created_at`
    );
    const studentIds = studentResult.rows;

    // Create demo classes
    const classes = [
      {
        id: uuidv4(),
        name: 'Mathematics 101',
        description: 'Introduction to Algebra and Geometry',
        teacher_id: teacherIds[0].id
      },
      {
        id: uuidv4(),
        name: 'Physics 201',
        description: 'Advanced Physics Concepts and Applications',
        teacher_id: teacherIds[0].id
      },
      {
        id: uuidv4(),
        name: 'English Literature',
        description: 'Classic and Modern English Literature',
        teacher_id: teacherIds[1].id
      },
      {
        id: uuidv4(),
        name: 'Computer Science 301',
        description: 'Data Structures and Algorithms',
        teacher_id: teacherIds[2].id
      },
      {
        id: uuidv4(),
        name: 'Chemistry Lab',
        description: 'Practical Chemistry Experiments',
        teacher_id: teacherIds[1].id
      }
    ];

    for (const classItem of classes) {
      await pool.query(
        `INSERT INTO classes (id, name, description, teacher_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           teacher_id = EXCLUDED.teacher_id
         RETURNING id`,
        [classItem.id, classItem.name, classItem.description, classItem.teacher_id]
      );
      console.log(`✅ Class created: ${classItem.name}`);

      // Enroll students in classes (random enrollment)
      const enrolledStudents = studentIds.slice(0, Math.floor(Math.random() * studentIds.length) + 2);
      for (const student of enrolledStudents) {
        await pool.query(
          `INSERT INTO class_enrollments (id, class_id, student_id, enrolled_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (class_id, student_id) DO NOTHING`,
          [uuidv4(), classItem.id, student.id]
        );
      }
      console.log(`   📚 Enrolled ${enrolledStudents.length} students`);
    }

    // Create demo assignments
    const assignments = [
      {
        id: uuidv4(),
        class_id: classes[0].id,
        teacher_id: teacherIds[0].id,
        title: 'Algebra Homework 1',
        description: 'Complete exercises 1-10 from chapter 3',
        file_key: 'assignments/algebra-hw1.pdf',
        file_size: 1024000,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        class_id: classes[1].id,
        teacher_id: teacherIds[0].id,
        title: 'Physics Lab Report',
        description: 'Write a report on the pendulum experiment',
        file_key: 'assignments/physics-lab1.pdf',
        file_size: 2048000,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        class_id: classes[2].id,
        teacher_id: teacherIds[1].id,
        title: 'Essay Assignment',
        description: 'Write a 1000-word essay on Shakespeare\'s Hamlet',
        file_key: 'assignments/hamlet-essay.pdf',
        file_size: 1536000,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const assignment of assignments) {
      await pool.query(
        `INSERT INTO assignments (id, class_id, teacher_id, title, description, file_key, file_size, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           file_key = EXCLUDED.file_key,
           file_size = EXCLUDED.file_size,
           due_date = EXCLUDED.due_date
         RETURNING id`,
        [assignment.id, assignment.class_id, assignment.teacher_id, assignment.title, assignment.description, assignment.file_key, assignment.file_size, assignment.due_date]
      );
      console.log(`✅ Assignment created: ${assignment.title}`);
    }

    // Create demo videos
    const videos = [
      {
        id: uuidv4(),
        class_id: classes[0].id,
        teacher_id: teacherIds[0].id,
        title: 'Introduction to Algebra',
        description: 'Basic concepts of algebra and variables',
        file_key: 'videos/algebra-intro.mp4',
        file_size: 52428800,
        duration: 1800
      },
      {
        id: uuidv4(),
        class_id: classes[0].id,
        teacher_id: teacherIds[0].id,
        title: 'Solving Linear Equations',
        description: 'Step-by-step guide to solving linear equations',
        file_key: 'videos/linear-equations.mp4',
        file_size: 41943040,
        duration: 2100
      },
      {
        id: uuidv4(),
        class_id: classes[1].id,
        teacher_id: teacherIds[0].id,
        title: 'Newton\'s Laws of Motion',
        description: 'Understanding the fundamental laws of physics',
        file_key: 'videos/newtons-laws.mp4',
        file_size: 62914560,
        duration: 2400
      },
      {
        id: uuidv4(),
        class_id: classes[2].id,
        teacher_id: teacherIds[1].id,
        title: 'Shakespeare\'s Life and Works',
        description: 'Introduction to William Shakespeare and his major works',
        file_key: 'videos/shakespeare-intro.mp4',
        file_size: 47185920,
        duration: 1950
      }
    ];

    for (const video of videos) {
      await pool.query(
        `INSERT INTO videos (id, class_id, teacher_id, title, description, file_key, file_size, duration, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           file_key = EXCLUDED.file_key,
           file_size = EXCLUDED.file_size,
           duration = EXCLUDED.duration,
           updated_at = NOW()
         RETURNING id`,
        [video.id, video.class_id, video.teacher_id, video.title, video.description, video.file_key, video.file_size, video.duration]
      );
      console.log(`✅ Video created: ${video.title}`);
    }

    // Create demo attendance records
    const attendanceDates = [
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
    ];

    for (const classItem of classes.slice(0, 3)) { // First 3 classes
      for (const date of attendanceDates) {
        const enrolledStudents = await pool.query(
          `SELECT s.id FROM users s
           JOIN class_enrollments ce ON s.id = ce.student_id
           WHERE ce.class_id = $1 AND s.status = 'approved'`,
          [classItem.id]
        );

        for (const student of enrolledStudents.rows) {
          const statuses = ['present', 'absent', 'late'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          await pool.query(
            `INSERT INTO attendance (id, class_id, student_id, date, status, marked_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (class_id, student_id, date) DO UPDATE SET
               status = EXCLUDED.status,
               marked_by = EXCLUDED.marked_by`,
            [uuidv4(), classItem.id, student.id, date, status, teacherIds[0].id]
          );
        }
      }
      console.log(`✅ Attendance records created for ${classItem.name}`);
    }

    // Create demo remarks
    const remarks = [
      {
        class_id: classes[0].id,
        student_id: studentIds[0].id,
        teacher_id: teacherIds[0].id,
        content: 'Excellent work on the algebra homework! Keep it up!'
      },
      {
        class_id: classes[0].id,
        student_id: studentIds[1].id,
        teacher_id: teacherIds[0].id,
        content: 'Good progress, but please show your work more clearly.'
      },
      {
        class_id: classes[1].id,
        student_id: studentIds[2].id,
        teacher_id: teacherIds[0].id,
        content: 'Outstanding lab report! Very detailed analysis.'
      },
      {
        class_id: classes[2].id,
        student_id: studentIds[3].id,
        teacher_id: teacherIds[1].id,
        content: 'Great essay structure, but work on your thesis statement.'
      }
    ];

    for (const remark of remarks) {
      await pool.query(
        `INSERT INTO remarks (id, class_id, student_id, teacher_id, content, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET
           content = EXCLUDED.content`,
        [uuidv4(), remark.class_id, remark.student_id, remark.teacher_id, remark.content]
      );
    }
    console.log(`✅ Remarks created for students`);

    console.log('\n🎉 Demo accounts created successfully!');
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
    
    console.log('\n📚 Sample Data Created:');
    console.log('  • 5 Classes with student enrollments');
    console.log('  • 3 Assignments with due dates');
    console.log('  • 4 Video lectures');
    console.log('  • Attendance records for multiple dates');
    console.log('  • Student remarks and feedback');

  } catch (error) {
    console.error('Error creating demo accounts:', error);
  } finally {
    await pool.end();
  }
}

createDemoAccounts();
