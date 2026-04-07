// Type 2 - Group meeting with Calendar Method (owner defines slots, users vote)

const mongoose = require('mongoose');

const timeOptionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "HH:MM"
  endTime: { type: String, required: true },   // "HH:MM"
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: true });

const groupMeetingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // Date range for available options
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // The specific time options the owner created
  timeOptions: [timeOptionSchema],
  // Users invited to vote (by email)
  invitedEmails: [{
    type: String,
    lowercase: true
  }],
  // Unique invite code for sharing
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  // 'calendar' for manual time options, 'heatmap' for auto-generated 30-min intervals
  method: {
    type: String,
    enum: ['calendar', 'heatmap'],
    default: 'calendar'
  },
  status: {
    type: String,
    enum: ['voting', 'finalized'],
    default: 'voting'
  },
  // The selected time option (set when owner finalizes)
  selectedOption: {
    date: Date,
    startTime: String,
    endTime: String
  },
  // Recurring configuration
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringWeeks: {
    type: Number,
    default: 1,
    min: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('GroupMeeting', groupMeetingSchema);
