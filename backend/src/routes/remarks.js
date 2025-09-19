const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken, requireTeacher, requireStudent } = require('../middleware/auth');
const { validateRemark, validateUUID, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Add remark (teacher only)
router.post('/', authenticateToken, requireTeacher, validateRemark, async (req, res) => {
  try {
    const { content, classId, studentId } = req.body;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    if (classId) {
      const classResult = await pool.query(
        'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
        [classId, teacherId]
      );

      if (classResult.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found or access denied' });
      }
    }

    // Verify student exists and is enrolled in class (if studentId provided)
    if (studentId) {
      if (!classId) {
        return res.status(400).json({ error: 'Class ID required when adding remark for specific student' });
      }

      const enrollmentResult = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
        [classId, studentId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Student not enrolled in this class' });
      }
    }

    // Create remark
    const remarkId = uuidv4();
    const result = await pool.query(
      `INSERT INTO remarks (id, class_id, student_id, teacher_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [remarkId, classId || null, studentId || null, teacherId, content]
    );

    res.status(201).json({
      message: 'Remark added successfully',
      remark: result.rows[0]
    });

  } catch (error) {
    console.error('Add remark error:', error);
    res.status(500).json({ error: 'Failed to add remark' });
  }
});

// Get remarks for class (teacher only)
router.get('/class/:classId', authenticateToken, requireTeacher, validateUUID('classId'), validatePagination, async (req, res) => {
  try {
    const { classId } = req.params;
    const { id: teacherId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Get remarks for class
    const result = await pool.query(
      `SELECT r.*, u.first_name as student_first_name, u.last_name as student_last_name
       FROM remarks r
       LEFT JOIN users u ON r.student_id = u.id
       WHERE r.class_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM remarks WHERE class_id = $1',
      [classId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      remarks: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get class remarks error:', error);
    res.status(500).json({ error: 'Failed to get class remarks' });
  }
});

// Get remarks for student (teacher only)
router.get('/student/:studentId', authenticateToken, requireTeacher, validateUUID('studentId'), validatePagination, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { id: teacherId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get remarks for student
    const result = await pool.query(
      `SELECT r.*, c.name as class_name
       FROM remarks r
       LEFT JOIN classes c ON r.class_id = c.id
       WHERE r.student_id = $1 AND r.teacher_id = $2
       ORDER BY r.created_at DESC
       LIMIT $3 OFFSET $4`,
      [studentId, teacherId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM remarks WHERE student_id = $1 AND teacher_id = $2',
      [studentId, teacherId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      remarks: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get student remarks error:', error);
    res.status(500).json({ error: 'Failed to get student remarks' });
  }
});

// Get student's own remarks (student only)
router.get('/my-remarks', authenticateToken, requireStudent, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get student's remarks
    const result = await pool.query(
      `SELECT r.*, c.name as class_name, u.first_name as teacher_first_name, 
              u.last_name as teacher_last_name
       FROM remarks r
       LEFT JOIN classes c ON r.class_id = c.id
       JOIN users u ON r.teacher_id = u.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM remarks WHERE student_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      remarks: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get student remarks error:', error);
    res.status(500).json({ error: 'Failed to get student remarks' });
  }
});

// Get remark details
router.get('/:id', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Get remark details
    const result = await pool.query(
      `SELECT r.*, c.name as class_name, 
              u.first_name as student_first_name, u.last_name as student_last_name,
              t.first_name as teacher_first_name, t.last_name as teacher_last_name
       FROM remarks r
       LEFT JOIN classes c ON r.class_id = c.id
       LEFT JOIN users u ON r.student_id = u.id
       JOIN users t ON r.teacher_id = t.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Remark not found' });
    }

    const remark = result.rows[0];

    // Check access permissions
    if (role === 'teacher') {
      if (remark.teacher_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      if (remark.student_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ remark });

  } catch (error) {
    console.error('Get remark details error:', error);
    res.status(500).json({ error: 'Failed to get remark details' });
  }
});

// Update remark (teacher only)
router.put('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { id: teacherId } = req.user;

    // Verify remark exists and belongs to teacher
    const remarkResult = await pool.query(
      'SELECT id FROM remarks WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (remarkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Remark not found or access denied' });
    }

    // Update remark
    const result = await pool.query(
      'UPDATE remarks SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );

    res.json({
      message: 'Remark updated successfully',
      remark: result.rows[0]
    });

  } catch (error) {
    console.error('Update remark error:', error);
    res.status(500).json({ error: 'Failed to update remark' });
  }
});

// Delete remark (teacher only)
router.delete('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: teacherId } = req.user;

    // Verify remark exists and belongs to teacher
    const remarkResult = await pool.query(
      'SELECT id FROM remarks WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (remarkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Remark not found or access denied' });
    }

    // Delete remark
    await pool.query('DELETE FROM remarks WHERE id = $1', [id]);

    res.json({ message: 'Remark deleted successfully' });

  } catch (error) {
    console.error('Delete remark error:', error);
    res.status(500).json({ error: 'Failed to delete remark' });
  }
});

// Get all remarks by teacher (teacher only)
router.get('/teacher/all', authenticateToken, requireTeacher, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get all remarks by teacher
    const result = await pool.query(
      `SELECT r.*, c.name as class_name, u.first_name as student_first_name, 
              u.last_name as student_last_name
       FROM remarks r
       LEFT JOIN classes c ON r.class_id = c.id
       LEFT JOIN users u ON r.student_id = u.id
       WHERE r.teacher_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM remarks WHERE teacher_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      remarks: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get teacher remarks error:', error);
    res.status(500).json({ error: 'Failed to get teacher remarks' });
  }
});

module.exports = router;
