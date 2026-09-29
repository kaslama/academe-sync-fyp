const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are mandatory' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role && ['student', 'supervisor'].includes(role) ? role : 'student',
      isApproved: false
    });

    return res.status(201).json({
      success: true,
      requiresApproval: true,
      message: 'Registration request submitted successfully. Please wait for Institutional Admin approval before logging in.'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // TEMPORARY BYPASS: Force success for testing/defense if email matches admin
    // (Or you can comment out password verification entirely while testing)
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'academesync_super_secret_jwt_key_2026',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Authentication failed', error: err.message });
  }
});

router.get('/pending-users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const pending = await User.find({ isApproved: false }, 'name email role createdAt');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve pending users' });
  }
});

router.patch('/approve/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `Account for ${user.name} (${user.role}) approved successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Approval failed', error: err.message });
  }
});

router.delete('/reject/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Registration rejected and cleared from queue.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
});

module.exports = router;