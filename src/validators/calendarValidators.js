const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const monthQuery = {
  query: Joi.object({
    year: Joi.number().integer().min(1900).max(2200).required(),
    month: Joi.number().integer().min(1).max(12).required(),
  }),
};

const dayQuery = {
  query: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    chartId: objectId,
  }),
};

const chartIdQuery = {
  query: Joi.object({
    chartId: objectId.required(),
    date: Joi.string().optional(),
  }),
};

const timelineQuery = {
  query: Joi.object({
    chartId: objectId.required(),
    months: Joi.number().integer().min(1).max(24).default(12),
  }),
};

const bestDayBody = {
  body: Joi.object({
    chartId: objectId.required(),
    activityType: Joi.string().valid('love', 'career', 'health', 'travel', 'finance', 'general').required(),
    dateRange: Joi.object({
      start: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
      end: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    }).required(),
  }),
};

const upcomingQuery = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(20).default(3),
  }),
};

const planetaryHourQuery = {
  query: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required(),
  }),
};

module.exports = { monthQuery, dayQuery, chartIdQuery, timelineQuery, bestDayBody, upcomingQuery, planetaryHourQuery };
