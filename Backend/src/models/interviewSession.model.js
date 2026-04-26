const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    interviewReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport"
    },
    transcript: [
        {
            question: String,
            answer: String,
            feedback: String
        }
    ],
    overallScore: {
        type: Number,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    skills: {
        confidence: Number,
        communication: Number,
        correctness: Number
    },
    questionBreakdown: [
        {
            question: String,
            score: Number,
            feedback: String
        }
    ],
    // Fix #4: persist the biometric data so MockHistory can display it
    aiMetrics: {
        avgConfidence:   { type: Number, default: 0 },
        eyeContactScore: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

const interviewSessionModel = mongoose.model("InterviewSession", interviewSessionSchema);

module.exports = interviewSessionModel;
