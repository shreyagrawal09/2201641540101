const express = require("express");
const router = express.Router();
const Url = require("../models/Url");
const shortid = require("shortid");
const Log = require("../../Logging Middleware/logger");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";


router.post("/shorturls", async (req, res) => {
  const { url, shortcode, validity } = req.body;

  try {
    if (!url || typeof url !== "string") {
      await Log("backend", "error", "handler", "Invalid URL provided");
      return res.status(400).json({ error: "Invalid URL" });
    }

    const finalCode = shortcode || shortid.generate();
    const expiryDate = validity
      ? new Date(Date.now() + validity * 60000)
      : new Date(Date.now() + 30 * 60000); 

    const existing = await Url.findOne({ shortcode: finalCode });
    if (existing) {
      await Log("backend", "error", "handler", `Shortcode already exists: ${finalCode}`);
      return res.status(400).json({ error: "Shortcode already in use" });
    }

    const shortUrl = `${BASE_URL}/shorturls/${finalCode}`;
    const newUrl = new Url({
      shortcode: finalCode,
      longUrl: url,
      shortUrl,
      expiry: expiryDate
    });

    await newUrl.save();
    await Log("backend", "info", "handler", `Created short URL: ${shortUrl}`);

    res.status(201).json({
      shortLink: shortUrl,
      expiry: expiryDate.toISOString()
    });
  } catch (err) {
    await Log("backend", "error", "handler", `Server error: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shorturls/:code", async (req, res) => {
  try {
    const urlDoc = await Url.findOne({ shortcode: req.params.code });
    if (!urlDoc) {
      await Log("backend", "error", "route", `Short URL not found: ${req.params.code}`);
      return res.status(404).json({ error: "No short URL found" });
    }

    if (new Date() > urlDoc.expiry) {
      await Log("backend", "warn", "handler", `Expired shortcode: ${req.params.code}`);
      return res.status(410).json({ error: "Short URL expired" });
    }

    urlDoc.clicks++;
    urlDoc.clickDetails.push({
      timestamp: new Date(),
      referrer: req.get("Referrer") || "unknown",
      ip: req.ip
    });
    await urlDoc.save();

    await Log("backend", "info", "route", `Redirecting ${req.params.code} → ${urlDoc.longUrl}`);
    return res.redirect(urlDoc.longUrl);
  } catch (err) {
    await Log("backend", "error", "handler", `Redirect error: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/shorturls/:code/stats", async (req, res) => {
  try {
    const urlDoc = await Url.findOne({ shortcode: req.params.code });
    if (!urlDoc) {
      await Log("backend", "error", "repository", `Stats not found for ${req.params.code}`);
      return res.status(404).json({ error: "Short URL not found" });
    }

    res.json({
      originalUrl: urlDoc.longUrl,
      createdAt: urlDoc.createdAt,
      expiry: urlDoc.expiry,
      totalClicks: urlDoc.clicks,
      clickDetails: urlDoc.clickDetails
    });
  } catch (err) {
    await Log("backend", "error", "handler", `Stats error: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;