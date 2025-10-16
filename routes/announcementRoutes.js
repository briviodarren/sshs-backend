const express = require('express');
const router = express.Router();
const {
  postAnnouncement,
  getTeacherAnnouncements,
  getStudentAnnouncements,
  getAllAnnouncementsAdmin,
  markAnnouncementAsViewed,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');

// Teacher routes
router.post('/', protect, postAnnouncement); // To post an announcement
router.get('/teacher', protect, getTeacherAnnouncements); // To get teacher's announcements

// Student routes
router.get('/student', protect, getStudentAnnouncements); // To get student's announcements
router.post('/:id/view', protect, markAnnouncementAsViewed); // To mark an announcement as viewed

// Admin routes
router.get('/admin', protect, getAllAnnouncementsAdmin); // To get all announcements for admin

// Shared delete route (teacher of announcement or admin)
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;