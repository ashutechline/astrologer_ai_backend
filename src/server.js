const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const { connectDB } = require('./config/db');
const { startScheduledJobs } = require('./jobs');

let server;

async function start() {
  await connectDB();
  startScheduledJobs();

  server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`Cosmic AI backend listening on port ${config.port} (${config.env})`);
  });
}

function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  server?.close(() => process.exit(0));
  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
