const express = require('express');
const ctrl = require('../controllers/readingsController');
const tarotCtrl = require('../controllers/tarotReadingController');
const validate = require('../middleware/validate');
const v = require('../validators/readingsValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

router.get('/tarot/daily', requireAuth, loadUser, validate(v.tarotQuery), ctrl.getDailyTarot);
router.get('/numerology/profile', requireAuth, loadUser, validate(v.chartIdQuery), ctrl.getNumerologyProfile);
router.get('/rituals/:phase?', validate(v.phaseParam), ctrl.getMoonRitual); // public reference content
router.get('/angel-numbers/:number', validate(v.numberParam), ctrl.getAngelNumber); // public reference content

// Tarot Card Reading Interactive Flows
router.post('/tarot-card-new-reading', requireAuth, loadUser, validate(v.tarotNewReading), tarotCtrl.startTarotReading);
router.post('/tarot-card-contiune-reading', requireAuth, loadUser, validate(v.tarotContinueReading), tarotCtrl.continueTarotReading);
router.post('/tarot-card-continue-reading', requireAuth, loadUser, validate(v.tarotContinueReading), tarotCtrl.continueTarotReading);
router.get('/tarot-card-reading', requireAuth, loadUser, tarotCtrl.getTarotReadings);
router.get('/tarot-card-reading/:id', requireAuth, loadUser, validate(v.tarotReadingIdParam), tarotCtrl.getTarotReading);

module.exports = router;

