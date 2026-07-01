const { Post, Comment, Follow, LiveEvent } = require('../models/Community');
const BirthChart = require('../models/BirthChart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

const PAGE_SIZE = 20;

/** GET /community/feed?signFilter=&cursor= */
async function getFeed(req, res) {
  const { signFilter, cursor } = req.query;
  const filter = {};
  if (signFilter) filter.sunSignAtPost = signFilter;
  if (cursor) filter._id = { $lt: cursor };

  const posts = await Post.find(filter)
    .sort({ _id: -1 })
    .limit(PAGE_SIZE)
    .populate('author', 'name avatarUrl');

  const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1]._id : null;
  sendSuccess(res, { data: posts, meta: { nextCursor } });
}

/** POST /community/posts */
async function createPost(req, res) {
  const { content, imageUrl } = req.body;
  const post = await Post.create({ author: req.userId, content, imageUrl });

  // Best-effort: attach the user's sun sign for the filter chips, if their primary chart has been computed
  if (req.user.defaultChartId) {
    const chart = await BirthChart.findById(req.user.defaultChartId).select('computed.sunSign');
    if (chart?.computed?.sunSign) {
      post.sunSignAtPost = chart.computed.sunSign;
      await post.save();
    }
  }

  await post.populate('author', 'name avatarUrl');
  sendSuccess(res, { statusCode: 201, data: post });
}

/** DELETE /community/posts/:id */
async function deletePost(req, res) {
  const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.userId });
  if (!post) throw ApiError.notFound('Post not found or not yours to delete', 'POST_NOT_FOUND');
  await Comment.deleteMany({ post: post._id });
  sendSuccess(res, { data: { deleted: true } });
}

/** POST /community/posts/:id/like — toggles like/unlike */
async function toggleLike(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');

  const idx = post.likes.findIndex((id) => id.toString() === req.userId);
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(req.userId);

  await post.save();
  sendSuccess(res, { data: { liked: idx < 0, likeCount: post.likes.length } });
}

/** GET /community/posts/:id/comments */
async function getComments(req, res) {
  const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: 1 }).populate('author', 'name avatarUrl');
  sendSuccess(res, { data: comments });
}

/** POST /community/posts/:id/comments */
async function addComment(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found', 'POST_NOT_FOUND');

  const comment = await Comment.create({ post: post._id, author: req.userId, content: req.body.content });
  post.commentCount += 1;
  await post.save();

  await comment.populate('author', 'name avatarUrl');
  sendSuccess(res, { statusCode: 201, data: comment });
}

/** GET /community/events/live */
async function getLiveEvent(req, res) {
  const now = new Date();
  const event = await LiveEvent.findOne({ startsAt: { $lte: now }, endsAt: { $gte: now } }).sort({ startsAt: 1 });
  sendSuccess(res, { data: event || null });
}

/** POST /community/follow/:userId */
async function followUser(req, res) {
  const { userId } = req.params;
  if (userId === req.userId) throw ApiError.badRequest('You cannot follow yourself', 'INVALID_FOLLOW');

  const existing = await Follow.findOne({ follower: req.userId, following: userId });
  if (existing) {
    await existing.deleteOne();
    return sendSuccess(res, { data: { following: false } });
  }
  await Follow.create({ follower: req.userId, following: userId });
  sendSuccess(res, { data: { following: true } });
}

module.exports = { getFeed, createPost, deletePost, toggleLike, getComments, addComment, getLiveEvent, followUser };
