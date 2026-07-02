const BirthChart = require('../models/BirthChart');
const { AiConversation, AiMessage } = require('../models/AiChat');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const geminiService = require('../services/geminiService');
const aiQuotaService = require('../services/aiQuotaService');
const { calculateLiveTransits } = require('../services/ephemeris/transitService');
const { getCosmicWeather } = require('../services/cosmicWeatherService');

const HISTORY_TURNS_LIMIT = 20; // most recent turns sent as context to keep token usage bounded

/** Sets up response headers for an SSE stream. */
function startSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function getOrCreateConversation({ userId, chartId, conversationId, type }) {
  if (conversationId) {
    const convo = await AiConversation.findOne({ _id: conversationId, owner: userId });
    if (!convo) throw ApiError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
    return convo;
  }
  return AiConversation.create({ owner: userId, chartId, type });
}

/** POST /ai/chat — streaming SSE response */
async function chatStream(req, res) {
  const { chartId, message, conversationId } = req.body;
  const isPro = req.user.subscription.isPro;

  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const conversation = await getOrCreateConversation({
    userId: req.userId,
    chartId,
    conversationId,
    type: 'astrologer',
  });

  const priorMessages = await AiMessage.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_TURNS_LIMIT)
    .then((docs) => docs.reverse());

  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  await AiMessage.create({ conversation: conversation._id, owner: req.userId, role: 'user', content: message });

  const [transits, weather] = await Promise.all([
    calculateLiveTransits(chart.computed.planets).catch(() => []),
    getCosmicWeather().catch(() => null),
  ]);

  const transitsSummary = transits
    .slice(0, 5)
    .map((t) => `${t.transitPlanet} ${t.aspect} natal ${t.natalPlanet}`)
    .join('; ');

  const systemPrompt = geminiService.buildAstrologerSystemPrompt({
    chart: chart.computed,
    currentTransitsSummary: transitsSummary,
    energyScore: weather?.energyScore,
  });

  startSSE(res);
  sseSend(res, 'conversation', { conversationId: conversation._id });

  let fullText = '';
  try {
    for await (const delta of geminiService.streamChatCompletion({ systemPrompt, history, userMessage: message })) {
      fullText += delta;
      sseSend(res, 'delta', { text: delta });
    }
  } catch (err) {
    sseSend(res, 'error', { message: 'The AI astrologer is unavailable right now. Please try again shortly.' });
    return res.end();
  }

  const assistantMsg = await AiMessage.create({
    conversation: conversation._id,
    owner: req.userId,
    role: 'assistant',
    content: fullText,
  });

  conversation.lastMessageAt = new Date();
  if (conversation.title === 'New conversation') {
    conversation.title = message.slice(0, 60);
  }
  await conversation.save();

  sseSend(res, 'done', { messageId: assistantMsg._id });
  res.end();
}

/** POST /ai/tutor — streaming SSE response, no chart context or quota limit (free educational feature) */
async function tutorStream(req, res) {
  const { message, conversationId } = req.body;

  const conversation = await getOrCreateConversation({
    userId: req.userId,
    chartId: null,
    conversationId,
    type: 'tutor',
  });

  const priorMessages = await AiMessage.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_TURNS_LIMIT)
    .then((docs) => docs.reverse());

  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));
  await AiMessage.create({ conversation: conversation._id, owner: req.userId, role: 'user', content: message });

  const systemPrompt = geminiService.buildTutorSystemPrompt();

  startSSE(res);
  sseSend(res, 'conversation', { conversationId: conversation._id });

  let fullText = '';
  try {
    for await (const delta of geminiService.streamChatCompletion({ systemPrompt, history, userMessage: message })) {
      fullText += delta;
      sseSend(res, 'delta', { text: delta });
    }
  } catch (err) {
    sseSend(res, 'error', { message: 'The AI tutor is unavailable right now. Please try again shortly.' });
    return res.end();
  }

  await AiMessage.create({ conversation: conversation._id, owner: req.userId, role: 'assistant', content: fullText });
  conversation.lastMessageAt = new Date();
  await conversation.save();

  sseSend(res, 'done', {});
  res.end();
}

/** GET /ai/chat/history */
async function getHistory(req, res) {
  const conversations = await AiConversation.find({ owner: req.userId }).sort({ lastMessageAt: -1 });
  sendSuccess(res, { data: conversations });
}

/** GET /ai/chat/conversation-history?conversationId= */
async function getConversationHistory(req, res) {
  const { conversationId } = req.query;
  const convo = await AiConversation.findOne({ _id: conversationId, owner: req.userId });
  if (!convo) throw ApiError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');

  const messages = await AiMessage.find({ conversation: conversationId }).sort({ createdAt: 1 });
  sendSuccess(res, { data: { conversation: convo, messages } });
}

/** GET /ai/quota */
async function getQuota(req, res) {
  const status = await aiQuotaService.getQuotaStatus(req.userId, req.user.subscription.isPro);
  sendSuccess(res, { data: status });
}

/** POST /ai/chat/:messageId/bookmark */
async function toggleBookmark(req, res) {
  const message = await AiMessage.findOne({ _id: req.params.messageId, owner: req.userId });
  if (!message) throw ApiError.notFound('Message not found', 'MESSAGE_NOT_FOUND');
  message.bookmarked = !message.bookmarked;
  await message.save();
  sendSuccess(res, { data: message });
}

module.exports = { chatStream, tutorStream, getHistory, getConversationHistory, getQuota, toggleBookmark };
