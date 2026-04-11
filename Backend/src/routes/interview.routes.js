const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")
const multer = require("multer")

// --- RATE LIMITING IMPORTS ---
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");

const interviewRouter = express.Router()

// --- Define the AI Rate Limiter ---
const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false, default: false },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: { 
        message: "You have reached your AI generation limit. Please try again in 15 minutes." 
    }
});
// Multer Error Handler
const handleResumeUpload = (req, res, next) => {
    const uploadMiddleware = upload.single("resume");
    
    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Catches "File too large" (the 5MB limit)
            return res.status(400).json({ message: "File is too large. Maximum size is 5MB." });
        } else if (err) {
            // Catches our custom "Invalid file type" error
            return res.status(400).json({ message: err.message });
        }
        // If no errors, proceed to the controller
        next();
    });
};

/**
 * @route POST /api/interview/
 * @description generate new interview report
 */
interviewRouter.post("/", authMiddleware.authUser, aiRateLimiter, handleResumeUpload, interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, aiRateLimiter, interviewController.generateResumePdfController)

/**
 * @route POST /api/interview/live/questions
 * @description Generate 3 questions for the live audio interview
 */
interviewRouter.post("/live/questions", authMiddleware.authUser, aiRateLimiter, interviewController.getLiveQuestionsController);

/**
 * @route POST /api/interview/live/evaluate
 * @description Grade the final Q&A transcript (At the end of the interview)
 */
interviewRouter.post("/live/evaluate", authMiddleware.authUser, aiRateLimiter, interviewController.evaluateInterviewController);

/**
 * @route POST /api/interview/live/evaluate-single
 * @description Grade a single Q&A pair and provide instant coaching
 */
interviewRouter.post("/live/evaluate-single", authMiddleware.authUser, aiRateLimiter, interviewController.evaluateSingleAnswerController);


/**
 * @route POST /api/interview/roadmap/dynamic
 */
interviewRouter.post("/roadmap/dynamic", authMiddleware.authUser, aiRateLimiter, interviewController.generateDynamicRoadmapController);


module.exports = interviewRouter