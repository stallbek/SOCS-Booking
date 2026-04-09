const Slot = require('../models/Slot');

// Create slot
exports.createSlot = async (req, res) => {
  try {
    const { title, date, startTime, endTime } = req.body;

    const slot = await Slot.create({
      owner: req.user.id,
      title,
      date,
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

    //Check if slot exists
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    //Check ownership
    if (slot.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only activate your own slots.' });
    }

    //activate the slot
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
    const slot = await Slot.findById(req.params.id);

    //Check if slot exists
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

     //Check ownership
    if (slot.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own slots.' });
    }

    await Slot.findByIdAndDelete(req.params.id);

    //delete the slot
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};