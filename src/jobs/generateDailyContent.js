const { Horoscope } = require('../models/Content');
const { QuizQuestion } = require('../models/Learn');
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

/**
 * Runs once daily. Generates today's quiz question via Gemini if one does not already exist.
 * The model is instructed to return strict JSON so we can parse and validate it before saving.
 */
async function generateDailyQuiz() {
  const dateKey = todayKey();

  const exists = await QuizQuestion.findOne({ date: dateKey });
  if (exists) {
    logger.info('Daily quiz already exists for today — skipping generation');
    return;
  }

  const systemPrompt =
    'You are an astrology quiz master. You create engaging multiple-choice questions about astrology for intermediate-level students. ' +
    'Topics include: zodiac signs, planets, houses, aspects, transits, natal chart interpretation, mythology, and astrological history. ' +
    'You MUST respond with ONLY valid JSON — no markdown fences, no extra text, no commentary.';

  const userMessage =
    'Generate one astrology quiz question for today. ' +
    'Return exactly this JSON shape:\n' +
    '{\n' +
    '  "question": "<the question text>",\n' +
    '  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],\n' +
    '  "correctIndex": <0|1|2|3>\n' +
    '}\n' +
    'Rules: exactly 4 options, correctIndex must be 0, 1, 2 or 3, no duplicate options, factually correct.';

  try {
    const raw = await geminiService.generateText({ systemPrompt, userMessage, maxTokens: 300 });

    // Strip accidental markdown code fences if the model adds them despite instructions
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      logger.error(`Daily quiz: Gemini returned non-JSON response — ${parseErr.message}\nRaw: ${raw}`);
      return;
    }

    // Validate shape
    const { question, options, correctIndex } = parsed;
    if (
      typeof question !== 'string' || question.trim() === '' ||
      !Array.isArray(options) || options.length !== 4 ||
      options.some((o) => typeof o !== 'string' || o.trim() === '') ||
      typeof correctIndex !== 'number' ||
      ![0, 1, 2, 3].includes(correctIndex)
    ) {
      logger.error(`Daily quiz: Gemini response failed validation — ${JSON.stringify(parsed)}`);
      return;
    }

    await QuizQuestion.create({
      date: dateKey,
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctIndex,
    });

    logger.info(`Generated daily quiz question for ${dateKey}: "${question.trim().slice(0, 60)}…"`);
  } catch (err) {
    logger.error(`Failed to generate daily quiz question: ${err.message}`);
  }
}

module.exports = { generateDailyHoroscopes, generateWeeklyHoroscopes, generateDailyQuiz };
