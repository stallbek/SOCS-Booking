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

app.get('/api/debug-db', async (req, res) => {
  try {
    const dbName = mongoose.connection.name;
    const ownersCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'owner' });
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      dbUri: process.env.MONGODB_URI ? '***SET***' : 'NOT SET',
      dbName: dbName,
      ownersCount: ownersCount,
      collections: allCollections.map(c => c.name),
      sampleUsers: await mongoose.connection.db.collection('users').find({}).limit(3).toArray()
    });
    console.log('DB URI:', process.env.MONGODB_URI);
console.log('Fetching owners from:', db.collection);

  } catch (error) {
    res.json({ error: error.message, dbUri: process.env.MONGODB_URI || 'NO URI' });
  }
});

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
app.use('/api/teams', teamRoutes)

// Serve the frontend build
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

//use .env port if present, else 5000
const PORT = process.env.PORT || 5001;



//starts the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
