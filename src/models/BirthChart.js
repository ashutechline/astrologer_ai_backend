const mongoose = require('mongoose');
const { Schema } = mongoose;

const planetSchema = new Schema(
  {
    key: String,
    name: String,
    longitude: Number,
    sign: String,
    degreeInSign: Number,
    speed: Number,
    retrograde: Boolean,
    house: Number,
  },
  { _id: false }
);

const houseSchema = new Schema(
  { house: Number, longitude: Number, sign: String, degreeInSign: Number },
  { _id: false }
);

const aspectSchema = new Schema(
  {
    planetA: String,
    planetB: String,
    aspect: String,
    symbol: String,
    angle: Number,
    exactOrb: Number,
  },
  { _id: false }
);

const signDegreeSchema = new Schema({ sign: String, degreeInSign: Number, absoluteDegree: Number }, { _id: false });

const birthChartSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 80 }, // e.g. "Me", "Partner", a friend's name

    // Raw inputs (kept so the chart can be recalculated if house system / zodiac system changes)
    birthDate: { type: String, required: true }, // 'YYYY-MM-DD'
    birthTime: { type: String, default: null }, // 'HH:mm', null if unknown
    timeUnknown: { type: Boolean, default: false },
    birthPlace: {
      placeName: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      utcOffsetMinutes: { type: Number, required: true },
    },

    houseSystem: { type: String, enum: ['placidus', 'whole_sign', 'koch', 'equal'], default: 'placidus' },
    zodiacSystem: { type: String, enum: ['western', 'vedic', 'chinese'], default: 'western' },

    // Cached computed output — recomputed whenever inputs or systems change
    computed: {
      jd: Number,
      planets: [planetSchema],
      houses: [houseSchema],
      ascendant: signDegreeSchema,
      midheaven: signDegreeSchema,
      aspects: [aspectSchema],
      sunSign: String,
      moonSign: String,
      risingSign: String,
      computedAt: Date,
    },

    isPrimary: { type: Boolean, default: false }, // the user's own chart vs. a saved friend/partner chart
  },
  { timestamps: true }
);

birthChartSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('BirthChart', birthChartSchema);
