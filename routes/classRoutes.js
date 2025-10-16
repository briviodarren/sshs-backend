const express = require('express');
const router = express.Router();
const { getTeacherClasses, getStudentClasses, getAllClassesAdmin } = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

router.get('/teacher', protect, getTeacherClasses);
router.get('/student', protect, getStudentClasses);
router.get('/all', protect, getAllClassesAdmin); // For admin to see all classes

module.exports = router;