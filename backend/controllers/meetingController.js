const { v4: uuidv4 } = require('uuid');
const MeetingRequest = require('../models/MeetingRequest');
const GroupMeeting = require('../models/GroupMeeting');
const Slot = require('../models/Slot');
const User = require('../models/User');



// TYPE 1 – REQUEST MEETINGS

// Send meeting request
exports.sendMeetingRequest = async (req, res) => {
  try {
    const {
      toOwnerId,
      message,
      preferredDate,
      preferredStartTime,
      preferredEndTime,
      isReadByOwner,
      isReadBySender
    } = req.body;

    if (!toOwnerId || !message || !preferredDate || !preferredStartTime || !preferredEndTime) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const owner = await User.findOne({ _id: toOwnerId, role: 'owner' });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found.' });
    }

    const request = new MeetingRequest({
      fromUser: req.session.userId,
      toOwner: toOwnerId,
      message,
      preferredDate: new Date(preferredDate),
      preferredStartTime,
      preferredEndTime
    });

    await request.save();

    res.status(201).json({
      message: 'Meeting request sent!',
      request,
      notifyEmail: owner.email
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to send request.' });
  }
};


// Get incoming requests for owner
// GET /api/meetings
exports.getMeetingRequests = async (req, res) => {
  try {
    // After fetching requests
    await MeetingRequest.updateMany(
      { toOwner: req.session.userId, isReadByOwner: false },
      { $set: { isReadByOwner: true } }
    );
    const requests = await MeetingRequest.find({
      toOwner: req.session.userId
    })
      .populate('fromUser', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests.' });
  }
};


// Accept request
exports.acceptMeetingRequest = async (req, res) => {
  try {
    const request = await MeetingRequest.findOne({
      _id: req.params.id,
      toOwner: req.session.userId,
      status: 'pending'
    }).populate('fromUser', 'name email');

    if (!request) {
      return res.status(404).json({
        error: 'Request not found or already handled.'
      });
    }

    const slot = new Slot({
      owner: req.session.userId,
      title: `Meeting with ${request.fromUser.name}`,
      description: request.message,
      date: request.preferredDate,
      startTime: request.preferredStartTime,
      endTime: request.preferredEndTime,
      status: 'active',
      bookedBy: request.fromUser._id,
      slotType: 'single'
    });

    await slot.save();

    request.status = 'accepted';
    request.isReadBySender = false;
    request.createdSlot = slot._id;
    await request.save();

    res.json({
      message: 'Request accepted. Slot created and booked.',
      slot,
      notifyEmail: request.fromUser.email
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request.' });
  }
};


// Decline request
exports.declineMeetingRequest = async (req, res) => {
  try {
    const request = await MeetingRequest.findOne({
      _id: req.params.id,
      toOwner: req.session.userId,
      status: 'pending'
    }).populate('fromUser', 'name email');

    if (!request) {
      return res.status(404).json({
        error: 'Request not found or already handled.'
      });
    }

    request.status = 'declined';
    request.isReadBySender = false;
    await request.save();

    res.json({
      message: 'Request declined.',
      notifyEmail: request.fromUser.email
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to decline request.' });
  }
};


// Get current User's requests
// GET /api/meetings/my-requests
exports.getMyMeetingRequests = async (req, res) => {
  try {
    await MeetingRequest.updateMany(
  { fromUser: req.session.userId, isReadBySender: false },
  { $set: { isReadBySender: true } }
);
    const requests = await MeetingRequest.find({
      fromUser: req.session.userId
    })
      .populate('toOwner', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests.' });
  }
};

//For notification badges to notify the user
// GET /api/notifications/count
exports.getNotificationCounts = async (req, res) => {
  try {
    const userId = req.session.userId;
    const role = req.session.role;

    let ownerCount = 0;
    let userCount = 0;

    if (role === 'owner') {
      ownerCount = await MeetingRequest.countDocuments({
        toOwner: userId,
        isReadByOwner: false
      });
    }

    userCount = await MeetingRequest.countDocuments({
      fromUser: userId,
      isReadBySender: false
    });

    res.json({
      ownerNotifications: ownerCount,
      userNotifications: userCount
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};


// TYPE 2 – GROUP MEETINGS

// Create group meeting
// 
exports.createGroupMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      timeOptions,
      invitedEmails
    } = req.body;

    if (!title || !startDate || !endDate || !timeOptions || timeOptions.length === 0) {
      return res.status(400).json({
        error: 'Title, date range, and time options are required.'
      });
    }

    const inviteCode = uuidv4().slice(0, 8);

    const group = new GroupMeeting({
      owner: req.session.userId,
      title,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timeOptions: timeOptions.map(opt => ({
        date: new Date(opt.date),
        startTime: opt.startTime,
        endTime: opt.endTime,
        votes: []
      })),
      invitedEmails: invitedEmails || [],
      inviteCode
    });

    await group.save();

    res.status(201).json({
      message: 'Group meeting created!',
      group,
      inviteLink: `/pages/group-vote.html?code=${inviteCode}`
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to create group meeting.' });
  }
};

// Voting on group meetings
// PATCH /api/meetings/group/:code/vote
exports.voteOnGroupMeeting = async (req, res) => {
  try {
    const { optionIds } = req.body;

    const group = await GroupMeeting.findOne({
      inviteCode: req.params.code,
      status: 'voting'
    });

    if (!group) {
      return res.status(404).json({
        error: 'Group meeting not found or voting is closed.'
      });
    }

    // Remove previous votes by this user
    for (const option of group.timeOptions) {
      option.votes = option.votes.filter(
        v => v.toString() !== req.session.userId.toString()
      );
    }

    // Add new votes
    for (const optId of optionIds) {
      const option = group.timeOptions.id(optId);
      if (option) {
        option.votes.push(req.session.userId);
      }
    }

    await group.save();

    res.json({
      message: 'Votes recorded!',
      group
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to record votes.'
    });
  }
};

//View group meetings by invite code 
// GET /api/meetings/group/:code

exports.getGroupMeetingByCode = async (req, res) => {
  try {
    const group = await GroupMeeting.findOne({
      inviteCode: req.params.code
    })
      .populate('owner', 'name email')
      .populate('timeOptions.votes', 'name email');

    if (!group) {
      return res.status(404).json({
        error: 'Group meeting not found.'
      });
    }

    res.json(group);

  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch group meeting.'
    });
  }
};

// Finalize group meeting 
// PATCH /api/meetings/group/:code/finalize
exports.finalizeGroupMeeting = async (req, res) => {
  try {
    const {
      selectedOptionId,
      isRecurring,
      recurringWeeks
    } = req.body;

    const group = await GroupMeeting.findOne({
      inviteCode: req.params.code,
      owner: req.session.userId,
      status: 'voting'
    });

    if (!group) {
      return res.status(404).json({
        error: 'Group meeting not found.'
      });
    }

    const selectedOption = group.timeOptions.id(selectedOptionId);

    if (!selectedOption) {
      return res.status(400).json({
        error: 'Invalid time option.'
      });
    }

    const voterIds = [
      ...new Set(
        group.timeOptions.flatMap(o =>
          o.votes.map(v => v.toString())
        )
      )
    ];

    if (!voterIds.length) {
      return res.status(400).json({
        error: 'At least one vote is required before finalizing.'
      });
    }

    group.selectedOption = {
      date: selectedOption.date,
      startTime: selectedOption.startTime,
      endTime: selectedOption.endTime
    };

    group.isRecurring = isRecurring || false;
    group.recurringWeeks = recurringWeeks || 1;
    group.status = 'finalized';

    // Create booking slots
    const weeks = isRecurring ? recurringWeeks : 1;
    const slots = [];

    for (let w = 0; w < weeks; w++) {
      const slotDate = new Date(selectedOption.date);
      slotDate.setDate(slotDate.getDate() + w * 7);

      slots.push({
        owner: req.session.userId,
        title: group.title,
        description: group.description,
        date: slotDate,
        startTime: selectedOption.startTime,
        endTime: selectedOption.endTime,
        status: 'active',
        slotType: 'group',
        attendees: voterIds,
        recurringGroupId: group._id.toString()
      });
    }

    await Slot.insertMany(slots);
    await group.save();

    const voters = await User.find({
      _id: { $in: voterIds }
    }, 'email');

    const notifyEmails = voters.map(v => v.email);

    res.json({
      message: `Group meeting finalized! ${slots.length} slot(s) created.`,
      group,
      notifyEmails
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to finalize group meeting.'
    });
  }
};

// Get all group meetings (owner)
// GET /api/meetings/my-groups
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await GroupMeeting.find({
      owner: req.session.userId
    })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json(groups);

  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch group meetings.'
    });
  }
};

// Delete group meeting (only before finalized)
// DELETE /api/meetings/group/:id
exports.deleteGroupMeeting = async (req, res) => {
  try {
    const group = await GroupMeeting.findOne({
      _id: req.params.id,
      owner: req.session.userId
    });

    if (!group) {
      return res.status(404).json({
        error: 'Group meeting not found.'
      });
    }

    if (group.status === 'finalized') {
      return res.status(400).json({
        error: 'Cannot delete a finalized group meeting. Delete the created slots instead.'
      });
    }

    await GroupMeeting.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Group meeting deleted.'
    });

  } catch (err) {
    res.status(500).json({
      error: 'Failed to delete group meeting.'
    });
  }
};
