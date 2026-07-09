const { Course, CourseProgress, ReferenceEntry, QuizQuestion, QuizAttempt } = require('../models/Learn');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function getDateKey(dateParam) {
  if (!dateParam) return todayKey();
  try {
    const d = new Date(dateParam);
    if (isNaN(d.getTime())) return todayKey();
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return todayKey();
  }
}

/** GET /learn/courses?track= */
async function listCourses(req, res) {
  const { track } = req.query;
  const filter = track ? { track } : {};
  const courses = await Course.find(filter).sort({ order: 1 }).select('-lessons.body'); // lesson bodies fetched on detail view only

  const progressDocs = await CourseProgress.find({ owner: req.userId, course: { $in: courses.map((c) => c._id) } });
  const progressByCourse = Object.fromEntries(progressDocs.map((p) => [p.course.toString(), p]));

  const withProgress = courses.map((c) => {
    const progress = progressByCourse[c._id.toString()];
    const completedCount = progress?.completedLessonIds.length || 0;
    return {
      ...c.toObject(),
      progressPercent: c.lessons.length ? Math.round((completedCount / c.lessons.length) * 100) : 0,
    };
  });

  sendSuccess(res, { data: withProgress });
}

/** GET /learn/courses/:id */
async function getCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const progress = await CourseProgress.findOne({ owner: req.userId, course: course._id });
  sendSuccess(res, { data: { course, completedLessonIds: progress?.completedLessonIds || [] } });
}

/** POST /learn/courses/:id/progress */
async function updateProgress(req, res) {
  const { lessonId, completed } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  let progress = await CourseProgress.findOne({ owner: req.userId, course: course._id });
  if (!progress) progress = new CourseProgress({ owner: req.userId, course: course._id, completedLessonIds: [] });

  const has = progress.completedLessonIds.some((id) => id.toString() === lessonId);
  if (completed && !has) progress.completedLessonIds.push(lessonId);
  if (!completed && has) progress.completedLessonIds = progress.completedLessonIds.filter((id) => id.toString() !== lessonId);

  if (progress.completedLessonIds.length === course.lessons.length) progress.completedAt = new Date();
  else progress.completedAt = null;

  await progress.save();
  sendSuccess(res, { data: progress });
}

/** GET /learn/reference/:category */
async function getReference(req, res) {
  const entries = await ReferenceEntry.find({ category: req.params.category }).sort({ title: 1 });
  sendSuccess(res, { data: entries });
}

/** GET /learn/quiz/daily?date= */
async function getDailyQuiz(req, res) {
  const { date } = req.query;
  const dateKey = getDateKey(date);
  const question = await QuizQuestion.findOne({ date: dateKey });
  if (!question) throw ApiError.notFound(`No quiz available for date ${dateKey}`, 'QUIZ_NOT_READY');

  const attempt = await QuizAttempt.findOne({ owner: req.userId, date: dateKey });
  // Hide the correct answer until the user has attempted it
  const payload = question.toObject();
  if (!attempt) delete payload.correctIndex;

  sendSuccess(res, { data: { question: payload, alreadyAnswered: !!attempt, yourAnswer: attempt || null } });
}

/** POST /learn/quiz/daily/answer */
async function answerDailyQuiz(req, res) {
  const { selectedIndex, date } = req.body;
  const dateKey = getDateKey(date || req.query.date);

  const existing = await QuizAttempt.findOne({ owner: req.userId, date: dateKey });
  if (existing) throw ApiError.conflict(`You already answered the quiz for date ${dateKey}`, 'QUIZ_ALREADY_ANSWERED');

  const question = await QuizQuestion.findOne({ date: dateKey });
  if (!question) throw ApiError.notFound(`No quiz available for date ${dateKey}`, 'QUIZ_NOT_READY');

  const correct = selectedIndex === question.correctIndex;
  const attempt = await QuizAttempt.create({ owner: req.userId, date: dateKey, selectedIndex, correct });

  sendSuccess(res, { data: { correct, correctIndex: question.correctIndex, attempt } });
}

/** GET /learn/quiz/leaderboard */
async function getLeaderboard(req, res) {
  const leaderboard = await QuizAttempt.aggregate([
    { $match: { correct: true } },
    { $group: { _id: '$owner', correctCount: { $sum: 1 } } },
    { $sort: { correctCount: -1 } },
    { $limit: 50 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, userId: '$_id', name: '$user.name', avatarUrl: '$user.avatarUrl', correctCount: 1 } },
  ]);

  sendSuccess(res, { data: leaderboard });
}

module.exports = {
  listCourses,
  getCourse,
  updateProgress,
  getReference,
  getDailyQuiz,
  answerDailyQuiz,
  getLeaderboard,
};
