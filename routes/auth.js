const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public (But in production, you might want to protect this)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username or email already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'viewer',
      firstName,
      lastName
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide username and password' 
      });
    }

    // Find user and include password
    const user = await User.findByCredentials(username, password);

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'email', 'avatar'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide current and new password' 
      });
    }

    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.active) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or inactive' 
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(401).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
