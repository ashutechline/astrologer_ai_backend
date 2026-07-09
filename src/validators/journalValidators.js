const Joi = require('joi');
const { JOURNAL_TAGS } = require('../utils/journalTags');

const objectId = Joi.string().hex().length(24);

const listEntries = {
  query: Joi.object({
    month: Joi.string().pattern(/^\d{4}-\d{2}$/),
    search: Joi.string().max(200),
    tag: Joi.string().valid(...JOURNAL_TAGS),
  }),
};

const createEntry = {
  body: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    text: Joi.string().trim().min(1).max(5000).required(),
    moodEmoji: Joi.string().max(8).allow(null),
    tags: Joi.array().items(Joi.string().valid(...JOURNAL_TAGS)).default([]),
  }),
};

const updateEntry = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    text: Joi.string().trim().min(1).max(5000),
    moodEmoji: Joi.string().max(8).allow(null),
    tags: Joi.array().items(Joi.string().valid(...JOURNAL_TAGS)),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const promptQuery = {
  query: Joi.object({
    chartId: objectId.required(),
    date: Joi.string().optional(),
  }),
};

const monthlyReflectionQuery = { query: Joi.object({ month: Joi.string().pattern(/^\d{4}-\d{2}$/).required() }) };

module.exports = { listEntries, createEntry, updateEntry, idParam, promptQuery, monthlyReflectionQuery };
