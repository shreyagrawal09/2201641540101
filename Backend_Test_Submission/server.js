const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const Log = require("../Logging Middleware/logger");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use(async (req, res, next) => {
  await Log("backend", "info", "middleware", `${req.method} ${req.originalUrl}`);
  next();
});

app.use("/", require("./routes/urlRoutes"));

async function registerService() {
  try {
    const resp = await axios.post("http://20.244.56.144/evaluation-service/register", {
      name: "URL Shortener Service",
      description: "Shortens URLs, redirects and provides click stats",
      owner: "your-name-here"
    });
    console.log("✅ Service registered:", resp.data);
    await Log("backend", "info", "service", "Service registered successfully");
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    await Log("backend", "fatal", "service", `Registration failed: ${err.message}`);
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT, async () => {
      console.log(`🚀 Running on port ${process.env.PORT}`);
      await registerService();
    });
  })
  .catch(async (err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    await Log("backend", "fatal", "db", `Database connection failure: ${err.message}`);
  });
