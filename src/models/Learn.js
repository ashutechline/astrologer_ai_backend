const mongoose = require('mongoose');
const { Schema } = mongoose;

const lessonSchema = new Schema(
  { title: String, contentType: { type: String, enum: ['video', 'text'] }, contentUrl: String, body: String, order: Number },
  { _id: true }
);

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    track: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    coverImageUrl: { type: String, default: null },
    lessons: [lessonSchema],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const courseProgressSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessonIds: [{ type: Schema.Types.ObjectId }],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
courseProgressSchema.index({ owner: 1, course: 1 }, { unique: true });

const referenceEntrySchema = new Schema(
  {
    category: { type: String, enum: ['planets', 'signs', 'houses', 'aspects'], required: true, index: true },
    key: { type: String, required: true }, // e.g. 'mars', 'leo', 'house_7', 'square'
    title: { type: String, required: true },
    summary: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

const quizQuestionSchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD' — one quiz question per day
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
  },
  { timestamps: true }
);

const quizAttemptSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    selectedIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
  },
  { timestamps: true }
);
quizAttemptSchema.index({ owner: 1, date: 1 }, { unique: true });

module.exports = {
  Course: mongoose.model('Course', courseSchema),
  CourseProgress: mongoose.model('CourseProgress', courseProgressSchema),
  ReferenceEntry: mongoose.model('ReferenceEntry', referenceEntrySchema),
  QuizQuestion: mongoose.model('QuizQuestion', quizQuestionSchema),
  QuizAttempt: mongoose.model('QuizAttempt', quizAttemptSchema),
};
