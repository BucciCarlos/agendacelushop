const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    // In a real-world application, ALWAYS hash and salt passwords.
    // We are storing plain text here only for simplicity based on the existing project structure.
  },
});

module.exports = mongoose.model('User', UserSchema);
