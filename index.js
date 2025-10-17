const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fileupload = require('express-fileupload');

const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const classRoutes = require('./routes/classRoutes'); // Import class routes

dotenv.config();

const app = express();

app.use(cors({
      origin: 'https://sshs-frontend-esu60pjj3-briviodarrens-projects.vercel.app'
}));

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
app.use('/api/classes', classRoutes); // Use class routes

app.get('/', (req, res) => {
  res.send('SSHS API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));