const express = require('express');
const router = express.Router();
const moonPhaseController = require('../controllers/moonPhaseController');

router.get('/current', moonPhaseController.getCurrentPhase);
router.get('/upcoming', moonPhaseController.getUpcomingPhases);
router.get('/date/:date', moonPhaseController.getPhaseByDate);

module.exports = router;
