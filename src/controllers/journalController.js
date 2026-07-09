const JournalEntry = require('../models/JournalEntry');
const BirthChart = require('../models/BirthChart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const geminiService = require('../services/geminiService');
const { calculateLiveTransits, calculateCurrentSky } = require('../services/ephemeris/transitService');
const { getMoonPhaseName } = require('../services/cosmicWeatherService');
const { JOURNAL_TAGS, JOURNAL_TAG_EMOJIS } = require('../utils/journalTags');

/** GET /journal/entries?month=YYYY-MM */
async function listEntries(req, res) {
  const { month, search, tag } = req.query;
  const filter = { owner: req.userId };
  if (month) filter.date = { $regex: `^${month}` };
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };

  const entries = await JournalEntry.find(filter).sort({ date: -1 });

  // Group by month for the UI's "entries grouped by month" layout
  const grouped = {};
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    (grouped[key] = grouped[key] || []).push(entry);
  }

  sendSuccess(res, { data: { entries: grouped } });
}

/** POST /journal/entries */
async function createEntry(req, res) {
  const { date, moodEmoji, tags } = req.body;
  const { planets } = await calculateCurrentSky(new Date(`${date}T12:00:00.000Z`));
  const sun = planets.find((p) => p.key === 'sun');
  const moon = planets.find((p) => p.key === 'moon');
  const moonPhase = getMoonPhaseName(sun.longitude, moon.longitude);

  const entry = await JournalEntry.create({
    owner: req.userId,
    date,
    text: req.body.text,
    moodEmoji,
    tags,
    moonPhase,
  });
  sendSuccess(res, { statusCode: 201, data: entry });
}

/** PATCH /journal/entries/:id */
async function updateEntry(req, res) {
  const entry = await JournalEntry.findOne({ _id: req.params.id, owner: req.userId });
  if (!entry) throw ApiError.notFound('Entry not found', 'ENTRY_NOT_FOUND');

  for (const key of ['text', 'moodEmoji', 'tags']) {
    if (req.body[key] !== undefined) entry[key] = req.body[key];
  }
  await entry.save();
  sendSuccess(res, { data: entry });
}

/** DELETE /journal/entries/:id */
async function deleteEntry(req, res) {
  const entry = await JournalEntry.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!entry) throw ApiError.notFound('Entry not found', 'ENTRY_NOT_FOUND');
  sendSuccess(res, { data: { deleted: true } });
}

/** GET /journal/prompt-of-the-day?chartId=&date= */
async function getPromptOfTheDay(req, res) {
  const { chartId, date } = req.query;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  let targetDate = date ? new Date(date) : new Date();
  if (isNaN(targetDate.getTime())) targetDate = new Date();

  const transitsResult = await calculateLiveTransits(chart.computed.planets, targetDate).catch(() => null);
  const transits = transitsResult ? (transitsResult.transits || []) : [];
  const transitsSummary = transits
    .slice(0, 3)
    .map((t) => `${t.transiting_planet || t.transitPlanet} ${t.aspect_type || t.aspect} natal ${t.natal_planet || t.natalPlanet}`)
    .join('; ');

  const prompt = await geminiService.generateText({
    systemPrompt: 'You are Cosmic, an AI astrologer who writes thoughtful, open-ended journaling prompts tied to current astrological transits.',
    userMessage: `Write ONE short, reflective journal prompt (1-2 sentences) for someone with Sun in ${chart.computed.sunSign} and Moon in ${chart.computed.moonSign}, given these transits: ${transitsSummary || 'no major transits for that day'}.`,
    maxTokens: 100,
  });

  sendSuccess(res, { data: { prompt, date: targetDate.toISOString().slice(0, 10) } });
}

/** GET /journal/monthly-reflection?month=YYYY-MM */
async function getMonthlyReflection(req, res) {
  const { month } = req.query;
  const entries = await JournalEntry.find({ owner: req.userId, date: { $regex: `^${month}` } }).sort({ date: 1 });

  if (entries.length === 0) {
    throw ApiError.badRequest('No journal entries found for this month', 'NO_ENTRIES');
  }

  const combinedText = entries.map((e) => `[${e.date}] ${e.text}`).join('\n');

  const reflection = await geminiService.generateText({
    systemPrompt: 'You are Cosmic, an AI astrologer who identifies emotional and thematic patterns across a person\'s journal entries with warmth and insight, never judgment.',
    userMessage: `Here are this month's journal entries:\n\n${combinedText}\n\nWrite a compassionate 3-4 sentence reflection identifying any recurring themes, moods, or patterns you notice.`,
    maxTokens: 400,
  });

  sendSuccess(res, { data: { month, reflection, entryCount: entries.length } });
}

/** GET /journal/tags — returns the allowed tag list with emojis for mobile UI */
function getTags(req, res) {
  const tags = JOURNAL_TAGS.map((name) => ({ name, emoji: JOURNAL_TAG_EMOJIS[name] }));
  sendSuccess(res, { data: { tags } });
}

module.exports = {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getPromptOfTheDay,
  getMonthlyReflection,
  getTags,
};
