const express = require('express');
const ctrl = require('../controllers/calendarController');
const validate = require('../middleware/validate');
const v = require('../validators/calendarValidators');
const { requireAuth, loadUser, requirePro } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, loadUser);

router.get('/calendar/month', validate(v.monthQuery), ctrl.getMonthCalendar);
router.get('/calendar/upcoming', validate(v.upcomingQuery), ctrl.getUpcomingEvents);
router.get('/calendar/day', validate(v.dayQuery), ctrl.getDayDetail);

router.get('/transits/live', validate(v.chartIdQuery), ctrl.getLiveTransits);
// Timeline itself enforces the 3-month free preview internally rather than a hard requirePro gate,
// so free users still get a partial, upsell-able response instead of a flat 402.
router.get('/transits/timeline', validate(v.timelineQuery), ctrl.getTransitTimeline);
router.get('/transits/returns', requirePro, validate(v.chartIdQuery), ctrl.getReturns);

router.post('/planner/best-day', requirePro, validate(v.bestDayBody), ctrl.planBestDay);

module.exports = router;
