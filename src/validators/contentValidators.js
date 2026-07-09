const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const signQuery = {
  query: Joi.object({
    sign: Joi.string().valid(...ZODIAC_SIGNS).required(),
    date: Joi.string().optional(),
  }),
};

const chartIdQuery = {
  query: Joi.object({
    chartId: objectId.required(),
    date: Joi.string().optional(),
  }),
};

const optionalChartIdQuery = {
  query: Joi.object({
    chartId: objectId,
    date: Joi.string().optional(),
  }),
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

const dateQuery = {
  query: Joi.object({
    date: Joi.string().optional(),
  }),
};

module.exports = { signQuery, chartIdQuery, optionalChartIdQuery, cosmicWeatherQuery, dateQuery, ZODIAC_SIGNS };
