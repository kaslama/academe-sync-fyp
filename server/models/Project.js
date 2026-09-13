const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const TeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }
});

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Approved'], default: 'Pending' },
  deadline: { type: Date, default: null },
  documentPath: { type: String, default: '' }
});

const FeedbackSchema = new mongoose.Schema({
  author: { type: String, required: true },
  role: { type: String, required: true },
  comments: { type: String, required: true },
  decision: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

// Audit notification entry
const NotificationEventSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['submission', 'milestone', 'schedule', 'status', 'feedback'], default: 'status' },
  timestamp: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    abstract: { type: String, required: true, minlength: 20 },
    domain: { 
      type: String, 
      enum: ['Distributed Systems', 'Computer Vision', 'NLP', 'Cybersecurity', 'Cloud'],
      required: true 
    },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    teamMembers: [TeamMemberSchema], // Multi-Member Student Group
    status: { 
      type: String, 
      enum: ['Proposed', 'Under Review', 'Approved', 'Flagged Conflict', 'Rejected'], 
      default: 'Under Review' 
    },
    similarityIndex: { type: Number, min: 0, max: 100, default: 0 },
    matchingTitle: { type: String, default: '' },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    supervisorName: { type: String, default: 'Unassigned' },
    vivaSchedule: {
      scheduledDate: { type: Date, default: null },
      venue: { type: String, default: 'Pending Board Assignment' }
    },
    milestones: {
      type: [MilestoneSchema],
      default: [
        { title: 'SRS & Architecture', status: 'Pending', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), documentPath: '' },
        { title: 'Mid-term Prototype', status: 'Pending', deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), documentPath: '' },
        { title: 'Final Viva Defense', status: 'Pending', deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), documentPath: '' }
      ]
    },
    messages: [MessageSchema],
    notifications: [NotificationEventSchema], // Auto-tracked notification log
    documentPath: { type: String, default: '' },
    feedbackHistory: [FeedbackSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);