const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const sendMessage = {
  body: Joi.object({
    chartId: objectId.required(),
    message: Joi.string().trim().min(1).max(2000).required(),
    conversationId: objectId.allow(null),
  }),
};

const tutorMessage = {
  body: Joi.object({
    message: Joi.string().trim().min(1).max(2000).required(),
    conversationId: objectId.allow(null),
  }),
};

const conversationHistoryQuery = {
  query: Joi.object({ conversationId: objectId.required() }),
};

const bookmarkParam = {
  params: Joi.object({ messageId: objectId.required() }),
};

module.exports = { sendMessage, tutorMessage, conversationHistoryQuery, bookmarkParam };
