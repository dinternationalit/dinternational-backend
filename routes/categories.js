const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

// Get all categories (Public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create category (Protected)
router.post('/', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const category = new Category({
      _id: req.body.name.toLowerCase().replace(/\s+/g, '-'),
      ...req.body
    });
    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update category (Protected)
router.put('/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete category (Protected)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
