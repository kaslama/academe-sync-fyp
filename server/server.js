const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

const JWT_SECRET = 'fyp-super-secret-key-2026';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'supervisor', 'admin'], default: 'student' },
  faculty: { type: String, default: 'BCA' }, 
  batch: { type: String, default: '2022' },   
  isVerified: { type: Boolean, default: false },
  notifications: [{ message: String, read: { type: Boolean, default: false }, date: { type: Date, default: Date.now } }]
});
const User = mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  domain: { type: String, required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  teamMembers: [{ name: String, email: String }], 
  faculty: { type: String, required: true }, 
  batch: { type: String, required: true },     
  abstract: { type: String, required: true },
  documents: [{ url: String, name: String }], 
  links: [{ title: String, url: String }],
  status: { type: String, default: 'Under Review' },
  progressMilestone: { type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' },
  similarityIndex: { type: Number, default: 0 },
  supervisor: { type: String, default: 'Unassigned' },
  comments: [{ author: String, text: String, timestamp: { type: Date, default: Date.now } }]
}, { timestamps: true });
const Project = mongoose.model('Project', ProjectSchema);

let isMongoReady = false;

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Access Denied: No Token' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid Token' }); }
};

const addNotificationByEmail = async (email, message) => {
  await User.findOneAndUpdate({ email }, { $push: { notifications: { message, date: new Date(), read: false } } });
};

const addNotificationByName = async (name, message) => {
  await User.findOneAndUpdate({ name }, { $push: { notifications: { message, date: new Date(), read: false } } });
};

