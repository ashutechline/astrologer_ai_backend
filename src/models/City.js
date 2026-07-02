const mongoose = require('mongoose');

const { Schema } = mongoose;

const citySchema = new Schema(
  {
    city: { type: String, trim: true, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    country: { type: String, trim: true },
    iso2: { type: String, trim: true },
    admin_name: { type: String, trim: true },
    capital: { type: String, trim: true },
    population: { type: Number },
    population_proper: { type: Number }
  },
  { timestamps: true }
);

// Add a compound index to support faster text-based searches or sorting if needed
citySchema.index({ city: 1, admin_name: 1 });

module.exports = mongoose.model('City', citySchema);
