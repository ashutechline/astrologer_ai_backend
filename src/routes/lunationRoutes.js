const express = require('express');
const router = express.Router();
const lunationController = require('../controllers/lunationController');

router.get('/current', lunationController.getCurrentLunation);
router.get('/upcoming', lunationController.getUpcomingLunations);
router.get('/date/:date', lunationController.getLunationByDate);

module.exports = router;
