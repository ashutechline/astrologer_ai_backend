const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const { processRevenueCatEvent } = require('../services/billingService');
const logger = require('../config/logger');

/** GET /billing/entitlements */
async function getEntitlements(req, res) {
  const sub = req.user.subscription;
  const isActive = sub.isPro && (!sub.expiresAt || new Date(sub.expiresAt) > new Date());
  sendSuccess(res, {
    data: { isPro: isActive, expiresAt: sub.expiresAt, willRenew: sub.willRenew, productId: sub.productId },
  });
}

/**
 * POST /billing/webhooks/revenuecat
 * RevenueCat sends a shared secret in the Authorization header (configured in the RevenueCat dashboard),
 * not a typical HMAC signature — verify it matches before processing.
 */
async function revenueCatWebhook(req, res) {
  const authHeader = req.headers.authorization || '';
  if (config.revenuecat.webhookAuthHeader && authHeader !== config.revenuecat.webhookAuthHeader) {
    throw ApiError.unauthorized('Invalid webhook authorization', 'INVALID_WEBHOOK_AUTH');
  }

  const event = req.body?.event;
  if (!event) throw ApiError.badRequest('Missing event payload', 'MISSING_EVENT');

  try {
    await processRevenueCatEvent(event);
  } catch (err) {
    // Log but still 200 — RevenueCat retries on non-2xx, and a transient DB hiccup
    // shouldn't cause repeated retries to pile up; the next event will usually reconcile state anyway.
    logger.error(`Failed to process RevenueCat event: ${err.message}`);
  }

  sendSuccess(res, { data: { received: true } });
}

module.exports = { getEntitlements, revenueCatWebhook };
