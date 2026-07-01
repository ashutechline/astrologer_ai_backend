const { Horoscope } = require('../models/Content');
const geminiService = require('../services/geminiService');
const { ZODIAC_SIGNS } = require('../services/ephemeris/astrologyMath');
const logger = require('../config/logger');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Runs once daily (see jobs/index.js cron schedule). Generates today's horoscope for all 12 signs if missing. */
async function generateDailyHoroscopes() {
  const dateKey = todayKey();
  for (const sign of ZODIAC_SIGNS) {
    const exists = await Horoscope.findOne({ sign, period: 'daily', dateKey });
    if (exists) continue;

    try {
      const content = await geminiService.generateText({
        systemPrompt: 'You are Cosmic, an expert AI astrologer. Write engaging, specific daily horoscopes — avoid generic filler.',
        userMessage: `Write today's daily horoscope for ${sign} in 3-4 sentences. Cover general energy, and one practical tip for the day.`,
        maxTokens: 250,
      });
      await Horoscope.create({ sign, period: 'daily', dateKey, content });
      logger.info(`Generated daily horoscope for ${sign}`);
    } catch (err) {
      logger.error(`Failed to generate daily horoscope for ${sign}: ${err.message}`);
    }
  }
}

/** Runs once weekly (Mondays). Generates this week's horoscope for all 12 signs if missing. */
async function generateWeeklyHoroscopes() {
  const dateKey = isoWeekKey();
  for (const sign of ZODIAC_SIGNS) {
    const exists = await Horoscope.findOne({ sign, period: 'weekly', dateKey });
    if (exists) continue;

    try {
      const content = await geminiService.generateText({
        systemPrompt: 'You are Cosmic, an expert AI astrologer. Write engaging, specific weekly horoscopes — avoid generic filler.',
        userMessage: `Write this week's horoscope for ${sign} in 4-5 sentences, covering love, career, and overall energy for the week ahead.`,
        maxTokens: 350,
      });
      await Horoscope.create({ sign, period: 'weekly', dateKey, content });
      logger.info(`Generated weekly horoscope for ${sign}`);
    } catch (err) {
      logger.error(`Failed to generate weekly horoscope for ${sign}: ${err.message}`);
    }
  }
}

module.exports = { generateDailyHoroscopes, generateWeeklyHoroscopes };
