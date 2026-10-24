'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// One-command local demo: `npm run demo`
//   • starts a private MongoDB (no install, no Docker) in backend/.demo-db
//   • fills it with the demo users, exercises, courses, tips, anatomy and
//     coach schedules the first time
//   • starts the API on http://localhost:5000
// Nothing leaves this computer.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const dbPath = path.join(__dirname, '..', '.demo-db');
  const firstRun = !fs.existsSync(dbPath);
  fs.mkdirSync(dbPath, { recursive: true });

  const mongod = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = mongod.getUri('gymdb');
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  console.log(`Demo database running (${firstRun ? 'new' : 'existing'}) at ${dbPath}`);

  if (firstRun || process.argv.includes('--reseed')) {
    await require('../seed')();
    await seedSchedules();
  }

  const { connectDB } = require('../src/config/database');
  const config = require('../src/config');
  const { httpServer } = require('../server');
  await connectDB();
  httpServer.listen(config.server.port, () => {
    console.log(`\nCity Gym API ready → http://localhost:${config.server.port}/api`);
    console.log('Logins: admin@gym.com / admin123 · ahmed@gym.com / coach123 · mohammed@gym.com / client123');
  });

  const stop = async () => { httpServer.close(); await mongod.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

// Give every seeded coach an evening schedule so booking works immediately.
async function seedSchedules() {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const CoachAvailability = require('../src/models/CoachAvailability');
  const coaches = await User.find({ role: 'coach' }).select('_id');
  const day = (enabled) => ({ enabled, slots: [{ startTime: '16:00', endTime: '21:00' }] });
  for (const c of coaches) {
    await CoachAvailability.findOneAndUpdate(
      { coach: c._id },
      {
        coach: c._id,
        weeklySchedule: {
          saturday: day(true), sunday: day(true), monday: day(true), tuesday: day(true),
          wednesday: day(true), thursday: day(true), friday: day(false),
        },
        sessionDurationMin: 60, bufferMin: 0, sessionPrice: 15000, currency: 'iqd',
      },
      { upsert: true },
    );
  }
  console.log(`Coach schedules created for ${coaches.length} coaches`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
