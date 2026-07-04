const express = require('express');
const ctrl = require('../controllers/readingsController');
const validate = require('../middleware/validate');
const v = require('../validators/readingsValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

router.get('/tarot/daily', requireAuth, loadUser, validate(v.tarotQuery), ctrl.getDailyTarot);
router.get('/numerology/profile', requireAuth, loadUser, validate(v.chartIdQuery), ctrl.getNumerologyProfile);
router.get('/rituals/:phase?', validate(v.phaseParam), ctrl.getMoonRitual); // public reference content
router.get('/angel-numbers/:number', validate(v.numberParam), ctrl.getAngelNumber); // public reference content

module.exports = router;
