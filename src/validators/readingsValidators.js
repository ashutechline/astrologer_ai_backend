const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const tarotQuery = { query: Joi.object({ chartId: objectId }) };
const chartIdQuery = { query: Joi.object({ chartId: objectId.required() }) };
const phaseParam = { params: Joi.object({ phase: Joi.string().valid('new', 'full') }) };
const numberParam = { params: Joi.object({ number: Joi.string().pattern(/^\d{1,6}$/).required() }) };

module.exports = { tarotQuery, chartIdQuery, phaseParam, numberParam };
