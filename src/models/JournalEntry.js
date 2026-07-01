const mongoose = require('mongoose');
const { Schema } = mongoose;

const journalEntrySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD', the day the entry is about
    text: { type: String, required: true },
    moodEmoji: { type: String, default: null },
    moonPhase: { type: String, default: null }, // snapshotted at creation time for display
    tags: [{ type: String }],
  },
  { timestamps: true }
);

journalEntrySchema.index({ owner: 1, date: -1 });
// Lightweight text index for the journal search/tag filter feature
journalEntrySchema.index({ text: 'text' });
journalEntrySchema.index({ tags: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
