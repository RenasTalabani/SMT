const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const u = await User.findOne({ email: 'client@gym.com' }).select('+password');
  if (!u) { console.log('USER NOT FOUND'); process.exit(1); }
  console.log('User found:', u.email, 'isActive:', u.isActive, 'isApproved:', u.isApproved);
  console.log('Password hash length:', u.password ? u.password.length : 'no password');
  const match = await bcrypt.compare('client123', u.password);
  console.log('Password match:', match);
  await mongoose.disconnect();
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
