const express = require('express');

const router = express.Router();

router.use('/cities', require('./cityRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/charts', require('./chartRoutes'));
router.use('/ai', require('./aiChatRoutes'));
router.use('/', require('./horoscopeRoutes')); // mounts /horoscopes/*, /cosmic-weather/*, /lucky/*
router.use('/', require('./calendarRoutes')); // mounts /calendar/*, /transits/*, /planner/*
router.use('/compatibility', require('./compatibilityRoutes'));
router.use('/', require('./readingsRoutes')); // mounts /tarot/*, /numerology/*, /rituals/*, /angel-numbers/*
router.use('/journal', require('./journalRoutes'));
router.use('/community', require('./communityRoutes'));
router.use('/learn', require('./learnRoutes'));
router.use('/billing', require('./billingRoutes'));
router.use('/settings', require('./settingsRoutes'));

module.exports = router;
