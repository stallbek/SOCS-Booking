require('dotenv').config();
const express = require('express');
const cors = require('cors');
console.log("Before DB");
const connectDB = require('./config/db');
console.log("After DB");

//Import routes
const slotRoutes = require('./routes/slotRoutes');


const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/slots', slotRoutes);

app.get('/', (req, res) => {
    console.log("Root route hit");
  res.send('API running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});