'use strict';

// Load env before anything else
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) });

const http = require('http');
const { Server: SocketServer } = require('socket.io');

const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');
const config = require('./src/config');

// ── Socket.IO ────────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.isDev ? '*' : config.cors.origins,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Real-time chat, typing indicators and live notifications.
// (Previously this required './socket', which does not exist, so real-time
// was silently disabled. The implementation lives in services/socket.js.)
const { initializeSocket } = require('./services/socket');
initializeSocket(io);
app.set('io', io);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();

  httpServer.listen(config.server.port, config.server.host, () => {
    logger.info(`CityGym server running on port ${config.server.port} [${config.env}]`);
    if (config.isDev) {
      logger.info(`  API:    http://localhost:${config.server.port}/api`);
      logger.info(`  Health: http://localhost:${config.server.port}/health`);
    }
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  httpServer.close(async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

// Only boot (connect DB + listen) when run directly: `node server.js`.
// Tests import the Express app without opening ports or killing the process.
if (require.main === module) {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException',  (err) => { logger.error('Uncaught exception:', err); process.exit(1); });
  process.on('unhandledRejection', (err) => { logger.error('Unhandled rejection:', err); });
  start();
}

module.exports = { app, httpServer, io };
