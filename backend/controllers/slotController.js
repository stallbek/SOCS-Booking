const Slot = require('../models/Slot');

// Create slot
exports.createSlot = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    const slot = await Slot.create({
      owner: req.user.id, // later from auth
      startTime,
      endTime
    });

    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all slots of owner
exports.getMySlots = async (req, res) => {
  try {
    const slots = await Slot.find({ owner: req.user.id });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate slot
exports.activateSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    slot.isActive = true;
    await slot.save();

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete slot
exports.deleteSlot = async (req, res) => {
  try {
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};