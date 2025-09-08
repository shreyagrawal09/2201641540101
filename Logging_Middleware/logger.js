const axios = require("axios");

const LOG_ENDPOINT = "http://20.244.56.144/evaluation-service/logs";

async function Log(stack, level, pkg, message) {
  const allowedStacks = ["backend", "frontend"];
  const allowedLevels = ["debug", "info", "warn", "error", "fatal"];
  const allowedPackages = [
    "cache","controller","cron.job","db","domain","handler","repository","route","service",
    "api","component","hook","page","state","style",
    "auth","config","middleware","utils"
  ];

  if (!allowedStacks.includes(stack)) {
    return console.error("❌ Invalid stack:", stack);
  }
  if (!allowedLevels.includes(level)) {
    return console.error("❌ Invalid level:", level);
  }
  if (!allowedPackages.includes(pkg)) {
    return console.error("❌ Invalid package:", pkg);
  }

  const logData = { stack, level, package: pkg, message };

  try {
    const response = await axios.post(LOG_ENDPOINT, logData);
    console.log(`📤 [${stack}] [${level.toUpperCase()}] (${pkg}) → ${message}`);
    return response.data;
  } catch (err) {
    console.error("❌ Failed to send log:", err.message);
  }
}

module.exports = Log;
