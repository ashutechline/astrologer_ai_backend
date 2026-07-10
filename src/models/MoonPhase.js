const mongoose = require('mongoose');

const moonPhaseSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent',
      ],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    theme: { type: String, required: true },
    career: { type: String, required: true },
    love: { type: String, required: true },
    health: { type: String, required: true },
    finance: { type: String, required: true },
    spiritual: { type: String, required: true },
    affirmation: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MoonPhase', moonPhaseSchema);
