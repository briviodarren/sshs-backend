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

// --- THIS IS THE FINAL, CORRECTED CORS FIX ---
const allowedOrigins = [
  'https://sshs-frontend-ajb0alw91-briviodarrens-projects.vercel.app/', // Your live frontend URL
  'http://localhost:5173'             // For local testing
];

const corsOptions = {
  origin: allowedOrigins,
  optionsSuccessStatus: 200 // For legacy browser support
};

// This MUST be the first middleware.
// The crashing app.options('*', ...) line has been removed.
app.use(cors(corsOptions));
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