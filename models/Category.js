const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '📦'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
