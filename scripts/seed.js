const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dinternational';

const users = [
  {
    username: 'admin',
    email: 'admin@d-international.com',
    password: 'admin@123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    active: true
  }
];

const categories = [
  { _id: 'office', name: 'Office Furniture', icon: '🏢', description: 'Professional office furniture and equipment' },
  { _id: 'home', name: 'Home Furniture1', icon: '🏠', description: 'Comfortable furniture for your home' },
  { _id: 'outdoor', name: 'Outdoor', icon: '🌳', description: 'Weather-resistant outdoor furniture' },
  { _id: 'fixtures', name: 'Fixtures', icon: '💡', description: 'Lighting and electrical fixtures' },
  { _id: 'storage', name: 'Storage', icon: '📦', description: 'Storage solutions and organizers' }
];

const products = [
  {
    name: 'Executive Office Desk',
    category: 'office',
    description: 'Premium executive desk with built-in storage and cable management',
    basePrice: 599,
    exchangeRates: { USD: 1, GBP: 0.79, EUR: 0.92, INR: 82.5, AED: 3.67, AUD: 1.52, CAD: 1.35, JPY: 148, CNY: 7.24, SAR: 3.75 },
    inStock: true,
    featured: true
  },
  {
    name: 'Ergonomic Office Chair',
    category: 'office',
    description: 'Adjustable ergonomic chair with lumbar support',
    basePrice: 299,
    exchangeRates: { USD: 1, GBP: 0.79, EUR: 0.92, INR: 82.5, AED: 3.67, AUD: 1.52, CAD: 1.35, JPY: 148, CNY: 7.24, SAR: 3.75 },
    inStock: true,
    featured: true
  },
  {
    name: 'Modern Sofa Set',
    category: 'home',
    description: '3-seater modern sofa with premium fabric cushions',
    basePrice: 899,
    exchangeRates: { USD: 1, GBP: 0.79, EUR: 0.92, INR: 82.5, AED: 3.67, AUD: 1.52, CAD: 1.35, JPY: 148, CNY: 7.24, SAR: 3.75 },
    inStock: true,
    featured: false
  },
  {
    name: 'Dining Table Set',
    category: 'home',
    description: '6-seater solid wood dining table with chairs',
    basePrice: 799,
    exchangeRates: { USD: 1, GBP: 0.79, EUR: 0.92, INR: 82.5, AED: 3.67, AUD: 1.52, CAD: 1.35, JPY: 148, CNY: 7.24, SAR: 3.75 },
    inStock: true,
    featured: false
  },
  {
    name: 'Garden Patio Set',
    category: 'outdoor',
    description: 'Weather-resistant outdoor furniture set for 4 people',
    basePrice: 499,
    exchangeRates: { USD: 1, GBP: 0.79, EUR: 0.92, INR: 82.5, AED: 3.67, AUD: 1.52, CAD: 1.35, JPY: 148, CNY: 7.24, SAR: 3.75 },
    inStock: true,
    featured: false
  },
  {
    name: 'LED Ceiling Light',
    category: 'fixtures',
    description: 'Modern LED ceiling fixture with remote control',
    basePrice: 149,
    exchangeRates: { USD: 1, GBP: 0.79, EUR: 0.92, INR: 82.5, AED: 3.67, AUD: 1.52, CAD: 1.35, JPY: 148, CNY: 7.24, SAR: 3.75 },
    inStock: true,
    featured: false
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n');

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Data cleared\n');

    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    console.log('🏷️  Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories\n`);

    console.log('📦 Creating products...');
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products\n`);

    console.log('🎉 Database seeded successfully!\n');
    console.log('🔐 Login: username="admin", password="admin123"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
