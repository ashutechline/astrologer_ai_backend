const express = require('express');
const { searchCities } = require('../controllers/cityController');

const router = express.Router();

// GET /cities/search?name=Delhi
router.get('/search', searchCities);
// We can also route the root /cities to search
router.get('/', searchCities);

module.exports = router;
