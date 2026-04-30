// Meeting routes: Type 1 (request meetings) and Type 2 (group meetings with calendar method)

const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  console.log("INSIDE meetingRoutes:", req.method, req.url);
  next();
});
const {
  sendMeetingRequest,
  getMeetingRequests,
  acceptMeetingRequest,
  declineMeetingRequest,
  getMyMeetingRequests,
  getNotificationCounts,
  createGroupMeeting,
  voteOnGroupMeeting,
  getGroupMeetingByCode,
  finalizeGroupMeeting,
  getMyGroups,
  deleteGroupMeeting
} = require('../controllers/meetingController');

const {
  requireAuth,
  requireOwner
} = require('../middleware/authMiddleware');


// TYPE 1
router.post('/request', requireAuth, sendMeetingRequest); // User
router.get('/requests', requireOwner, getMeetingRequests);// Owner
router.patch('/request/:id/accept', requireOwner, acceptMeetingRequest); // Owner
router.patch('/request/:id/decline', requireOwner, declineMeetingRequest); //Owner
router.get('/my-requests', requireAuth, getMyMeetingRequests); // User
router.get('/notifications/count',requireAuth, getNotificationCounts); // For Owner and User

// TYPE 2
router.post('/group', requireOwner, createGroupMeeting);//Owner
router.patch('/group/:code/vote', requireAuth, voteOnGroupMeeting); //User
router.get('/group/:code', requireAuth, getGroupMeetingByCode); //User
router.patch('/group/:code/finalize', requireOwner, finalizeGroupMeeting) //Owner
router.get('/my-groups', requireOwner, getMyGroups) //Owner
router.delete('/group/:id', requireOwner, deleteGroupMeeting) //Owner

module.exports = router;
