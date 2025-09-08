const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  shortcode: { type: String, unique: true },
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
  expiry: { type: Date },
  clicks: { type: Number, default: 0 },
  clickDetails: [
    {
      timestamp: Date,
      referrer: String,
      ip: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Url", urlSchema);