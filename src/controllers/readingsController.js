const { TarotCard, DailyTarotDraw, MoonRitual, AngelNumber } = require('../models/Content');
const BirthChart = require('../models/BirthChart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const geminiService = require('../services/geminiService');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic per-user-per-day hash so the draw doesn't change on refresh. */
function deterministicIndex(seed, modulo) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % modulo;
}

/** GET /tarot/daily?chartId= */
async function getDailyTarot(req, res) {
  const { chartId } = req.query;
  const dateKey = todayKey();

  let draw = await DailyTarotDraw.findOne({ owner: req.userId, dateKey }).populate('card');
  if (draw) return sendSuccess(res, { data: draw });

  const totalCards = await TarotCard.countDocuments();
  if (totalCards === 0) throw ApiError.internal('Tarot deck not seeded', 'TAROT_DECK_EMPTY');

  const seed = `${req.userId}-${dateKey}`;
  const cardIndex = deterministicIndex(seed, totalCards);
  const reversed = deterministicIndex(seed + '-rev', 2) === 1;
  const card = await TarotCard.findOne().skip(cardIndex);

  let aiInterpretation = null;
  if (chartId) {
    const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
    if (chart) {
      const meaning = reversed ? card.reversedMeaning : card.uprightMeaning;
      aiInterpretation = await geminiService
        .generateText({
          systemPrompt: 'You are Cosmic, an expert AI tarot reader blending tarot symbolism with astrology.',
          userMessage: `The user drew "${card.name}" (${reversed ? 'reversed' : 'upright'}). Base meaning: ${meaning}. Their Sun sign is ${chart.computed.sunSign} and Moon sign is ${chart.computed.moonSign}. Write a short, personalized 2-3 sentence interpretation for today.`,
          maxTokens: 200,
        })
        .catch(() => null);
    }
  }

  draw = await DailyTarotDraw.create({ owner: req.userId, dateKey, card: card._id, reversed, aiInterpretation });
  await draw.populate('card');
  sendSuccess(res, { statusCode: 201, data: draw });
}

/** GET /numerology/profile?chartId= */
async function getNumerologyProfile(req, res) {
  const { chartId } = req.query;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const digitSum = (str) => {
    let n = str.replace(/\D/g, '').split('').reduce((a, b) => a + Number(b), 0);
    while (n > 9 && ![11, 22, 33].includes(n)) {
      n = String(n).split('').reduce((a, b) => a + Number(b), 0);
    }
    return n;
  };

  const lifePathNumber = digitSum(chart.birthDate);

  const today = new Date();
  const [, month, day] = chart.birthDate.split('-');
  const personalYearSeed = `${day}${month}${today.getUTCFullYear()}`;
  const personalYearNumber = digitSum(personalYearSeed);

  const lifePathDescription = "Represents your core purpose and primary path in this incarnation.";
  const personalYearDescription = "A period of harvest, finance alignment, and power dynamics. Ideal for executing business negotiations and manifesting concrete materials.";

  sendSuccess(res, { 
    data: { 
      lifePathNumber, 
      lifePathDescription,
      personalYearNumber, 
      personalYearDescription,
      year: today.getUTCFullYear() 
    } 
  });
}

/** GET /rituals/:phase? */
async function getMoonRitual(req, res) {
  const { phase } = req.params;
  if (phase) {
    const ritual = await MoonRitual.findOne({ phase });
    if (!ritual) throw ApiError.notFound('Ritual guide not found', 'RITUAL_NOT_FOUND');
    sendSuccess(res, { data: ritual });
  } else {
    const rituals = await MoonRitual.find();
    sendSuccess(res, { data: rituals });
  }
}

/** GET /angel-numbers/:number */
async function getAngelNumber(req, res) {
  const { number } = req.params;
  const entry = await AngelNumber.findOne({ number });
  if (!entry) {
    // Generate on-the-fly via Claude for numbers not in the seeded set, then cache it
    const meaning = await geminiService.generateText({
      systemPrompt: 'You are Cosmic, an expert in numerology and angel numbers.',
      userMessage: `Explain the spiritual meaning of the angel number ${number} in 2-3 sentences.`,
      maxTokens: 150,
    });
    const created = await AngelNumber.create({ number, meaning });
    return sendSuccess(res, { data: created });
  }
  sendSuccess(res, { data: entry });
}

module.exports = { getDailyTarot, getNumerologyProfile, getMoonRitual, getAngelNumber };
