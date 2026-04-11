const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const { searchJobsController } = require("../controllers/job.controller");

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");

const router = express.Router();

// --- Define the Job API Rate Limiter ---
const jobRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Allow 20 searches per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false, default: false },

    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: { 
        message: "You are searching too fast! Please wait a few minutes before trying again." 
    }
});

/**
 * @route GET /api/jobs/search?location=London&title=Software%20Engineer
 * @description search for jobs
 * @access private
 */

// 🔒 Apply the authentication AND the rate limiter
router.get("/search", authUser, jobRateLimiter, searchJobsController);

module.exports = router;