const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 2000 },
    imageUrl: { type: String, default: null },
    sunSignAtPost: { type: String, default: null }, // for the sign-filter chips
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
postSchema.index({ createdAt: -1 });
postSchema.index({ sunSignAtPost: 1, createdAt: -1 });

const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const followSchema = new Schema(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const liveEventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['full_moon_circle', 'eclipse_watch_party', 'new_moon_ritual', 'other'], default: 'other' },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    joinUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = {
  Post: mongoose.model('Post', postSchema),
  Comment: mongoose.model('Comment', commentSchema),
  Follow: mongoose.model('Follow', followSchema),
  LiveEvent: mongoose.model('LiveEvent', liveEventSchema),
};