app.post('/api/auth/register', async (req, res) => {
  if (!isMongoReady) return res.status(500).json({ error: 'DB Offline' });
  try {
    const { name, email, password, role, faculty, batch } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const isVerified = role === 'admin';

    await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role, 
      faculty: role === 'student' ? faculty : undefined, 
      batch: role === 'student' ? batch : undefined,
      isVerified
    });
    res.status(201).json({ message: 'Registration successful. Awaiting admin verification.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  if (!isMongoReady) return res.status(500).json({ error: 'DB Offline' });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account pending administrator verification.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email, faculty: user.faculty, batch: user.batch }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, faculty: user.faculty, batch: user.batch } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/supervisors', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try { res.json(await User.find({ role: 'supervisor', isVerified: true }).select('name')); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = await User.find().select('-password').sort({ role: 1 });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/users/:id/verify', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const user = await User.findById(req.params.id);
    user.isVerified = !user.isVerified;
    await user.save();
    await addNotificationByEmail(user.email, user.isVerified ? 'Your account has been verified by the administrator.' : 'Your account verification was revoked.');
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.notifications.sort((a, b) => b.date - a.date));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/notifications/read', verifyToken, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { "notifications.$[].read": true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/projects', verifyToken, async (req, res) => {
  if (!isMongoReady) return res.json([]);
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = { 
        $or: [
          { studentEmail: req.user.email }, 
          { "teamMembers.email": req.user.email }
        ] 
      };
    } else if (req.user.role === 'supervisor') {
      query = { supervisor: req.user.name };
    }
    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/analyze', verifyToken, async (req, res) => {
  const { title } = req.body;
  const corpus = isMongoReady ? await Project.find({}, 'title') : [];
  
  let maxScore = 0; 
  let matchingTitle = '';

  const cleanInputTitle = (title || '').toLowerCase().trim();
  const exactTitleMatch = corpus.find(doc => doc.title.toLowerCase().trim() === cleanInputTitle);

  if (exactTitleMatch) {
    maxScore = 1; 
    matchingTitle = exactTitleMatch.title;
  } else {
    const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const getTF = tokens => { const map = {}; tokens.forEach(t => { map[t] = (map[t] || 0) + 1; }); return map; };
    const targetTokens = clean(title); 
    const targetTF = getTF(targetTokens);
    
    for (const doc of corpus) {
      const docTokens = clean(doc.title); 
      const docTF = getTF(docTokens);
      let dot = 0, nA = 0, nB = 0;
      for (const k in targetTF) { if (docTF[k]) dot += targetTF[k] * docTF[k]; nA += targetTF[k] ** 2; }
      for (const k in docTF) nB += docTF[k] ** 2;
      const sim = (nA && nB) ? dot / (Math.sqrt(nA) * Math.sqrt(nB)) : 0;
      if (sim > maxScore) { maxScore = sim; matchingTitle = doc.title; }
    }
  }

  const score = Math.min(100, Math.round(maxScore * 100));
  res.json({ similarityIndex: score, flagged: score >= 60, matchingTitle });
});

app.post('/api/projects', verifyToken, upload.single('document'), async (req, res) => {
  const { title, domain, abstract, similarityIndex, partnerEmail } = req.body;
  
  let teamMembers = [{ name: req.user.name, email: req.user.email }];

  if (partnerEmail && partnerEmail.trim() !== '') {
    const cleanPartnerEmail = partnerEmail.trim().toLowerCase();
    if (cleanPartnerEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot add your own email as a partner.' });
    }
    const partnerUser = await User.findOne({ email: cleanPartnerEmail });
    if (!partnerUser) {
      return res.status(400).json({ error: `Partner email "${partnerEmail}" does not exist in the system.` });
    }
    teamMembers.push({ name: partnerUser.name, email: partnerUser.email });
  }

  const documents = req.file ? [{ url: `/uploads/${req.file.filename}`, name: req.file.originalname }] : [];
  try {
    const payload = {
      title, domain, abstract, documents, teamMembers,
      similarityIndex: Number(similarityIndex),
      studentName: req.user.name,
      studentEmail: req.user.email,
      faculty: req.user.faculty || 'BCA',
      batch: req.user.batch || '2022',
      status: Number(similarityIndex) >= 60 ? 'Flagged Conflict' : 'Under Review'
    };
    const createdProject = await Project.create(payload);
    
    if (partnerEmail) {
      await addNotificationByEmail(partnerEmail.trim(), `You have been added as a project partner for "${title}" by ${req.user.name}.`);
    }

    res.status(201).json(createdProject);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/:id/document', verifyToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const project = await Project.findById(req.params.id);
    project.documents.push({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
    await project.save();
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id/document/:filename', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const docIndex = project.documents.findIndex(d => d.url.includes(req.params.filename));
    if (docIndex > -1) {
      const filePath = path.join(__dirname, 'uploads', req.params.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      project.documents.splice(docIndex, 1);
      await project.save();
    }
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/:id/links', verifyToken, async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.links.push({ title, url });
    await project.save();
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id/links/:linkId', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.links = project.links.filter(l => l._id.toString() !== req.params.linkId);
    await project.save();
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    
    project.documents.forEach(doc => {
      const filePath = path.join(__dirname, 'uploads', doc.url.split('/').pop());
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await addNotificationByEmail(project.studentEmail, `Your project "${project.title}" has been removed by the administrator.`);
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { status, supervisor, progressMilestone } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (status && status !== project.status) {
      project.status = status;
      await addNotificationByEmail(project.studentEmail, `Update: Your project "${project.title}" status is now ${status}.`);
    }

    if (progressMilestone && req.user.role === 'supervisor') {
      project.progressMilestone = progressMilestone;
      await addNotificationByEmail(project.studentEmail, `Milestone Update: Your project is marked as ${progressMilestone}.`);
    }

    if (supervisor && req.user.role === 'admin' && supervisor !== project.supervisor) {
      project.supervisor = supervisor;
      if (supervisor !== 'Unassigned') {
        await addNotificationByName(supervisor, `Assignment: You are now guiding "${project.title}".`);
      }
    }

    await project.save();
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects/:id/comments', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    project.comments.push({ author: req.user.name, text: req.body.text });
    await project.save();
    
    if (req.user.role === 'supervisor') {
      await addNotificationByEmail(project.studentEmail, `New feedback on "${project.title}".`);
    } else if (req.user.role === 'student' && project.supervisor !== 'Unassigned') {
      await addNotificationByName(project.supervisor, `${req.user.name} commented on "${project.title}".`);
    }
    
    res.json(project);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/projects/stats', verifyToken, async (req, res) => {
  try {
    const domainStats = await Project.aggregate([{ $group: { _id: "$domain", count: { $sum: 1 } } }]);
    const statusStats = await Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    res.json({ domains: domainStats, statuses: statusStats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 5000;
mongoose.connect('mongodb://127.0.0.1:27017/academesync')
  .then(() => { isMongoReady = true; console.log('MongoDB Connected'); app.listen(PORT); })
  .catch(() => { console.log('MongoDB Error'); });