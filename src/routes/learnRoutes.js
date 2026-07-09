const express = require('express');
const ctrl = require('../controllers/learnController');
const validate = require('../middleware/validate');
const v = require('../validators/learnValidators');
const { requireAuth, loadUser, requirePro } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, loadUser);

// Reference library (Planets/Signs/Houses/Aspects) is free; courses + quiz are premium per the feature catalogue
router.get('/reference/:category', validate(v.categoryParam), ctrl.getReference);

router.get('/courses', requirePro, validate(v.listCourses), ctrl.listCourses);
router.get('/courses/:id', requirePro, validate(v.courseIdParam), ctrl.getCourse);
router.post('/courses/:id/progress', requirePro, validate(v.updateProgress), ctrl.updateProgress);

router.get('/quiz/daily', requirePro, validate(v.dailyQuizQuery), ctrl.getDailyQuiz);
router.post('/quiz/daily/answer', requirePro, validate(v.answerQuiz), ctrl.answerDailyQuiz);
router.get('/quiz/leaderboard', requirePro, ctrl.getLeaderboard);

module.exports = router;
