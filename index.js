const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fileupload = require('express-fileupload');

// Route imports
const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes'); // <-- CHECK THIS LINE
const classRoutes = require('./routes/classRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileupload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
}));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes); // <-- AND CHECK THIS LINE
app.use('/api/classes', classRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('SSHS API is running...');
});

const PORT = process.env.PORT || 5000;

console.log("Forcing redeploy with SSL fix v2."); // You can remove this line if you want

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));