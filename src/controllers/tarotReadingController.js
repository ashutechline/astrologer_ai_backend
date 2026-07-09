const TarotReading = require('../models/TarotReading');
const { TarotCard } = require('../models/Content');
const BirthChart = require('../models/BirthChart');
const geminiService = require('../services/geminiService');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

async function startTarotReading(req, res) {
  const { question, chartId } = req.body;

  // 1. Get birth chart details if available
  let chart = null;
  const targetChartId = chartId || req.user.defaultChartId;
  if (targetChartId) {
    const chartDoc = await BirthChart.findOne({ _id: targetChartId, owner: req.userId });
    if (chartDoc) {
      chart = chartDoc.computed;
    }
  }

  // 2. Draw 3 distinct random cards from TarotCard collection
  const totalCards = await TarotCard.countDocuments();
  if (totalCards < 3) {
    throw ApiError.internal('Tarot deck is not fully seeded. Please run seed script first.', 'TAROT_DECK_EMPTY');
  }

  const sampledCards = await TarotCard.aggregate([{ $sample: { size: 3 } }]);

  const positions = ['past', 'present', 'future'];
  const drawnCards = sampledCards.map((card, index) => {
    const reversed = Math.random() < 0.5;
    return {
      card: card._id,
      reversed,
      position: positions[index],
    };
  });

  // Since aggregate outputs raw objects, we need to attach their content to populate the prompt builder properly.
  const cardsForPrompt = drawnCards.map((dc, index) => ({
    card: sampledCards[index],
    reversed: dc.reversed,
    position: dc.position,
  }));

  // 3. Build prompt and generate AI reading
  const systemPrompt = geminiService.buildTarotReadingSystemPrompt({
    chart,
    cards: cardsForPrompt,
    question,
  });

  let aiText;
  try {
    aiText = await geminiService.generateText({
      systemPrompt,
      userMessage: `Interpret these 3 tarot cards for my question: "${question}"`,
      maxTokens: 1000,
    });
  } catch (err) {
    console.error('[Gemini API Error - Start Reading]:', err.message);
    throw ApiError.internal('Failed to generate tarot reading. Please try again.', 'AI_ERROR');
  }

  // 4. Save reading to DB
  const newReading = await TarotReading.create({
    owner: req.userId,
    question,
    cards: drawnCards,
    reading: aiText,
    messages: [
      { role: 'user', content: question },
      { role: 'assistant', content: aiText },
    ],
  });

  // Populate card details for response
  await newReading.populate('cards.card');

  sendSuccess(res, {
    statusCode: 201,
    data: newReading,
  });
}

async function continueTarotReading(req, res) {
  const { readingId, message, question } = req.body;
  const userMsg = message || question;

  // 1. Fetch existing reading
  const reading = await TarotReading.findOne({ _id: readingId, owner: req.userId }).populate('cards.card');
  if (!reading) {
    throw ApiError.notFound('Tarot reading not found', 'TAROT_READING_NOT_FOUND');
  }

  // 2. Fetch birth chart context if available
  let chart = null;
  if (req.user.defaultChartId) {
    const chartDoc = await BirthChart.findOne({ _id: req.user.defaultChartId, owner: req.userId });
    if (chartDoc) {
      chart = chartDoc.computed;
    }
  }

  // 3. Append the user message to DB messages
  reading.messages.push({ role: 'user', content: userMsg });

  // 4. Build prompt and send to Gemini chat
  const systemPrompt = geminiService.buildTarotContinueSystemPrompt({
    chart,
    cards: reading.cards,
    question: reading.question,
  });

  // Note: format history for all messages except the last one (which is the new message we are sending)
  const history = reading.messages.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let aiText;
  try {
    aiText = await geminiService.generateChatText({
      systemPrompt,
      history,
      userMessage: userMsg,
      maxTokens: 800,
    });
  } catch (err) {
    // Revert user message push in case of error
    reading.messages.pop();
    console.error('[Gemini API Error - Continue Reading]:', err.message);
    throw ApiError.internal('Failed to continue tarot reading. Please try again.', 'AI_ERROR');
  }

  // 5. Append assistant's response and save
  reading.messages.push({ role: 'assistant', content: aiText });
  await reading.save();

  sendSuccess(res, {
    data: reading,
  });
}

async function getTarotReadings(req, res) {
  const readings = await TarotReading.find({ owner: req.userId })
    .populate('cards.card')
    .sort({ createdAt: -1 });

  sendSuccess(res, {
    data: readings,
  });
}

async function getTarotReading(req, res) {
  const { id } = req.params;
  const reading = await TarotReading.findOne({ _id: id, owner: req.userId }).populate('cards.card');
  if (!reading) {
    throw ApiError.notFound('Tarot reading not found', 'TAROT_READING_NOT_FOUND');
  }

  sendSuccess(res, {
    data: reading,
  });
}

module.exports = {
  startTarotReading,
  continueTarotReading,
  getTarotReadings,
  getTarotReading,
};
