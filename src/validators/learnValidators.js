const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const listCourses = {
  query: Joi.object({ track: Joi.string().valid('beginner', 'intermediate', 'advanced') }),
};

const courseIdParam = { params: Joi.object({ id: objectId.required() }) };

const updateProgress = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({ lessonId: objectId.required(), completed: Joi.boolean().required() }),
};

const categoryParam = {
  params: Joi.object({ category: Joi.string().valid('planets', 'signs', 'houses', 'aspects').required() }),
};

const answerQuiz = {
  body: Joi.object({ selectedIndex: Joi.number().integer().min(0).max(10).required() }),
};

module.exports = { listCourses, courseIdParam, updateProgress, categoryParam, answerQuiz };
