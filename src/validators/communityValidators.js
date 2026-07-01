const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const feedQuery = {
  query: Joi.object({
    signFilter: Joi.string().valid(...ZODIAC_SIGNS),
    cursor: objectId,
  }),
};

const createPost = {
  body: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required(),
    imageUrl: Joi.string().uri().allow(null),
  }),
};

const postIdParam = { params: Joi.object({ id: objectId.required() }) };

const addComment = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({ content: Joi.string().trim().min(1).max(500).required() }),
};

const followParam = { params: Joi.object({ userId: objectId.required() }) };

module.exports = { feedQuery, createPost, postIdParam, addComment, followParam };
