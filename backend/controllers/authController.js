//Ananya Krishnakumar 261024261
const User = require('../models/User');

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!email.endsWith('@mcgill.ca') && !email.endsWith('@mail.mcgill.ca')) {
      return res.status(400).json({ error: 'Only McGill emails are allowed.' });
    }
    // Password Checks 
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = new User({ name, email, password });
    await user.save();

    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.status(201).json({
      message: 'Registration successful!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Register error:', err);

    if (err.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.json({
      message: 'Login successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Logout user
exports.logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out.' });
    }
    res.json({ message: 'Logged out successfully.' });
  });
};

// Current session
exports.getCurrentUser = (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  res.json({
    user: {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
      role: req.session.userRole
    }
  });
};