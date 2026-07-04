const express = require('express');
const ctrl = require('../controllers/journalController');
const validate = require('../middleware/validate');
const v = require('../validators/journalValidators');
const { requireAuth, loadUser, requirePro } = require('../middleware/auth');

const router = express.Router();

// Public — used by the UI to populate the tag picker before authentication
router.get('/tags', ctrl.getTags);

router.use(requireAuth, loadUser, requirePro); // entire Journal module is premium per the feature catalogue

router.get('/entries', validate(v.listEntries), ctrl.listEntries);
router.post('/entries', validate(v.createEntry), ctrl.createEntry);
router.patch('/entries/:id', validate(v.updateEntry), ctrl.updateEntry);
router.delete('/entries/:id', validate(v.idParam), ctrl.deleteEntry);
router.get('/prompt-of-the-day', validate(v.promptQuery), ctrl.getPromptOfTheDay);
router.get('/monthly-reflection', validate(v.monthlyReflectionQuery), ctrl.getMonthlyReflection);

module.exports = router;
