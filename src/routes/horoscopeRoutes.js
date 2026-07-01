const express = require('express');
const ctrl = require('../controllers/horoscopeController');
const validate = require('../middleware/validate');
const v = require('../validators/contentValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

// Horoscopes are public/free — no auth required to read them
router.get('/horoscopes/daily', validate(v.signQuery), ctrl.getDailyHoroscope);
router.get('/horoscopes/daily/all', ctrl.getAllDailyHoroscopes);
router.get('/horoscopes/weekly', validate(v.signQuery), ctrl.getWeeklyHoroscope);

// Cosmic weather and lucky widget are personalized — require auth
router.get('/cosmic-weather/today', requireAuth, loadUser, validate(v.optionalChartIdQuery), ctrl.getCosmicWeatherToday);
router.get('/lucky/today', requireAuth, loadUser, validate(v.chartIdQuery), ctrl.getLuckyToday);

module.exports = router;
