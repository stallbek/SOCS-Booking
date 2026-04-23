const express = require('express');
const router = express.Router();

const {
  getAllTeams,
  getMyRequests,
  getMyTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  removeMember,
  deleteTeam
} = require('../controllers/teamController');

const { requireAuth } = require('../middleware/auth');

// GET
router.get('/', requireAuth, getAllTeams);
router.get('/my-requests', requireAuth, getMyRequests);
router.get('/my-teams', requireAuth, getMyTeams);

// POST
router.post('/', requireAuth, createTeam);

// PATCH
router.patch('/:id/join', requireAuth, joinTeam);
router.patch('/:id/leave', requireAuth, leaveTeam);
router.patch('/:id/remove/:userId', requireAuth, removeMember);

// DELETE
router.delete('/:id', requireAuth, deleteTeam);

module.exports = router;
