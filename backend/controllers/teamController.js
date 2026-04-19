const TeamRequest = require('../models/TeamRequest');
const User = require('../models/User');


// GET all open team requests
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
exports.createTeam = async (req, res) => {
  try {
    const { courseNumber, teamName, description, maxMembers, skills } = req.body;

    if (!courseNumber || !teamName || !description) {
      return res.status(400).json({
        error: 'Course number, team name, and description are required.'
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
exports.leaveTeam = async (req, res) => {
  try {
    const request = await TeamRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ error: 'Team not found.' });

    if (request.creator.toString() === req.session.userId.toString()) {
      return res.status(400).json({
        error: 'Creator must delete instead of leaving.'
      });
    }

    request.members = request.members.filter(
      m => m.toString() !== req.session.userId.toString()
    );

    if (request.members.length < request.maxMembers) {
      request.isOpen = true;
    }

    await request.save();

    res.json({ message: 'Left team.', request });
  } catch {
    res.status(500).json({ error: 'Failed to leave team.' });
  }
};


// REMOVE member (creator)
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


// DELETE team
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