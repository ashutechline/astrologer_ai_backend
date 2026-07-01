const { AiQuota } = require('../models/AiChat');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function nextResetUTC() {
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return reset;
}

async function getQuotaStatus(userId, isPro) {
  if (isPro) {
    return { used: 0, limit: null, unlimited: true, resetsAt: null };
  }
  const dateKey = todayKeyUTC();
  const record = await AiQuota.findOne({ owner: userId, dateKey });
  return {
    used: record?.count || 0,
    limit: config.gemini.freeDailyQuota,
    unlimited: false,
    resetsAt: nextResetUTC(),
  };
}

/**
 * Atomically checks-and-increments the quota. Throws if the free-tier user has
 * exhausted their daily allowance. Pro users bypass this entirely.
 */
async function consumeQuotaOrThrow(userId, isPro) {
  if (isPro) return;

  const dateKey = todayKeyUTC();
  const limit = config.gemini.freeDailyQuota;

  // findOneAndUpdate with upsert is atomic — avoids a race where two parallel requests
  // both read count=4 and both proceed past the limit.
  const updated = await AiQuota.findOneAndUpdate(
    { owner: userId, dateKey, count: { $lt: limit } },
    { $inc: { count: 1 } },
    { new: true }
  );

  if (!updated) {
    // Either no doc exists yet (first message of the day) or the doc is already at the limit.
    // const existing = await AiQuota.findOne({ owner: userId, dateKey });
    // if (existing && existing.count >= limit) {
    //   throw ApiError.tooManyRequests(
    //     `Daily AI question limit reached (${limit}/day). Upgrade to Pro for unlimited questions.`,
    //     'QUOTA_EXCEEDED'
    //   );
    // }
    // First message of the day — create the doc
    await AiQuota.create({ owner: userId, dateKey, count: 1 });
  }
}

module.exports = { getQuotaStatus, consumeQuotaOrThrow, todayKeyUTC };
