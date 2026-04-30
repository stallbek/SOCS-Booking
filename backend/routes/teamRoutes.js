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
  deleteTeam,
  updateTeam
} = require('../controllers/teamController');

const { requireAuth } = require('../middleware/authMiddleware.js');


router.get('/', requireAuth, getAllTeams);
router.get('/my-requests', requireAuth, getMyRequests);
router.get('/my-teams', requireAuth, getMyTeams);
router.put('/:id', requireAuth, updateTeam)

router.post('/', requireAuth, createTeam);
router.post('/:id/join', requireAuth, joinTeam);

router.delete('/:id', requireAuth, deleteTeam);
router.delete('/:id/leave', requireAuth, leaveTeam);
router.delete('/:id/remove/:userId', requireAuth, removeMember);

module.exports = router;
