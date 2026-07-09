const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const tarotQuery = {
  query: Joi.object({
    chartId: objectId,
    date: Joi.string().optional(),
  }),
};
const chartIdQuery = {
  query: Joi.object({
    chartId: objectId.required(),
    date: Joi.string().optional(),
  }),
};
const phaseParam = { params: Joi.object({ phase: Joi.string().valid('new', 'full') }) };
const numberParam = { params: Joi.object({ number: Joi.string().pattern(/^\d{1,6}$/).required() }) };

const tarotNewReading = {
  body: Joi.object({
    question: Joi.string().required().min(1),
    chartId: objectId.optional(),
  }),
};

const tarotContinueReading = {
  body: Joi.object({
    readingId: objectId.required(),
    message: Joi.string().optional().min(1),
    question: Joi.string().optional().min(1),
  }).or('message', 'question'),
};

const tarotReadingIdParam = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

module.exports = {
  tarotQuery,
  chartIdQuery,
  phaseParam,
  numberParam,
  tarotNewReading,
  tarotContinueReading,
  tarotReadingIdParam,
};

