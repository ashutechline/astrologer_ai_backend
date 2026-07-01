const geminiService = require('./src/services/geminiService');
require('dotenv').config();

async function test() {
  try {
    const stream = geminiService.streamChatCompletion({
      systemPrompt: 'You are a test bot. Say hello.',
      userMessage: 'Hi',
    });
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    console.log();
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
