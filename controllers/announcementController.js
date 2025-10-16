const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

// Helper to check user role
const checkRole = (user, allowedRoles) => {
  if (!user || !allowedRoles.includes(user.role)) {
    const error = new Error('Not authorized to access this route');
    error.statusCode = 403; // Forbidden
    throw error;
  }
};

// Generate an error with a status code
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};



// @desc    Get all announcements (Admin)
// @route   GET /api/announcements/admin
// @access  Private (Admin)
const getAllAnnouncementsAdmin = async (req, res) => {
  try {
    checkRole(req.user, ['admin']);

    const [announcements] = await db.query(`
      SELECT 
        a.id, a.title, a.file_url, a.created_at,
        u.full_name as teacher_name, 
        c.class_name,
        (SELECT COUNT(*) FROM announcement_views av WHERE av.announcement_id = a.id) as view_count
      FROM announcements a
      JOIN users u ON a.teacher_id = u.id
      JOIN classes c ON a.class_id = c.id
      ORDER BY a.created_at DESC
    `);
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching all announcements for admin:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};


// @desc    Post a new announcement (Teacher or Admin)
// @route   POST /api/announcements
// @access  Private (Teacher, Admin)
const postAnnouncement = async (req, res) => {
  try {
    // NEW: Allow both teachers and admins to post
    checkRole(req.user, ['teacher', 'admin']);

    const { title, class_id } = req.body;
    // The poster's ID is taken from the authenticated user (teacher or admin)
    const poster_id = req.user.id;
    const file = req.files ? req.files.file : null;

    if (!title || !class_id || !file) {
      throw createError('Please include a title, class, and a PDF file', 400);
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: `sshs/announcements/${poster_id}`,
      resource_type: 'raw',
      format: 'pdf',
      public_id: `${Date.now()}-${file.name}`,
    });

    const file_url = result.secure_url;

    // Use poster_id for the teacher_id column
    const [insertResult] = await db.query(
      'INSERT INTO announcements (teacher_id, class_id, title, file_url) VALUES (?, ?, ?, ?)',
      [poster_id, class_id, title, file_url]
    );

    res.status(201).json({
      id: insertResult.insertId,
      teacher_id: poster_id,
      class_id,
      title,
      file_url,
      message: 'Announcement posted successfully',
    });
  } catch (error) {
    console.error('Error posting announcement:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get announcements for a teacher's classes
// @route   GET /api/announcements/teacher
// @access  Private (Teacher)
const getTeacherAnnouncements = async (req, res) => {
  try {
    checkRole(req.user, ['teacher']);

    // NEW: Fetch ALL announcements, just like the admin view.
    // The "WHERE a.teacher_id = ?" clause has been removed.
    const [announcements] = await db.query(`
      SELECT 
        a.id, a.title, a.file_url, a.created_at,
        u.full_name as teacher_name, 
        c.class_name,
        (SELECT COUNT(*) FROM announcement_views av WHERE av.announcement_id = a.id) as view_count
      FROM announcements a
      JOIN users u ON a.teacher_id = u.id
      JOIN classes c ON a.class_id = c.id
      ORDER BY a.created_at DESC
    `);
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching teacher announcements:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};


// ... (The rest of the functions in the file remain unchanged)

// @desc    Get announcements for a student's enrolled classes
// @route   GET /api/announcements/student
// @access  Private (Student)
// ... (keep the other functions like postAnnouncement, etc.)

// @desc    Get announcements for a student's enrolled classes
// @route   GET /api/announcements/student
// @access  Private (Student)
const getStudentAnnouncements = async (req, res) => {
  try {
    checkRole(req.user, ['student']);

    const student_id = req.user.id;

    // NEW LOGIC: Fetch ALL announcements, and check which ones this student has viewed.
    // The JOIN on the 'enrollments' table has been removed.
    const [announcements] = await db.query(`
      SELECT 
        a.id, a.title, a.file_url, a.created_at,
        u.full_name as teacher_name, 
        c.class_name,
        CASE WHEN av.student_id IS NOT NULL THEN TRUE ELSE FALSE END as is_viewed
      FROM announcements a
      JOIN classes c ON a.class_id = c.id
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN announcement_views av ON av.announcement_id = a.id AND av.student_id = ?
      ORDER BY a.created_at DESC
    `, [student_id]);

    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Mark announcement as viewed by student
// @route   POST /api/announcements/:id/view
// @access  Private (Student)
const markAnnouncementAsViewed = async (req, res) => {
  try {
    checkRole(req.user, ['student']);

    const announcement_id = req.params.id;
    const student_id = req.user.id;

    // NEW LOGIC: The enrollment check is removed. Any student can mark any announcement as viewed.
    const [result] = await db.query(
      'INSERT IGNORE INTO announcement_views (announcement_id, student_id) VALUES (?, ?)',
      [announcement_id, student_id]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Announcement marked as viewed' });
    } else {
      res.status(200).json({ message: 'Announcement already viewed' });
    }
  } catch (error) {
    console.error('Error marking announcement as viewed:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// ... (keep the other functions like deleteAnnouncement, etc.)

// @desc    Delete an announcement (Teacher who posted it, or Admin)
// @route   DELETE /api/announcements/:id
// @access  Private (Teacher/Admin)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement_id = req.params.id;
    const user_id = req.user.id;
    const user_role = req.user.role;

    // Fetch announcement to check ownership and get file_url
    const [announcements] = await db.query(
      'SELECT teacher_id, file_url FROM announcements WHERE id = ?',
      [announcement_id]
    );

    if (announcements.length === 0) {
      throw createError('Announcement not found', 404);
    }

    const announcement = announcements[0];

    // Authorization check
    if (user_role === 'teacher' && announcement.teacher_id !== user_id) {
      throw createError('Not authorized to delete this announcement', 403);
    } else if (user_role === 'student') {
        throw createError('Students cannot delete announcements', 403);
    }
    // Admin is allowed to delete any announcement

    // Delete file from Cloudinary (optional, but good practice for cleanup)
    if (announcement.file_url) {
      const publicId = announcement.file_url.split('/').pop().split('.')[0]; // Extract public ID from URL
      const folderPath = `sshs/announcements/${announcement.teacher_id}`;
      // Cloudinary expects public_id including folder path if it's there
      await cloudinary.uploader.destroy(`${folderPath}/${publicId}`, { resource_type: 'raw' });
    }

    // Delete from DB
    await db.query('DELETE FROM announcements WHERE id = ?', [announcement_id]);

    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};


module.exports = {
  postAnnouncement,
  getTeacherAnnouncements,
  getStudentAnnouncements,
  getAllAnnouncementsAdmin,
  markAnnouncementAsViewed,
  deleteAnnouncement,
};