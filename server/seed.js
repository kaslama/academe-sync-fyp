require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/academesync';

const sampleProjects = [
  {
    title: 'Autonomous Real-Time Video Surveillance Anomaly Detector',
    abstract: 'Edge accelerated deep convolutional neural network for real time anomaly detection in high traffic pedestrian surveillance feeds.',
    domain: 'Computer Vision',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav@univ.edu',
    status: 'Approved',
    similarityIndex: 0,
    supervisorName: 'Dr. Evelyn Reed'
  },
  {
    title: 'Decentralized Byzantine Fault Tolerant Ledger for Healthcare',
    abstract: 'A distributed ledger implementation utilizing practical Byzantine fault tolerance consensus algorithms for cross institutional patient record synchronization.',
    domain: 'Distributed Systems',
    studentName: 'Sarah Jenkins',
    studentEmail: 'sarah@univ.edu',
    status: 'Approved',
    similarityIndex: 0,
    supervisorName: 'Dr. Evelyn Reed'
  },
  {
    title: 'Neural Machine Translation for Low Resource Dialects',
    abstract: 'Sequence to sequence transformer architecture optimized with subword tokenization and back translation techniques for low resource languages.',
    domain: 'NLP',
    studentName: 'Tariq Vance',
    studentEmail: 'tariq@univ.edu',
    status: 'Approved',
    similarityIndex: 0,
    supervisorName: 'Unassigned'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Find or create a dummy user ID for the foreign key
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: 'Archive System',
        email: 'archive@univ.edu',
        password: 'archivepassword123',
        role: 'admin'
      });
    }

    // Attach studentId to sample projects
    const records = sampleProjects.map(p => ({ ...p, studentId: user._id }));

    // Insert records
    await Project.insertMany(records);
    console.log('Successfully seeded archive projects into database.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();