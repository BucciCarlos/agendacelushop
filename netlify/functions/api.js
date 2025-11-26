const serverless = require('serverless-http');
const app = require('../../backend/server.js');
const dbConnect = require('../../backend/config/db.js');
const User = require('../../backend/models/User.js');

let isSeeded = false;

// Wrap the entire handler in an async function
exports.handler = async (event, context) => {
  // Ensure the DB is connected before processing any request
  await dbConnect();

  // Seed the database only once
  if (!isSeeded) {
    try {
      const adminUser = process.env.ADMIN_USER;
      if (adminUser) {
        const existingUser = await User.findOne({ username: adminUser });
        if (!existingUser) {
          const newUser = new User({ username: adminUser, password: process.env.ADMIN_PASSWORD });
          await newUser.save();
          console.log('✅ Default admin user created!');
        } else {
          console.log('ℹ️ Default admin user already exists.');
        }
      }
      isSeeded = true; // Mark as seeded
    } catch (error) {
      console.error('🔥 Error seeding database:', error);
      // We don't want to throw here, just log the error
    }
  }

  // Pass the request to the serverless-http wrapper for Express
  return serverless(app)(event, context);
};