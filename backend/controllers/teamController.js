
const TeamRequest = require('../models/TeamRequest');
const User = require('../models/User');


// GET all open team requests
// GET /api/teams/
exports.getAllTeams = async (req, res) => {
  try {
    const { course, search } = req.query;
    const filter = { isOpen: true };

    if (course) filter.courseNumber = { $regex: course, $options: 'i' };

    if (search) {
      filter.$or = [
        { teamName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { courseNumber: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await TeamRequest.find(filter)
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team requests.' });
  }
};

// GET my created requests
// GET /api/teams/mine
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await TeamRequest.find({ creator: req.session.userId })
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your requests.' });
  }
};


// GET my joined teams
// GET /api/teams/joined
exports.getMyTeams = async (req, res) => {
  try {
    const teams = await TeamRequest.find({ members: req.session.userId })
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your teams.' });
  }
};


// CREATE team request
// POST /api/teams/create
exports.createTeam = async (req, res) => {
  try {
    const { courseNumber, teamName, description, maxMembers, skills } = req.body;

    if (!courseNumber || !teamName || !description) {
      return res.status(400).json({
        error: 'Course number, team name, and description are required.'
      });
    }
    if (description.length > 200) {
  return res.status(400).json({
    error: 'Description must be under 200 characters.'
  });
}

    const request = new TeamRequest({
      creator: req.session.userId,
      courseNumber: courseNumber.trim(),
      teamName: teamName.trim(),
      description: description.trim(),
      maxMembers: maxMembers || 4,
      skills: skills || '',
      members: [req.session.userId]
    });

    await request.save();

    res.status(201).json({
      message: 'Team request created!',
      request
    });
  } catch {
    res.status(500).json({ error: 'Failed to create team request.' });
  }
};


// JOIN team
// POST /api/teams/:id/join
exports.joinTeam = async (req, res) => {
  try {
    const request = await TeamRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ error: 'Team request not found.' });
    if (!request.isOpen) return res.status(400).json({ error: 'Team is closed.' });

    if (request.members.includes(req.session.userId)) {
      return res.status(400).json({ error: 'Already a member.' });
    }

    if (request.members.length >= request.maxMembers) {
      return res.status(400).json({ error: 'Team is full.' });
    }

    request.members.push(req.session.userId);

    if (request.members.length >= request.maxMembers) {
      request.isOpen = false;
    }

    await request.save();
    request.hasUpdates = true;
    request.lastActionBy = 'join';

    const creator = await User.findById(request.creator, 'email');

    res.json({
      message: 'Joined team!',
      request,
      notifyEmail: creator.email
    });
  } catch {
    res.status(500).json({ error: 'Failed to join team.' });
  }
};


// LEAVE team
// DELETE /api/teams/:id/leave
exports.leaveTeam = async (req, res) => {
  try {
    const request = await TeamRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ error: 'Team not found.' });

    
    const userId = req.session.userId;

    // Remove user from members
    request.members = request.members.filter(
      m => m.toString() !== userId.toString()
    );

    // if there are no members left then delete the team
    if (request.members.length === 0) {
      await TeamRequest.deleteOne({ _id: request._id });

      return res.json({
        message: 'Team deleted (last member left).'
      });
    }
    // if the creator of the team leaves, then transfer ownership of the team to someone else 
   if (request.creator.toString() === userId.toString()) {
      request.creator = request.members[0]; // promote first member
    }
    // Open space in the team if someone leaves
    if (request.members.length < request.maxMembers) {
      request.isOpen = true;
    }
    
    await request.save();
    request.hasUpdates = true;
    request.lastActionBy = 'leave';
    res.json({ message: 'Left team successfully', request });
  } catch {
    res.status(500).json({ error: 'Failed to leave team.' });
  }
};


// REMOVE member (creator)
// DELETE /api/teams/:id/remove/:userId
exports.removeMember = async (req, res) => {
  try {
    const request = await TeamRequest.findOne({
      _id: req.params.id,
      creator: req.session.userId
    });

    if (!request) {
      return res.status(404).json({ error: 'Not authorized.' });
    }

    request.members = request.members.filter(
      m => m.toString() !== req.params.userId
    );

    await request.save();

    const removedUser = await User.findById(req.params.userId, 'email');

    res.json({
      message: 'Member removed.',
      request,
      notifyEmail: removedUser?.email
    });
  } catch {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
};

// Update team
// PUT /api/teams/:id
exports.updateTeam = async (req, res) => {
  try {
    const { description, maxMembers, skills } = req.body;

    const request = await TeamRequest.findOne({
      _id: req.params.id,
      creator: req.session.userId
    });

    if (!request) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    if (description && description.length > 300) {
      return res.status(400).json({ error: 'Description too long.' });
    }

    if (description) request.description = description.trim();
    if (skills) request.skills = skills;
    if (maxMembers) request.maxMembers = maxMembers;

    await request.save();
    request.hasUpdates = true;
    request.lastActionBy = 'update';

    res.json({
      message: 'Team updated.',
      request
    });

  } catch {
    res.status(500).json({ error: 'Failed to update team.' });
  }
};

// Delete team
// DELETE /api/teams/:id/delete
exports.deleteTeam = async (req, res) => {
  try {
    const request = await TeamRequest.findOne({
      _id: req.params.id,
      creator: req.session.userId
    }).populate('members', 'email');

    if (!request) return res.status(404).json({ error: 'Not authorized.' });

    const emails = request.members
      .filter(m => m._id.toString() !== req.session.userId.toString())
      .map(m => m.email);

    await TeamRequest.deleteOne({ _id: request._id });

    res.json({
      message: 'Team deleted.',
      notifyEmails: emails
    });
  } catch {
    res.status(500).json({ error: 'Failed to delete team.' });
  }
};