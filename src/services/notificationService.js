const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushToTokens } = require('./pushNotificationService');
const logger = require('../config/logger');

/**
 * Creates a notification in the database (so it appears in the inbox API)
 * and simultaneously fires an FCM push notification to the user's registered devices.
 * 
 * @param {String|ObjectId} userId - The recipient's user ID
 * @param {Object} payload
 * @param {String} payload.title - Notification title
 * @param {String} payload.body - Notification body
 * @param {Object} [payload.data] - Additional data payload (e.g., { type: 'horoscope' })
 */
async function sendAndSaveNotification(userId, { title, body, data = {} }) {
  try {
    // 1. Save to Database for the Inbox API
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      data
    });

    // 2. Fetch User to get FCM Tokens
    const user = await User.findById(userId).select('fcmTokens').lean();
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      // 3. Send Push via Firebase
      const pushResult = await sendPushToTokens(user.fcmTokens, { title, body, data });
      logger.info(`Push sent to User ${userId}: ${pushResult.sent} successes, ${pushResult.failed} failures`);
    } else {
      logger.info(`User ${userId} has no registered FCM tokens. Saved to inbox only.`);
    }

    return notification;
  } catch (error) {
    logger.error(`Error in sendAndSaveNotification: ${error.message}`);
    throw error; // Or handle silently depending on your flow
  }
}

module.exports = {
  sendAndSaveNotification
};
