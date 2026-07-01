const mongoose = require('mongoose');
const { Schema } = mongoose;

const aiConversationSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chartId: { type: Schema.Types.ObjectId, ref: 'BirthChart', required: true },
    type: { type: String, enum: ['astrologer', 'tutor'], default: 'astrologer' },
    title: { type: String, default: 'New conversation' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const aiMessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'AiConversation', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    bookmarked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

aiMessageSchema.index({ conversation: 1, createdAt: 1 });

/** Tracks the free-tier daily AI question quota, keyed per user per UTC day. */
const aiQuotaSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dateKey: { type: String, required: true }, // 'YYYY-MM-DD' in UTC
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);
aiQuotaSchema.index({ owner: 1, dateKey: 1 }, { unique: true });

module.exports = {
  AiConversation: mongoose.model('AiConversation', aiConversationSchema),
  AiMessage: mongoose.model('AiMessage', aiMessageSchema),
  AiQuota: mongoose.model('AiQuota', aiQuotaSchema),
};
