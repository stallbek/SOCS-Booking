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
    secure: false
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/meetings', meetingRoutes);

// Serve the frontend build
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

//use .env port if present, else 5000
const PORT = process.env.PORT || 5000;

//starts the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});