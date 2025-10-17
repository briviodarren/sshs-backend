const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fileupload = require('express-fileupload');

// Route imports
const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const classRoutes = require('./routes/classRoutes');

dotenv.config();

const app = express();

// --- THIS IS THE CRUCIAL FIX ---
// Add your Netlify URL to this list
const allowedOrigins = [
  'https://sshs-frontend.vercel.app/', // PASTE YOUR LIVE URL HERE
  'http://localhost:5173'                                 // For local testing
];

app.use(cors());
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileupload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
}));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/classes', classRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('SSHS API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));