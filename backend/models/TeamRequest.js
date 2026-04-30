//Optional Feature: McGill Tinder - Team finding tool for project groups 
//Ananya Krishnakumar 261024261

const mongoose = require('mongoose');

const teamRequestSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseNumber: {
    type: String,
    required: true,
    trim: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  maxMembers: {
    type: Number,
    default: 4,
    min: 2,
    max: 10
  },
  hasUpdates:{
    type: Boolean,
    default: false
  },
  lastActionBy: {
    type : String
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  skills: {
    type: String,
    default: ''
  },
  isOpen: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TeamRequest', teamRequestSchema);
