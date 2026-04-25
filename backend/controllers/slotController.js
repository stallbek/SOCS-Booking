const Slot = require('../models/Slot');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

function parseCalendarDate(value) {
  return new Date(`${value}T12:00:00.000Z`);
}

function addUtcDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getSlotAttendees(slot) {
  return Array.isArray(slot.attendees) ? slot.attendees : [];
}

function getPersonName(person) {
  return person && typeof person === 'object' && person.name ? person.name : '';
}

function getPersonEmail(person) {
  return person && typeof person === 'object' && person.email ? person.email : '';
}

function getSlotBookingDetails(slot) {
  const attendees = getSlotAttendees(slot);
  const attendeeNames = attendees.map(getPersonName).filter(Boolean);
  const attendeeEmails = attendees.map(getPersonEmail).filter(Boolean);
  const attendeeCount = attendees.length;
  const bookedByName = getPersonName(slot.bookedBy);
  const bookedByEmail = getPersonEmail(slot.bookedBy);

  if (slot.slotType === 'group' && attendeeCount) {
    return {
      attendeeCount,
      attendeeEmails,
      attendeeNames,
      bookedByEmail: attendeeEmails.join(',') || null,
      bookedByName: `${attendeeCount} attendee${attendeeCount === 1 ? '' : 's'}`,
      isBooked: true
    };
  }

  return {
    attendeeCount,
    attendeeEmails,
    attendeeNames,
    bookedByEmail: bookedByEmail || null,
    bookedByName: bookedByName || null,
    isBooked: Boolean(slot.bookedBy)
  };
}

