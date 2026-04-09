const { requireAuth, requireOwner } = require('../middleware/authMiddleware');

const express = require('express');
const router = express.Router();

const {
  createSlot,
  getMySlots,
  activateSlot,
  deleteSlot
} = require('../controllers/slotController');



router.post('/', requireOwner, createSlot);
router.get('/mine', requireOwner, getMySlots);
router.put('/:id/activate', requireOwner, activateSlot);
router.delete('/:id', requireOwner, deleteSlot);

module.exports = router;