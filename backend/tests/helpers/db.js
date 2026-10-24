'use strict';

// In-memory MongoDB for tests — no Docker, no real database touched.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function clear() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

async function close() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clear, close };
