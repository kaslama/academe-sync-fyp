const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Full name is required'], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, 'Institutional email is required'], 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'] 
    },
    role: { 
      type: String, 
      enum: ['student', 'supervisor', 'admin'], 
      default: 'student' 
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('User', UserSchema);