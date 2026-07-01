const express = require('express');
const ctrl = require('../controllers/communityController');
const validate = require('../middleware/validate');
const v = require('../validators/communityValidators');
const { requireAuth, loadUser, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Feed and live-event banner are viewable without an account (read-only community per the feature catalogue);
// optionalAuth still attaches req.userId if present, useful later for "liked by me" flags.
router.get('/feed', optionalAuth, validate(v.feedQuery), ctrl.getFeed);
router.get('/events/live', ctrl.getLiveEvent);
router.get('/posts/:id/comments', validate(v.postIdParam), ctrl.getComments);

// Posting, liking, commenting, and following require an account
router.use(requireAuth, loadUser);

router.post('/posts', validate(v.createPost), ctrl.createPost);
router.delete('/posts/:id', validate(v.postIdParam), ctrl.deletePost);
router.post('/posts/:id/like', validate(v.postIdParam), ctrl.toggleLike);
router.post('/posts/:id/comments', validate(v.addComment), ctrl.addComment);
router.post('/follow/:userId', validate(v.followParam), ctrl.followUser);

module.exports = router;
