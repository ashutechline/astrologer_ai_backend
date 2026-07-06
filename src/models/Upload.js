const mongoose = require('mongoose');
const { Schema } = mongoose;

const uploadSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String },
    resourceType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
