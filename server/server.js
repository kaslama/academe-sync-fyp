require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/academesync';

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Direct health-check verification
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', service: 'AcademeSync Production API' });
});

// Mounted Routers
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log('--------------------------------------------------');
  console.log(`[AcademeSync Engine] Server active on port ${PORT}`);
  console.log('--------------------------------------------------');
});

mongoose.connect(MONGODB_URI)
  .then(() => console.log('[AcademeSync Engine] Connected securely to MongoDB'))
  .catch((err) => console.error('[AcademeSync Engine] MongoDB connection error:', err.message));