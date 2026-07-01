const { Horoscope } = require('../models/Content');
const BirthChart = require('../models/BirthChart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { getCosmicWeather } = require('../services/cosmicWeatherService');
const { ZODIAC_SIGNS } = require('../services/ephemeris/astrologyMath');

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

/** GET /horoscopes/daily?sign=Aries */
async function getDailyHoroscope(req, res) {
  const { sign } = req.query;
  const doc = await Horoscope.findOne({ sign, period: 'daily', dateKey: todayKey() });
  if (!doc) throw ApiError.notFound('Horoscope not generated yet for today', 'HOROSCOPE_NOT_READY');
  sendSuccess(res, { data: doc });
}

/** GET /horoscopes/daily/all */
async function getAllDailyHoroscopes(req, res) {
  const docs = await Horoscope.find({ period: 'daily', dateKey: todayKey() });
  // Ensure stable, complete ordering even if some signs haven't generated yet
  const bySign = Object.fromEntries(docs.map((d) => [d.sign, d]));
  const ordered = ZODIAC_SIGNS.map((sign) => bySign[sign] || { sign, content: null, pending: true });
  sendSuccess(res, { data: ordered });
}

/** GET /horoscopes/weekly?sign=Aries */
async function getWeeklyHoroscope(req, res) {
  const { sign } = req.query;
  const doc = await Horoscope.findOne({ sign, period: 'weekly', dateKey: isoWeekKey() });
  if (!doc) throw ApiError.notFound('Weekly horoscope not generated yet', 'HOROSCOPE_NOT_READY');
  sendSuccess(res, { data: doc });
}

/** GET /cosmic-weather/today?chartId= */
async function getCosmicWeatherToday(req, res) {
  const { chartId } = req.query;
  let natalPlanets = null;
  if (chartId) {
    const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
    natalPlanets = chart?.computed?.planets || null;
  }
  const weather = await getCosmicWeather(natalPlanets);
  sendSuccess(res, { data: weather });
}

/** GET /lucky/today?chartId= — deterministic per user per day so it doesn't change on refresh */
async function getLuckyToday(req, res) {
  const { chartId } = req.query;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const colors = ['Violet', 'Gold', 'Teal', 'Crimson', 'Emerald', 'Indigo', 'Coral', 'Silver'];
  const seed = `${chart._id}-${todayKey()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  const luckyColor = colors[hash % colors.length];
  const luckyNumber = (hash % 99) + 1;
  const hourOfDay = hash % 24;
  const bestTime = `${String(hourOfDay).padStart(2, '0')}:00 - ${String((hourOfDay + 2) % 24).padStart(2, '0')}:00`;

  sendSuccess(res, { data: { luckyColor, luckyNumber, bestTime } });
}

module.exports = {
  getDailyHoroscope,
  getAllDailyHoroscopes,
  getWeeklyHoroscope,
  getCosmicWeatherToday,
  getLuckyToday,
};
