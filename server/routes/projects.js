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

    const initialDocs = [];
    if (req.file) {
      initialDocs.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`
      });
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
      supervisor: 'Unassigned',
      documentPath: req.file ? `/uploads/${req.file.filename}` : '',
      documents: initialDocs,
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

// Generic Project Update (Status, Supervisor, Milestone)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, supervisor, progressMilestone } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (status) project.status = status;
    if (supervisor) {
      project.supervisor = supervisor;
      project.supervisorName = supervisor;
    }
    if (progressMilestone) project.progressMilestone = progressMilestone;

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// Feedback Comments Thread
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.comments) project.comments = [];
    project.comments.push({
      author: req.user.name,
      text: text.trim(),
      date: new Date()
    });
    await project.save();
    res.json(project.comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post comment', error: err.message });
  }
});

// Document Upload on Existing Project
router.post('/:id/document', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.file) {
      if (!project.documents) project.documents = [];
      project.documents.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`
      });
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Document upload failed', error: err.message });
  }
});

// Remove Document
router.delete('/:id/document/:filename', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.documents) {
      project.documents = project.documents.filter(doc => !doc.url.includes(req.params.filename));
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete document', error: err.message });
  }
});

// Add Project Link
router.post('/:id/links', authMiddleware, async (req, res) => {
  try {
    const { title, url } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.links) project.links = [];
    project.links.push({ title, url });
    await project.save();
    res.json(project.links);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add link', error: err.message });
  }
});

// Remove Project Link
router.delete('/:id/links/:linkId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.links) {
      project.links = project.links.filter(l => l._id.toString() !== req.params.linkId);
      await project.save();
    }
    res.json(project.links);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove link', error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can delete proposals.' });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
});

module.exports = router;