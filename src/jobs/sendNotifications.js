const User = require('../models/User');
const BirthChart = require('../models/BirthChart');
const { Horoscope, CalendarEvent } = require('../models/Content');
const { sendPushToTokens } = require('../services/pushNotificationService');
const logger = require('../config/logger');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Resolves a user's Sun sign from their default/primary chart, if computed. */
async function resolveUserSunSign(user) {
  if (!user.defaultChartId) return null;
  const chart = await BirthChart.findById(user.defaultChartId).select('computed.sunSign');
  return chart?.computed?.sunSign || null;
}

/** Sends each opted-in user their personalized daily horoscope push notification. */
async function sendDailyHoroscopeNotifications() {
  const users = await User.find({
    'preferences.notifications.dailyHoroscope': true,
    fcmTokens: { $exists: true, $ne: [] },
  });

  for (const user of users) {
    const sunSign = await resolveUserSunSign(user);
    if (!sunSign) continue;

    const horoscope = await Horoscope.findOne({ sign: sunSign, period: 'daily', dateKey: todayKey() });
    if (!horoscope) continue;

    await sendPushToTokens(user.fcmTokens, {
      title: `Your ${sunSign} horoscope is ready`,
      body: horoscope.content.slice(0, 100),
      data: { type: 'daily_horoscope', sign: sunSign },
    });
  }
  logger.info(`Daily horoscope notifications dispatched to ${users.length} users`);
}

/** Notifies opted-in users when a full/new moon calendar event lands today. */
async function sendMoonAlertNotifications() {
  const todayEvents = await CalendarEvent.find({
    type: { $in: ['full_moon', 'new_moon', 'eclipse'] },
    date: { $gte: new Date(`${todayKey()}T00:00:00Z`), $lt: new Date(`${todayKey()}T23:59:59Z`) },
  });
  if (todayEvents.length === 0) return;

  const users = await User.find({
    'preferences.notifications.moonAlerts': true,
    fcmTokens: { $exists: true, $ne: [] },
  });
  const tokens = users.flatMap((u) => u.fcmTokens);
  if (tokens.length === 0) return;

  for (const event of todayEvents) {
    await sendPushToTokens(tokens, {
      title: event.title,
      body: event.description || 'A significant lunar event is happening today.',
      data: { type: 'moon_alert', eventType: event.type },
    });
  }
}

/** Notifies opted-in users when a planet starts or ends a retrograde period today. */
async function sendRetrogradeWarningNotifications() {
  const todayEvents = await CalendarEvent.find({
    type: { $in: ['retrograde_start', 'retrograde_end'] },
    date: { $gte: new Date(`${todayKey()}T00:00:00Z`), $lt: new Date(`${todayKey()}T23:59:59Z`) },
  });
  if (todayEvents.length === 0) return;

  const users = await User.find({
    'preferences.notifications.retrogradeWarnings': true,
    fcmTokens: { $exists: true, $ne: [] },
  });
  const tokens = users.flatMap((u) => u.fcmTokens);
  if (tokens.length === 0) return;

  for (const event of todayEvents) {
    const verb = event.type === 'retrograde_start' ? 'goes retrograde' : 'turns direct';
    await sendPushToTokens(tokens, {
      title: `${event.planet} ${verb} today`,
      body: event.description || `Heads up — ${event.planet} ${verb} today.`,
      data: { type: 'retrograde', planet: event.planet, eventType: event.type },
    });
  }
}

module.exports = {
  sendDailyHoroscopeNotifications,
  sendMoonAlertNotifications,
  sendRetrogradeWarningNotifications,
};
