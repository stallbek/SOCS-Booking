// Ananya Krishnakumar 261024261
const express = require('express');
const router = express.Router();

const {
  getAllTeams,
  getMyRequests,
  getMyTeams,
  getTeamById,
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
router.post('/:id/join', requireAuth, joinTeam);
router.delete('/:id/leave', requireAuth, leaveTeam);
router.delete('/:id/remove/:userId', requireAuth, (req, res, next) => {
  console.log("REMOVE ROUTE HIT", req.params);
  next();
}, removeMember);
router.get('/:id', requireAuth, getTeamById);
router.put('/:id', requireAuth, updateTeam)
router.post('/', requireAuth, createTeam);
router.delete('/:id', requireAuth, deleteTeam);


module.exports = router;
