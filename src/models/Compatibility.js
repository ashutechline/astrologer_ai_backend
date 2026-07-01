const mongoose = require('mongoose');
const { Schema } = mongoose;

const compatibilityReportSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chartA: { type: Schema.Types.ObjectId, ref: 'BirthChart', required: true },
    chartB: { type: Schema.Types.ObjectId, ref: 'BirthChart', required: true },
    mode: { type: String, enum: ['romantic', 'friendship', 'professional'], default: 'romantic' },

    synastryAspects: [
      {
        planetA: String,
        planetB: String,
        aspect: String,
        symbol: String,
        exactOrb: Number,
        _id: false,
      },
    ],

    scores: {
      love: { type: Number, min: 0, max: 100 },
      communication: { type: Number, min: 0, max: 100 },
      values: { type: Number, min: 0, max: 100 },
    },

    aiReading: { type: String, default: null }, // 3-paragraph AI-generated relationship reading

    composite: {
      planets: [{ key: String, name: String, longitude: Number, sign: String, degreeInSign: Number, _id: false }],
      ascendant: { sign: String, degreeInSign: Number, _id: false },
    },
  },
  { timestamps: true }
);

const compatibilityInviteSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    creatorChartId: { type: Schema.Types.ObjectId, ref: 'BirthChart', required: true },
    mode: { type: String, enum: ['romantic', 'friendship', 'professional'], default: 'romantic' },
    status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
    resultReportId: { type: Schema.Types.ObjectId, ref: 'CompatibilityReport', default: null },
  },
  { timestamps: true }
);

module.exports = {
  CompatibilityReport: mongoose.model('CompatibilityReport', compatibilityReportSchema),
  CompatibilityInvite: mongoose.model('CompatibilityInvite', compatibilityInviteSchema),
};
