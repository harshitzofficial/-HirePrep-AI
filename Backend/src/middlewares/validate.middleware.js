const { body, param, query, validationResult } = require("express-validator");

/**
 * @description Reads the validation results from express-validator and, if there
 * are errors, immediately returns a 400 with the first error message.
 * Apply this as the LAST middleware in any validation chain.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return only the first error to keep the response clean
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────

const validateRegister = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required.")
        .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters.")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores."),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required.")
        .isEmail().withMessage("Please provide a valid email address.")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required.")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),

    handleValidationErrors,
];

const validateLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required.")
        .isEmail().withMessage("Please provide a valid email address.")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required."),

    handleValidationErrors,
];

// ─── Interview Validators ─────────────────────────────────────────────────────

const validateGenerateReport = [
    body("jobDescription")
        .trim()
        .notEmpty().withMessage("Job description is required.")
        .isLength({ min: 5, max: 10000 }).withMessage("Job description must be between 5 and 10,000 characters."),

    body("selfDescription")
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage("Self description cannot exceed 2,000 characters."),

    handleValidationErrors,
];

const validateLiveQuestions = [
    body("jobDescription")
        .trim()
        .notEmpty().withMessage("Job description is required.")
        .isLength({ min: 5, max: 10000 }).withMessage("Job description must be between 5 and 10,000 characters."),

    body("interviewType")
        .optional()
        .trim()
        .isIn(["Technical Interview", "Behavioral Interview", "System Design Round", "Mixed/General"])
        .withMessage("Invalid interview type."),

    body("userCommand")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Custom focus cannot exceed 500 characters."),

    handleValidationErrors,
];

const validateEvaluateInterview = [
    body("transcript")
        .isArray({ min: 1 }).withMessage("Transcript must be a non-empty array of Q&A pairs."),

    body("transcript.*.question")
        .trim()
        .notEmpty().withMessage("Each transcript entry must have a question."),

    body("transcript.*.answer")
        .trim()
        .notEmpty().withMessage("Each transcript entry must have an answer."),

    body("jobDescription")
        .trim()
        .notEmpty().withMessage("Job description is required.")
        .isLength({ min: 5, max: 10000 }).withMessage("Job description must be between 5 and 10,000 characters."),

    handleValidationErrors,
];

const validateEvaluateSingleAnswer = [
    body("question")
        .trim()
        .notEmpty().withMessage("Question is required.")
        .isLength({ max: 1000 }).withMessage("Question cannot exceed 1,000 characters."),

    body("answer")
        .trim()
        .notEmpty().withMessage("Answer is required.")
        .isLength({ max: 5000 }).withMessage("Answer cannot exceed 5,000 characters."),

    body("jobDescription")
        .trim()
        .notEmpty().withMessage("Job description is required.")
        .isLength({ min: 5, max: 10000 }).withMessage("Job description must be between 5 and 10,000 characters."),

    handleValidationErrors,
];

const validateLiveHint = [
    body("question")
        .trim()
        .notEmpty().withMessage("Question is required.")
        .isLength({ max: 1000 }).withMessage("Question cannot exceed 1,000 characters."),

    body("jobDescription")
        .trim()
        .notEmpty().withMessage("Job description is required.")
        .isLength({ min: 5, max: 10000 }).withMessage("Job description must be between 5 and 10,000 characters."),

    handleValidationErrors,
];

const validateDynamicRoadmap = [
    body("jobDescription")
        .trim()
        .notEmpty().withMessage("Job description is required.")
        .isLength({ min: 5, max: 10000 }).withMessage("Job description must be between 5 and 10,000 characters."),

    body("days")
        .notEmpty().withMessage("Number of days is required.")
        .isInt({ min: 1, max: 30 }).withMessage("Days must be a number between 1 and 30."),

    handleValidationErrors,
];

// ─── Job Validators ───────────────────────────────────────────────────────────

const validateJobSearch = [
    query("location")
        .trim()
        .notEmpty().withMessage("Location query parameter is required.")
        .isLength({ min: 2, max: 100 }).withMessage("Location must be between 2 and 100 characters."),

    handleValidationErrors,
];

// ─── Param Validators ─────────────────────────────────────────────────────────

const validateMongoId = (paramName) => [
    param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName}: must be a valid MongoDB ID.`),

    handleValidationErrors,
];

module.exports = {
    validateRegister,
    validateLogin,
    validateGenerateReport,
    validateLiveQuestions,
    validateEvaluateInterview,
    validateEvaluateSingleAnswer,
    validateLiveHint,
    validateDynamicRoadmap,
    validateJobSearch,
    validateMongoId,
};
