const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// NOTE: User model has a pre-save hook that hashes the password.
// So we pass plain-text here and let the hook do the hashing.
const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  console.log('Cleared users');

  const coach = await User.create({
    name: 'Ahmed Hassan',
    email: 'ahmed@gym.com',
    password: 'coach123',
    role: 'coach',
    isApproved: true,
    isActive: true,
    phone: '+1234567891',
    dateOfBirth: new Date('1985-03-15'),
    gender: 'male',
    specialization: ['strength_training', 'bodybuilding'],
    bio: 'Professional fitness trainer with 8 years of experience.',
  });

  await User.create({
    name: 'Admin User',
    email: 'admin@gym.com',
    password: 'admin123',
    role: 'admin',
    isApproved: true,
    isActive: true,
    phone: '+1234567890',
    dateOfBirth: new Date('1980-01-01'),
    gender: 'male',
  });

  await User.create({
    name: 'Mohammed Ali',
    email: 'client@gym.com',
    password: 'client123',
    role: 'client',
    isApproved: true,
    isActive: true,
    phone: '+1234567893',
    dateOfBirth: new Date('1990-05-10'),
    gender: 'male',
    coach: coach._id,
    fitnessGoals: ['muscle_gain', 'endurance'],
    fitnessLevel: 'intermediate',
  });

  console.log('Users created:');
  console.log('  Admin  -> admin@gym.com  / admin123');
  console.log('  Coach  -> ahmed@gym.com  / coach123');
  console.log('  Client -> client@gym.com / client123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((e) => { console.error(e.message); process.exit(1); });
