const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price must be positive']
  },
  exchangeRates: {
    USD: { type: Number, default: 1 },
    GBP: { type: Number, default: 0.79 },
    EUR: { type: Number, default: 0.92 },
    INR: { type: Number, default: 82.5 },
    AED: { type: Number, default: 3.67 },
    AUD: { type: Number, default: 1.52 },
    CAD: { type: Number, default: 1.35 },
    JPY: { type: Number, default: 148 },
    CNY: { type: Number, default: 7.24 },
    SAR: { type: Number, default: 3.75 }
  },
  images: [{
    url: String,
    alt: String
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
