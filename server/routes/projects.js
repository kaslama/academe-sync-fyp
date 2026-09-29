const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { calculateSimilarity } = require('../utils/similarity');

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { title, abstract } = req.body;
    const corpus = await Project.find({}, 'title abstract');
    const analysis = calculateSimilarity(`${title} ${abstract}`, corpus);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ message: 'Analysis failed', error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = {
        $or: [
          { studentId: req.user.id },
          { 'teamMembers.email': req.user.email }
        ]
      };
    } else if (req.user.role === 'supervisor') {
      query = { supervisorId: req.user.id };
    }
    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve projects', error: err.message });
  }
});

router.get('/supervisors', authMiddleware, async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }, 'name email _id');
    res.json(supervisors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve supervisor roster', error: err.message });
  }
});

router.post('/', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const { title, domain, abstract, teamMembers, faculty, batch } = req.body;
    const corpus = await Project.find({}, 'title abstract');
    const analysis = calculateSimilarity(`${title} ${abstract}`, corpus);

    let parsedMembers = [];
    if (teamMembers) {
      try {
        parsedMembers = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : teamMembers;
      } catch (e) {
        parsedMembers = [];
      }
    }

    const projectData = {
      title,
      domain,
      abstract,
      faculty: faculty || 'BCA',
      batch: batch || '2022',
      studentId: req.user.id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      teamMembers: parsedMembers,
      similarityIndex: analysis.score,
      matchingTitle: analysis.matchingTitle,
      status: analysis.score >= 60 ? 'Flagged Conflict' : 'Under Review',
      supervisorId: null,
      supervisorName: 'Unassigned',
      documentPath: req.file ? `/uploads/${req.file.filename}` : '',
      notifications: [
        {
          message: `Proposal submitted. VSM Lexical Overlap Index: ${analysis.score}%. Awaiting Department Chair supervisor allotment.`,
          type: 'submission'
        }
      ]
    };

    const project = await Project.create(projectData);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Submission failed', error: err.message });
  }
});

router.patch('/:id/allot', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the Department Chair / Admin can allocate faculty supervisors.' });
    }

    const { supervisorId, supervisorName } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.supervisorId = supervisorId;
    project.supervisorName = supervisorName;
    project.status = 'Approved'; 

    project.notifications.push({
      message: `Admin allotted faculty supervisor: ${supervisorName}. Your proposal is now formally endorsed.`,
      type: 'status'
    });

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Supervisor allocation failed', error: err.message });
  }
});

router.patch('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'supervisor' && String(project.supervisorId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized. You can only review your allotted projects.' });
    }

    project.status = 'Rejected';
    const rejectReason = reason || 'Topic or methodology did not satisfy institutional criteria.';

    project.notifications.push({
      message: `PROPOSAL REJECTED by ${req.user.name} (${req.user.role.toUpperCase()}). Directive: ${rejectReason}`,
      type: 'feedback'
    });

    if (!project.feedbackHistory) project.feedbackHistory = [];
    project.feedbackHistory.push({
      author: req.user.name,
      role: req.user.role,
      comments: `Proposal rejected. Reason: ${rejectReason}`,
      decision: 'Rejected',
      date: new Date()
    });

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can delete proposals.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.status = 'Rejected';
    project.notifications.push({
      message: `PROPOSAL REMOVED / PURGED from registry by Department Chair (${req.user.name}) on ${new Date().toLocaleDateString()}.`,
      type: 'status'
    });

    await project.save();
    res.json({ message: 'Project status set to Rejected/Purged and notification dispatched.' });
  } catch (err) {
    res.status(500).json({ message: 'Purge failed', error: err.message });
  }
});

router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text cannot be empty' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'supervisor' && String(project.supervisorId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied. Project not allotted to you.' });
    }

    project.messages.push({
      senderId: req.user.id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: text.trim(),
      timestamp: new Date()
    });

    project.notifications.push({
      message: `New message from ${req.user.name} (${req.user.role.toUpperCase()}).`,
      type: 'status'
    });

    await project.save();
    res.status(201).json(project.messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record message', error: err.message });
  }
});

router.patch('/:id/schedule', authMiddleware, async (req, res) => {
  try {
    const { scheduledDate, venue, milestoneDeadlines } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'supervisor' && String(project.supervisorId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied. You can only schedule your allotted projects.' });
    }

    if (scheduledDate || venue) {
      project.vivaSchedule = {
        scheduledDate: scheduledDate ? new Date(scheduledDate) : project.vivaSchedule.scheduledDate,
        venue: venue || project.vivaSchedule.venue
      };
      project.notifications.push({
        message: `Viva Voce Defense scheduled for ${new Date(scheduledDate).toLocaleString()} (Venue: ${venue || 'TBD'}).`,
        type: 'schedule'
      });
    }

    if (Array.isArray(milestoneDeadlines)) {
      milestoneDeadlines.forEach((item) => {
        if (project.milestones[item.index] && item.deadline) {
          project.milestones[item.index].deadline = new Date(item.deadline);
          project.notifications.push({
            message: `Milestone "${project.milestones[item.index].title}" target deadline set to ${new Date(item.deadline).toLocaleDateString()}.`,
            type: 'schedule'
          });
        }
      });
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update schedule', error: err.message });
  }
});

router.post('/:id/milestones/:index/upload', authMiddleware, upload.single('milestoneFile'), async (req, res) => {
  try {
    const { id, index } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.milestones && project.milestones[index]) {
      project.milestones[index].status = 'In Progress';
      if (req.file) {
        project.milestones[index].documentPath = `/uploads/${req.file.filename}`;
      }
      project.notifications.push({
        message: `Deliverable uploaded for milestone "${project.milestones[index].title}".`,
        type: 'milestone'
      });
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Milestone upload failed', error: err.message });
  }
});

router.patch('/:id/milestones', authMiddleware, async (req, res) => {
  try {
    const { milestoneIndex, status } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'supervisor' && String(project.supervisorId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied. You can only evaluate your allotted projects.' });
    }

    if (project.milestones[milestoneIndex]) {
      project.milestones[milestoneIndex].status = status;
      project.notifications.push({
        message: `Milestone "${project.milestones[milestoneIndex].title}" reviewed and updated to "${status}".`,
        type: 'milestone'
      });
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Milestone update failed', error: err.message });
  }
});

router.post('/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const { comments, decision } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'supervisor' && String(project.supervisorId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied. You can only review your allotted projects.' });
    }

    if (!project.feedbackHistory) project.feedbackHistory = [];

    project.feedbackHistory.push({
      author: req.user.name,
      role: req.user.role,
      comments,
      decision,
      date: new Date()
    });

    if (decision) project.status = decision;
    project.notifications.push({
      message: `Evaluation note logged: "${decision}". Feedback: "${comments.substring(0, 40)}..."`,
      type: 'feedback'
    });

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to record feedback', error: err.message });
  }
});

module.exports = router;