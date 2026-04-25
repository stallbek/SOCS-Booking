const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // "HH:MM" format
    required: true
  },
  endTime: {
    type: String, // "HH:MM" format
    required: true
  },
  status: {
    type: String,
    enum: ['private', 'active'],
    default: 'private'
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For grouping recurring office hour slots together
  recurringGroupId: {
    type: String,
    default: null
  },
  // 'single' for regular slots, 'office-hours' for Type 3, 'group' for Type 2 finalized
  slotType: {
    type: String,
    enum: ['single', 'office-hours', 'group'],
    default: 'single'
  },
  // Unique invitation code for sharing slot links
  inviteCode: {
    type: String,
    trim: true
  }
}, { timestamps: true });

slotSchema.index(
  { inviteCode: 1 },
  {
    unique: true,
    partialFilterExpression: { inviteCode: { $type: 'string' } }
  }
);

// Virtual to check if slot is available for booking
slotSchema.virtual('isAvailable').get(function () {
  return this.status === 'active' && !this.bookedBy;
});

// Ensure virtuals are included in JSON output
slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);
