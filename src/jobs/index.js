const cron = require('node-cron');
const logger = require('../config/logger');
const { generateDailyHoroscopes, generateWeeklyHoroscopes } = require('./generateDailyContent');
const {
  sendDailyHoroscopeNotifications,
  sendMoonAlertNotifications,
  sendRetrogradeWarningNotifications,
} = require('./sendNotifications');

function safeRun(name, fn) {
  return async () => {
    try {
      await fn();
    } catch (err) {
      logger.error(`Scheduled job "${name}" failed: ${err.message}`);
    }
  };
}

/**
 * Registers all cron jobs. Times are UTC by default (node-cron uses server-local time
 * unless a timezone option is passed — pin one explicitly in production).
 */
function startScheduledJobs() {
  // 00:05 UTC daily — generate content first, then notify 15 min later once it's guaranteed to exist
  cron.schedule('5 0 * * *', safeRun('generateDailyHoroscopes', generateDailyHoroscopes));
  cron.schedule('20 0 * * *', safeRun('sendDailyHoroscopeNotifications', sendDailyHoroscopeNotifications));

  // Mondays 00:10 UTC — weekly horoscope generation
  cron.schedule('10 0 * * 1', safeRun('generateWeeklyHoroscopes', generateWeeklyHoroscopes));

  // Every hour — check for moon/eclipse events and retrograde transitions landing today
  cron.schedule('0 * * * *', safeRun('sendMoonAlertNotifications', sendMoonAlertNotifications));
  cron.schedule('5 * * * *', safeRun('sendRetrogradeWarningNotifications', sendRetrogradeWarningNotifications));

  logger.info('Scheduled jobs registered');
}

module.exports = { startScheduledJobs };
