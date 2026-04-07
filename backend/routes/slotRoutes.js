const express = require('express');
const router = express.Router();

const {
  createSlot,
  getMySlots,
  activateSlot,
  deleteSlot
} = require('../controllers/slotController');

// TEMP: no auth yet
router.post('/', createSlot);
router.get('/mine', getMySlots);
router.put('/:id/activate', activateSlot);
router.delete('/:id', deleteSlot);

module.exports = router;