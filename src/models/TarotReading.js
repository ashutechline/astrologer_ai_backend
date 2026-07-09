const mongoose = require('mongoose');
const { Schema } = mongoose;

const tarotReadingSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true },
    cards: [
      {
        card: { type: Schema.Types.ObjectId, ref: 'TarotCard', required: true },
        reversed: { type: Boolean, required: true },
        position: { type: String, enum: ['past', 'present', 'future'], required: true },
      },
    ],
    reading: { type: String, required: true }, // The initial AI reading interpretation
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TarotReading', tarotReadingSchema);
