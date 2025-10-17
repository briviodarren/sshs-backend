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

// --- THIS IS THE NEW, MORE ROBUST CORS FIX ---
const allowedOrigins = [
  'https://sshs-frontend.vercel.app', // Your live frontend URL
  'http://localhost:5173'             // For local testing
];

const corsOptions = {
  origin: allowedOrigins
};

// This MUST be the first middleware to run.
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));
// ---------------------------------------------

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

app.get('/', (req, res) => {
  res.send('SSHS API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));