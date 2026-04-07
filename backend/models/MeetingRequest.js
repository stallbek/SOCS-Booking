//Type 1 - Meeting request from user to owner (accept or decline)


const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredStartTime: {
    type: String, // "HH:MM"
    required: true
  },
  preferredEndTime: {
    type: String, // "HH:MM"
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  // Reference to the slot created when request is accepted
  createdSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);
