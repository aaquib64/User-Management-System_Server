const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/userModel');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedUsers = async () => {
  try {
    await User.deleteMany(); // Clear existing users

    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'admin',
        status: 'active',
      },
      {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'Manager@123',
        role: 'manager',
        status: 'active',
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'User@123',
        role: 'user',
        status: 'active',
      },
    ]);

    // Set createdBy for manager and user
    users[1].createdBy = users[0]._id;
    users[2].createdBy = users[0]._id;
    await users[1].save();
    await users[2].save();

    console.log('✅ Seeded successfully!');
    console.log('Admin:   admin@example.com / Admin@123');
    console.log('Manager: manager@example.com / Manager@123');
    console.log('User:    user@example.com / User@123');
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedUsers();