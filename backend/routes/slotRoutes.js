const { requireAuth, requireOwner } = require('../middleware/authMiddleware');

const express = require('express');
const router = express.Router();

const {
  createSlot,
  getMySlots,
  getSlotById,
  activateSlot,
  deleteSlot,
  getMySlotDetails,
  generateInviteLink,
  bookSlot,
  cancelBooking,
  getMyBookings,
  getPublicOwners,
  getOwnerPublicSlots,
  getSlotByInviteCode,
  createOfficeHours,
  getMyOfficeHours
} = require('../controllers/slotController');

// Owner slot management
router.post('/', requireOwner, createSlot);
router.get('/mine', requireOwner, getMySlots);
router.get('/mine/details', requireOwner, getMySlotDetails);
router.get('/:id', requireAuth, getSlotById);
router.put('/:id/activate', requireOwner, activateSlot);
router.delete('/:id', requireOwner, deleteSlot);
router.post('/:id/invite-link', requireOwner, generateInviteLink);

// Office Hours (Type 3)
router.post('/office-hours/create', requireOwner, createOfficeHours);
router.get('/office-hours/mine', requireOwner, getMyOfficeHours);

// User booking management
router.post('/:id/book', requireAuth, bookSlot);
router.delete('/:id/cancel-booking', requireAuth, cancelBooking);
router.get('/bookings/mine', requireAuth, getMyBookings);

// Public endpoints - list of owners and their public slots
router.get('/public/owners', requireAuth, getPublicOwners);
router.get('/public/owner/:ownerId/slots', requireAuth, getOwnerPublicSlots);
// Public endpoint - access slot by invite code (no auth required)
router.get('/public/code/:inviteCode', getSlotByInviteCode);

module.exports = router;