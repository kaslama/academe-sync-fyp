const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Submits an identity for Admin verification
 */
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

    // Auto-approve only if it's explicitly designated as admin in early setup
    const isApproved = role === 'admin';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role && ['student', 'supervisor', 'admin'].includes(role) ? role : 'student',
      isApproved
    });

    if (!isApproved) {
      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message: 'Registration request submitted successfully. Please wait for Institutional Admin approval before logging in.'
      });
    }

    // Direct token if approved (for admin)
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Enforces isApproved verification
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // VERIFICATION CHECK
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending admin verification. Your department coordinator has not activated your identity yet.'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'secret',
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

/**
 * GET /api/auth/pending-users
 * Returns list of accounts awaiting Admin review
 */
router.get('/pending-users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const pending = await User.find({ isApproved: false }, 'name email role createdAt');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve pending users' });
  }
});

/**
 * PATCH /api/auth/approve/:id
 * Approves student or supervisor identity
 */
router.patch('/approve/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `Account for ${user.name} (${user.role}) approved successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Approval failed', error: err.message });
  }
});

/**
 * DELETE /api/auth/reject/:id
 * Rejects and cleans out fraudulent or unverified registrations
 */
router.delete('/reject/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Registration rejected and cleared from queue.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
});

module.exports = router;