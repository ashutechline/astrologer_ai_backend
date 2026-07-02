require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    console.log('1.5-flash worked:', result.response.text());
  } catch (e) {
    console.error('1.5-flash failed:', e.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result2 = await model2.generateContent('Say hello');
    console.log('2.5-flash worked:', result2.response.text());
  } catch (e) {
    console.error('2.5-flash failed:', e.message);
  }
}

test();