// OWNER: Slot Management
// Create a single slot (private by default)
exports.createSlot = async (req, res) => {
  try {
    const { title, date, startTime, endTime, description } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, date, startTime, and endTime are required.' });
    }

    const slot = new Slot({
      owner: req.session.userId,
      title,
      description: description || '',
      date: new Date(date),
      startTime,
      endTime,
      status: 'private',
      slotType: 'single'
    });

    await slot.save();

    res.status(201).json({
      message: 'Slot created (private).',
      slot
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all slots belonging to owner (with populated bookedBy user details)
exports.getMySlots = async (req, res) => {
  try {
    const slots = await Slot.find({ owner: req.session.userId })
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific slot by ID (for authenticated users)
exports.getSlotById = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email');

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all slots with booked user details (detailed view for owner)
exports.getMySlotDetails = async (req, res) => {
  try {
    const slots = await Slot.find({ owner: req.session.userId })
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });

    const details = slots.map(slot => ({
      ...slot.toObject(),
      ...getSlotBookingDetails(slot)
    }));

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activate a slot (make it public for booking)
exports.activateSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (slot.owner.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'You can only activate your own slots.' });
    }

    slot.status = 'active';
    await slot.save();

    res.json({
      message: 'Slot activated and is now public.',
      slot
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a slot (notify booked user if applicable)
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id)
      .populate('bookedBy', 'email name')
      .populate('attendees', 'email name');

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (slot.owner.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'You can only delete your own slots.' });
    }

    const attendeeEmails = getSlotAttendees(slot).map(getPersonEmail).filter(Boolean);
    const bookedEmails = slot.bookedBy ? [slot.bookedBy.email].filter(Boolean) : attendeeEmails;
    const wasBooked = Boolean(slot.bookedBy || attendeeEmails.length);

    await Slot.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Slot deleted.',
      wasPreviouslyBooked: wasBooked,
      notifyEmail: bookedEmails.length ? `mailto:${bookedEmails.join(',')}?subject=Your%20Booking%20Cancelled&body=Your%20booked%20slot%20has%20been%20cancelled.` : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate an invitation URL/link for owner's activated slots
exports.generateInviteLink = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (slot.owner.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'You can only generate links for your own slots.' });
    }

    const inviteCode = uuidv4().slice(0, 8);
    slot.inviteCode = inviteCode;
    await slot.save();

    res.json({
      message: 'Invitation link generated.',
      inviteCode,
      inviteLink: `/booking?code=${inviteCode}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// TYPE 3: Recurring Office Hours

// Create recurring office hours (available to all users)
exports.createOfficeHours = async (req, res) => {
  try {
    const { title, description, startDate, endDate, timeOptions, recurringWeeks } = req.body;
    // timeOptions: [{ dayOfWeek: 0-6 (Sunday-Saturday), startTime: "HH:MM", endTime: "HH:MM" }]

    if (!title || !startDate || !endDate || !timeOptions || timeOptions.length === 0) {
      return res.status(400).json({ error: 'Title, date range, and time options are required.' });
    }

    const start = parseCalendarDate(startDate);
    const end = parseCalendarDate(endDate);
    const weeks = recurringWeeks || 1;

    const slots = [];

    // Generate slots for each week in the range
    for (let w = 0; w < weeks; w++) {
      const weekStart = addUtcDays(start, w * 7);

      for (const timeOption of timeOptions) {
        const slotDate = new Date(weekStart);
        // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
        const dayDiff = (timeOption.dayOfWeek - slotDate.getUTCDay() + 7) % 7;
        slotDate.setUTCDate(slotDate.getUTCDate() + dayDiff);

        // Only create if within range
        if (slotDate <= end) {
          const slot = new Slot({
            owner: req.session.userId,
            title,
            description: description || `Office hours: ${title}`,
            date: slotDate,
            startTime: timeOption.startTime,
            endTime: timeOption.endTime,
            status: 'active',
            slotType: 'office-hours',
            recurringGroupId: `office-hours-${req.session.userId}-${Date.now()}`
          });
          slots.push(slot);
        }
      }
    }

    await Slot.insertMany(slots);

    res.status(201).json({
      message: `Office hours created with ${slots.length} recurring slots.`,
      slotsCreated: slots.length,
      slots: slots.slice(0, 5) // Return first 5 as preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all office hours created by owner
exports.getMyOfficeHours = async (req, res) => {
  try {
    const officeHours = await Slot.find({
      owner: req.session.userId,
      slotType: 'office-hours'
    })
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });

    res.json(officeHours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// USER: Booking Management

// Book an available active slot
exports.bookSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).populate('owner', 'name email');

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (slot.status !== 'active') {
      return res.status(400).json({ error: 'Slot is not available for booking.' });
    }

    if (slot.bookedBy) {
      return res.status(400).json({ error: 'Slot is already booked.' });
    }

    // Verify user is @mcgill.ca or @mail.mcgill.ca
    const userEmail = req.session.userEmail;
    if (!userEmail.endsWith('@mcgill.ca') && !userEmail.endsWith('@mail.mcgill.ca')) {
      return res.status(403).json({ error: 'Only McGill email accounts can book slots.' });
    }

    slot.bookedBy = req.session.userId;
    await slot.save();

    res.json({
      message: 'Slot booked successfully!',
      slot,
      notifyOwnerEmail: `mailto:${slot.owner.email}?subject=New%20Booking%20for%20${encodeURIComponent(slot.title)}&body=A%20user%20has%20booked%20your%20slot%3A%20${encodeURIComponent(slot.title)}%20on%20${slot.date.toDateString()}.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel a booking (free up the slot)
exports.cancelBooking = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).populate('owner', 'email name');

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (!slot.bookedBy || slot.bookedBy.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'You did not book this slot.' });
    }

    slot.bookedBy = null;
    await slot.save();

    res.json({
      message: 'Booking cancelled. Slot is now available.',
      slot,
      notifyOwnerEmail: `mailto:${slot.owner.email}?subject=Booking%20Cancelled%20for%20${encodeURIComponent(slot.title)}&body=A%20user%20has%20cancelled%20their%20booking%20for%20${encodeURIComponent(slot.title)}.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings made by current user
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Slot.find({
      $or: [
        { bookedBy: req.session.userId },
        { attendees: req.session.userId }
      ]
    })
      .populate('owner', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUBLIC: Browse Owners & Slots

// Get list of all owners with active slots
exports.getPublicOwners = async (req, res) => {
  try {
    const ownersWithSlots = await Slot.distinct('owner', { status: 'active' });
    const owners = await User.find({ _id: { $in: ownersWithSlots }, role: 'owner' }, 'name email');

    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all active/public slots from a specific owner
exports.getOwnerPublicSlots = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const owner = await User.findOne({ _id: ownerId, role: 'owner' });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found.' });
    }

    const slots = await Slot.find({
      owner: ownerId,
      status: 'active',
      slotType: { $in: ['single', 'office-hours', 'group'] }
    })
      .populate('owner', 'name email')
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });

    res.json({
      owner: { id: owner._id, name: owner.name, email: owner.email },
      slots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single slot by invite code (public access - no auth required)
exports.getSlotByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const slot = await Slot.findOne({ inviteCode })
      .populate('owner', 'name email')
      .populate('bookedBy', 'name email')
      .populate('attendees', 'name email');

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found. The invite link may be invalid or expired.' });
    }

    if (slot.status !== 'active') {
      return res.status(400).json({ error: 'This slot is no longer available.' });
    }

    res.json({
      slot,
      owner: { id: slot.owner._id, name: slot.owner.name, email: slot.owner.email },
      isAvailable: !slot.bookedBy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
