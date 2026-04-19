//Optional Feature: McGill Tinder - Team finding tool for project groups 
// Author: Ananya Krishnakumar

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
    trim: true
  },
  maxMembers: {
    type: Number,
    default: 4,
    min: 2,
    max: 10
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
