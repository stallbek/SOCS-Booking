// Ananya Krishnakumar 261024261
const express = require('express');
const router = express.Router();

const{
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  searchUsers
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', getCurrentUser);
router.get('/search', searchUsers);
module.exports = router; 