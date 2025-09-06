/*
  createAdmin.js

  Usage (from server/):
    node createAdmin.js --email=admin@example.com --password=secret --name="Admin Name"

  It reads MONGODB_URI from your .env (like the app) and uses the existing User model
  so password hashing and schema rules are applied.
*/

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  });
  return args;
}

async function main() {
  const args = parseArgs();
  const email = args.email;
  const password = args.password || 'password';
  const name = args.name || 'Admin User';

  if (!email) {
    console.error('ERROR: --email is required');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check for existing user
    const existing = await User.findOne({ email }).exec();
    if (existing) {
      console.log('A user with that email already exists:');
      console.log(`  id: ${existing._id}`);
      console.log(`  email: ${existing.email}`);
      console.log(`  role: ${existing.role}`);
      process.exit(0);
    }

    const user = new User({
      name,
      email,
      password,
      role: 'admin',
    });

    await user.save();

    console.log('Admin user created successfully:');
    console.log(`  id: ${user._id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  role: ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

main();
