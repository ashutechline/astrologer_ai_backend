const express = require('express');
const ctrl = require('../controllers/chartController');
const validate = require('../middleware/validate');
const v = require('../validators/chartValidators');
const { requireAuth, loadUser } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, loadUser);

router.post('/', validate(v.createChart), ctrl.createChart);
router.get('/', ctrl.listCharts);
router.get('/:chartId', validate(v.chartIdParam), ctrl.getChart);
router.patch('/:chartId', validate(v.updateChart), ctrl.updateChart);
router.delete('/:chartId', validate(v.chartIdParam), ctrl.deleteChart);
router.get('/:chartId/aspects', validate(v.chartIdParam), ctrl.getAspects);
router.post('/:chartId/share-image', validate(v.chartIdParam), ctrl.shareImage);

module.exports = router;
