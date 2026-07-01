const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Processes a RevenueCat webhook event and syncs the user's subscription state.
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks
 *
 * Expected event.app_user_id to match a User's subscription.revenueCatAppUserId
 * (set this to the User._id string when initializing the RevenueCat SDK client-side).
 */
async function processRevenueCatEvent(event) {
  const appUserId = event.app_user_id;
  if (!appUserId) {
    logger.warn('RevenueCat webhook missing app_user_id');
    return;
  }

  const user = await User.findOne({ 'subscription.revenueCatAppUserId': appUserId });

  if (!user) {
    logger.warn(`RevenueCat webhook: no user found for app_user_id ${appUserId}`);
    return;
  }

  const type = event.type; // e.g. INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, UNCANCELLATION

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      user.subscription.isPro = true;
      user.subscription.productId = event.product_id || user.subscription.productId;
      user.subscription.expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
      user.subscription.willRenew = true;
      user.subscription.store = event.store?.toLowerCase() || user.subscription.store;
      break;
    case 'CANCELLATION':
      // Still entitled until expiration, just won't auto-renew
      user.subscription.willRenew = false;
      break;
    case 'EXPIRATION':
      user.subscription.isPro = false;
      user.subscription.willRenew = false;
      break;
    default:
      logger.info(`Unhandled RevenueCat event type: ${type}`);
      return;
  }

  await user.save();
  logger.info(`Synced subscription for user ${user._id} from RevenueCat event ${type}`);
}

module.exports = { processRevenueCatEvent };
