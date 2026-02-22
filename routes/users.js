const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, active, search, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(filter);

    // Convert to safe objects
    const safeUsers = users.map(user => user.toSafeObject());

    res.json({
      success: true,
      count: safeUsers.length,
      users: safeUsers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ active: true });
    const inactive = await User.countDocuments({ active: false });
    
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        byRole
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
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
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Don't allow password updates through this route
    delete req.body.password;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
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
      message: 'User updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   PATCH /api/users/:id/toggle-active
// @desc    Toggle user active status
// @access  Private (Admin only)
router.patch('/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    // Prevent deactivating yourself
    if (req.params.id === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    user.active = !user.active;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.active ? 'activated' : 'deactivated'}`,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.put('/:id/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
