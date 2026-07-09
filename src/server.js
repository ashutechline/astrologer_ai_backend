const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const { connectDB } = require('./config/db');
const { startScheduledJobs } = require('./jobs');
const {
  generateDailyHoroscopes,
  generateWeeklyHoroscopes,
  generateDailyQuiz,
} = require('./jobs/generateDailyContent');

let server;

/**
 * Runs generation jobs immediately on startup for any content that is missing today.
 * This ensures content is available right after a deploy or server restart,
 * without waiting until the cron fires at midnight UTC.
 */
async function runStartupContentSeed() {
  logger.info('Running startup content seed (generating any missing content for today)...');
  try {
    await Promise.all([
      generateDailyHoroscopes(),
      generateWeeklyHoroscopes(),
      generateDailyQuiz(),
    ]);
    logger.info('Startup content seed complete.');
  } catch (err) {
    // Non-fatal — server still starts; cron will retry at midnight
    logger.error(`Startup content seed encountered an error: ${err.message}`);
  }
}

async function start() {
  await connectDB();
  startScheduledJobs();

  // Seed today's content immediately — don't wait until midnight
  runStartupContentSeed(); // intentionally not awaited so server starts fast

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
