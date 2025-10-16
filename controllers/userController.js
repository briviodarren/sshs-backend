const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (for admins, simplified for now)
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { full_name, email, password, role, address } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    // Check if user exists
    const [userExists] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, role, address) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, role, address || null]
    );

    if (result.insertId) {
      res.status(201).json({
        id: result.insertId,
        full_name: full_name,
        email: email,
        role: role,
        token: generateToken(result.insertId),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  // req.user is available from the protect middleware
  res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const { email, password, address } = req.body;
    const userId = req.user.id;

    try {
        // Fetch current user data
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare update query
        let updateQuery = 'UPDATE users SET ';
        const queryParams = [];

        if (email) {
            updateQuery += 'email = ?, ';
            queryParams.push(email);
        }
        if (address) {
            updateQuery += 'address = ?, ';
            queryParams.push(address);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateQuery += 'password = ?, ';
            queryParams.push(hashedPassword);
        }

        // Remove trailing comma and space
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ' WHERE id = ?';
        queryParams.push(userId);
        
        // Execute update if there's anything to update
        if (queryParams.length > 1) {
            await db.query(updateQuery, queryParams);
        }

        const [updatedUsers] = await db.query('SELECT id, full_name, email, role, address FROM users WHERE id = ?', [userId]);
        
        res.status(200).json(updatedUsers[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};