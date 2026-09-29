const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const User = require('./models/User');
const { verifyToken, authorizeRoles } = require('./middleware/auth');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Mount Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Admin User Management Routes
app.get('/api/users/supervisors', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor', isApproved: true }).select('name');
    res.json(supervisors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ role: 1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/users/:id/verify', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isApproved = !user.isApproved;
    await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/users/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Temporary Notification Mocks to prevent frontend crashes
app.get('/api/notifications', verifyToken, async (req, res) => res.json([]));
app.patch('/api/notifications/read', verifyToken, async (req, res) => res.json({ success: true }));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/academesync';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('Failed to connect to MongoDB:', err.message));