// Ananya Krishnakumar 261024261
//loads variables from .env into process.env
require('dotenv').config();

//import Express, CORS
const express = require('express');
const cors = require('cors');
const path = require('path');

//import session middleware
const session = require("express-session");

//import database connection function
console.log("Before DB");
const connectDB = require('./config/db');
console.log("After DB");

//Import routes
const slotRoutes = require('./routes/slotRoutes');
const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const teamRoutes = require('./routes/teamRoutes');

//creates Express application
const app = express();

//connects MongoDB
connectDB();

//adds middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));
app.use((req, res, next) => {
  console.log("SESSION ID:", req.sessionID);
  console.log("SESSION DATA:", req.session);
  console.log("Before Routes", req.method, req.url);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/teams', teamRoutes)

// Serve the frontend build
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use((req, res) => {
  console.log("Fallback Hit", req.url)
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

//use .env port if present, else 5000
const PORT = process.env.PORT || 5001;



//starts the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
