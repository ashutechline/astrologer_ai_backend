const express = require('express');
const router = express.Router();
const ephemerisController = require('../controllers/ephemerisController');
const { requireAuth } = require('../middleware/auth');

// Make it require auth if your API standards expect it, or remove if public.
// Assuming requireAuth is standard for app endpoints based on index.js patterns.
router.get('/', requireAuth, ephemerisController.getEphemeris);

module.exports = router;
