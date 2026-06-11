const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  boundary: {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // [[[lng, lat], [lng, lat], ...]]
      required: true
    }
  },
  baseFare: {
    type: Number,
    required: true,
    min: 0
  },
  perKmRate: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Create a 2dsphere index for fast geospatial boundary searches
zoneSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("Zone", zoneSchema);
