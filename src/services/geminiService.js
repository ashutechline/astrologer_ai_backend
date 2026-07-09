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
async function generateText({ systemPrompt, userMessage, maxTokens = 512, maxRetries = 3 }) {
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: systemPrompt,
  });

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      });
      return result.response.text();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const errorMessage = error.message || '';
      if (errorMessage.includes('429') || errorMessage.includes('503')) {
        let retrySeconds = Math.pow(2, attempt) * 5; // Default: 5s, 10s, 20s
        
        // Extract retry from error message if available: "Please retry in 19.013517365s."
        const match = errorMessage.match(/retry in ([\d\.]+)s/);
        if (match && match[1]) {
          retrySeconds = parseFloat(match[1]) + 1; // Add 1 second buffer
        }
        
        console.warn(`[Gemini API] Rate limit or high demand (Attempt ${attempt + 1}/${maxRetries}). Retrying in ${retrySeconds.toFixed(1)}s...`);
        await new Promise(res => setTimeout(res, retrySeconds * 1000));
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

/** Non-streaming helper for background chat messages. */
async function generateChatText({ systemPrompt, history = [], userMessage, maxTokens = 512 }) {
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({
    history: formatGeminiHistory(history),
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

function buildTarotReadingSystemPrompt({ chart, cards, question }) {
  let chartContext = '';
  if (chart) {
    chartContext = `
USER BIRTH CHART CONTEXT:
- Sun: ${chart.sunSign || 'Unknown'}
- Moon: ${chart.moonSign || 'Unknown'}
- Rising: ${chart.risingSign || 'Unknown'}
`;
  }

  const cardsSummary = cards
    .map((c, i) => {
      const orientation = c.reversed ? 'Reversed' : 'Upright';
      const meaning = c.reversed ? c.card.reversedMeaning : c.card.uprightMeaning;
      return `- Card ${i + 1} (${c.position.toUpperCase()}): "${c.card.name}" (${orientation}). Base meaning: ${meaning}`;
    })
    .join('\n');

  return `You are Cosmic, an expert AI tarot reader who blends rich tarot symbolism with astrology. You are warm, intuitive, and speak in a friendly but mystical tone.

The user has asked the following question: "${question}"
${chartContext}
They drew the following 3-card spread:
${cardsSummary}

Please provide a very brief and beautiful reading.
Address the question by synthesizing the meaning of the cards.
Keep the tone supportive and mystical. Write ONLY 2-3 sentences in total. Speak directly to the user using "your" and "you". Do not give medical, legal, or financial advice.`;
}

function buildTarotContinueSystemPrompt({ chart, cards, question }) {
  let chartContext = '';
  if (chart) {
    chartContext = `
USER BIRTH CHART CONTEXT:
- Sun: ${chart.sunSign || 'Unknown'}
- Moon: ${chart.moonSign || 'Unknown'}
- Rising: ${chart.risingSign || 'Unknown'}
`;
  }

  const cardsSummary = cards
    .map((c, i) => {
      const orientation = c.reversed ? 'Reversed' : 'Upright';
      const meaning = c.reversed ? c.card.reversedMeaning : c.card.uprightMeaning;
      return `- Card ${i + 1} (${c.position.toUpperCase()}): "${c.card.name}" (${orientation}). Base meaning: ${meaning}`;
    })
    .join('\n');

  return `You are Cosmic, an expert AI tarot reader who blends rich tarot symbolism with astrology. You are warm, intuitive, and speak in a friendly but mystical tone.

The user is engaged in a follow-up conversation regarding a tarot reading session.
Their initial question was: "${question}"
${chartContext}
The 3-card spread drawn was:
${cardsSummary}

Please address their follow-up questions/remarks in accordance with the tarot cards drawn and the birth chart context. Keep the conversation flowing naturally, offering deep wisdom and specific guidance. Keep your response extremely brief, strictly 2-3 sentences. Do not give medical, legal, or financial advice.`;
}

module.exports = {
  buildAstrologerSystemPrompt,
  buildTutorSystemPrompt,
  streamChatCompletion,
  generateText,
  generateChatText,
  buildTarotReadingSystemPrompt,
  buildTarotContinueSystemPrompt,
};

