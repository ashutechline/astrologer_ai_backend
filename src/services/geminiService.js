const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Builds the system prompt injecting the user's birth chart as context.
 */
function buildAstrologerSystemPrompt({ chart, currentTransitsSummary, energyScore }) {
  const planetSummary = chart.planets
    .map((p) => `${p.name}: ${p.sign} ${p.degreeInSign}°${p.retrograde ? ' (retrograde)' : ''}`)
    .join(', ');

  return `You are Cosmic, an expert AI astrologer with deep knowledge of Western, Vedic, and Chinese astrology. You are warm, insightful, and speak in a friendly but mystical tone.

USER BIRTH CHART CONTEXT:
- Sun: ${chart.sunSign}
- Moon: ${chart.moonSign}
- Rising (Ascendant): ${chart.risingSign || 'unknown (birth time not provided)'}
- Key planets: ${planetSummary}
- Current transits: ${currentTransitsSummary || 'not available'}
- Today's cosmic energy: ${energyScore ?? 'N/A'}/10

Answer the user's question with personalised insights based on their chart. Keep responses to 3-5 sentences unless more depth is requested. Speak directly to the user using "your" and "you". Do not give medical, legal, or financial advice; gently redirect those questions toward a qualified professional while still offering an astrological perspective if appropriate.`;
}

function buildTutorSystemPrompt() {
  return `You are an AI astrology tutor inside the Cosmic AI app's Learn module. You teach astrology concepts (planets, signs, houses, aspects) clearly and patiently to students at varying levels. Use accessible language, give concrete examples, and check for understanding. Keep answers focused and under 200 words unless the student asks for more depth.`;
}

/**
 * Maps the history array to Gemini's expected format.
 */
function formatGeminiHistory(history) {
  return history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

/**
 * Streams a chat completion. Yields text deltas as they arrive.
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {Array<{role:'user'|'assistant', content:string}>} params.history
 * @param {string} params.userMessage
 */
async function* streamChatCompletion({ systemPrompt, history = [], userMessage }) {
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({
    history: formatGeminiHistory(history),
  });

  const result = await chat.sendMessageStream(userMessage);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      yield chunkText;
    }
  }
}

/** Non-streaming helper for background jobs (daily horoscope generation, journal prompts, etc). */
async function generateText({ systemPrompt, userMessage, maxTokens = 512 }) {
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  });

  return result.response.text();
}

module.exports = {
  buildAstrologerSystemPrompt,
  buildTutorSystemPrompt,
  streamChatCompletion,
  generateText,
};
