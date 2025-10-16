const db = require('../config/db');

// Helper to check user role (copied from announcementController)
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// @desc    Get classes taught by a specific teacher
// @route   GET /api/classes/teacher
// @access  Private (Teacher)
const getTeacherClasses = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      throw createError('Not authorized to access this route', 403);
    }
    const teacherId = req.user.id;
    const [classes] = await db.query(
      'SELECT id, class_name FROM classes WHERE teacher_id = ?',
      [teacherId]
    );
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get classes a student is enrolled in
// @route   GET /api/classes/student
// @access  Private (Student)
const getStudentClasses = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      throw createError('Not authorized to access this route', 403);
    }
    const studentId = req.user.id;
    const [classes] = await db.query(`
      SELECT c.id, c.class_name 
      FROM classes c
      JOIN enrollments e ON c.id = e.class_id
      WHERE e.student_id = ?
    `, [studentId]);
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all classes (Admin)
// @route   GET /api/classes/all
// @access  Private (Admin)
const getAllClassesAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      throw createError('Not authorized to access this route', 403);
    }
    const [classes] = await db.query('SELECT id, class_name FROM classes');
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching all classes for admin:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};


module.exports = {
  getTeacherClasses,
  getStudentClasses,
  getAllClassesAdmin
};