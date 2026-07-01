const admin = require('firebase-admin');
const config = require('../config/env');
const logger = require('../config/logger');

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
    logger.warn('Firebase credentials not configured — push notifications are disabled');
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
  initialized = true;
}

/** Sends a push notification to a batch of device tokens. Silently no-ops if Firebase isn't configured. */
async function sendPushToTokens(tokens, { title, body, data = {} }) {
  ensureInitialized();
  if (!initialized || tokens.length === 0) return { sent: 0 };

  const message = {
    notification: { title, body },
    data,
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    return { sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    logger.error(`FCM send failed: ${err.message}`);
    return { sent: 0, failed: tokens.length };
  }
}

module.exports = { sendPushToTokens };
