const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const signQuery = {
  query: Joi.object({ sign: Joi.string().valid(...ZODIAC_SIGNS).required() }),
};

const chartIdQuery = {
  query: Joi.object({ chartId: objectId.required() }),
};

const optionalChartIdQuery = {
  query: Joi.object({ chartId: objectId }),
};

const cosmicWeatherQuery = {
  query: Joi.object({
    chartId: objectId,
    lat: Joi.number(),
    lng: Joi.number(),
    timezone: Joi.string(),
    date: Joi.string(),
  }),
};

module.exports = { signQuery, chartIdQuery, optionalChartIdQuery, cosmicWeatherQuery, ZODIAC_SIGNS };
