const { Router } = require('express');
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");

const authRouter = Router();

// --- Define the Strict Auth Rate Limiter ---
// Blocks bots from brute-forcing passwords or spamming fake accounts
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit to 20 attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false, default: false },
    store: redisClient.isOpen 
        ? new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
        })
        : new rateLimit.MemoryStore(), // Fallback to memory store if Redis is down
    message: { 
        message: "Too many authentication attempts. Please try again in 15 minutes." 
    }
});

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authRateLimiter, authController.registerUserController);

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login", authRateLimiter, authController.loginUserController);

/**
 * @route POST /api/auth/logout
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
// 🚨 CHANGED TO POST TO PREVENT CSRF ATTACKS
authRouter.post("/logout", authController.logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

module.exports = authRouter;


