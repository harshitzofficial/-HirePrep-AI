const pdfParse = require("pdf-parse");
const crypto = require("crypto");
const redisClient = require("../config/redis");
const interviewReportModel = require("../models/interviewReport.model");
const interviewSessionModel = require("../models/interviewSession.model");
const {
    generateInterviewReport,
    generateResumePdf,
    generateLiveQuestions,
    evaluateLiveInterview,
    evaluateSingleAnswer,
    generateDynamicRoadmap,
    generateLiveHint
} = require("./ai.service");

class InterviewService {
    async generateDynamicRoadmap({ interviewId, jobDescription, resumeText, days }) {
        const data = await generateDynamicRoadmap({ jobDescription, resumeText, days });
        
        if (interviewId) {
            await interviewReportModel.findByIdAndUpdate(
                interviewId, 
                { preparationPlan: data.preparationPlan }
            );
        }
        return data;
    }

    async generateInterviewReport({ fileBuffer, selfDescription, jobDescription, userId }) {
        let resumeText = "";
        let resumeFilePart = null;
        let fileHash = "";
        
        if (fileBuffer) {
            const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(fileBuffer))).getText();
            resumeText = resumeContent.text;
            
            fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

            if (!resumeText || resumeText.trim().length < 50) {
                resumeFilePart = {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType: "application/pdf"
                    }
                };
            }
        }

        const rawData = String(userId) + (resumeText || "") + fileHash + (jobDescription || "") + (selfDescription || "");
        const cacheKey = `report_cache:${crypto.createHash('sha256').update(rawData).digest('hex')}`;

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("⚡ CACHE HIT: Serving from Redis, saved Gemini API cost!");
            return { fromCache: true, report: JSON.parse(cachedData) };
        }

        console.log("🐢 CACHE MISS: Calling Gemini API...");
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            resumeFilePart,
            selfDescription,
            jobDescription
        });

        const interviewReport = await interviewReportModel.create({
            user: userId,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        });

        await redisClient.setEx(cacheKey, 86400, JSON.stringify(interviewReport));
        return { fromCache: false, report: interviewReport };
    }

    async getReportById(interviewId, userId) {
        const report = await interviewReportModel.findOne({ _id: interviewId, user: userId });
        if (!report) {
            const err = new Error("Interview report not found.");
            err.statusCode = 404;
            throw err;
        }
        return report;
    }

    async getAllReports(userId) {
        return await interviewReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");
    }

    async generatePdf(interviewReportId) {
        const report = await interviewReportModel.findById(interviewReportId);
        if (!report) {
            const err = new Error("Interview report not found.");
            err.statusCode = 404;
            throw err;
        }
        return await generateResumePdf({ 
            resume: report.resume, 
            jobDescription: report.jobDescription, 
            selfDescription: report.selfDescription 
        });
    }

    async getLiveQuestions(data) {
        return await generateLiveQuestions(data);
    }

    async evaluateInterview({ transcript, jobDescription, interviewReportId, aiMetrics, userId }) {
        const evaluationData = await evaluateLiveInterview({ transcript, jobDescription, aiMetrics });

        const session = await interviewSessionModel.create({
            user: userId,
            interviewReport: interviewReportId,
            transcript,
            aiMetrics: {
                avgConfidence: aiMetrics?.avgConfidence ?? 0,
                eyeContactScore: aiMetrics?.eyeContactScore ?? 0
            },
            ...evaluationData
        });

        return { ...evaluationData, sessionId: session._id };
    }

    async getAllSessions(userId) {
        return await interviewSessionModel.find({ user: userId })
            .populate('interviewReport', 'title')
            .sort({ createdAt: -1 });
    }

    async evaluateSingleAnswer(data) {
        return await evaluateSingleAnswer(data);
    }

    async getLiveHint(data) {
        return await generateLiveHint(data);
    }

    async deleteReport(interviewId, userId) {
        const report = await interviewReportModel.findOneAndDelete({
            _id: interviewId,
            user: userId
        });

        if (!report) {
            const err = new Error("Report not found or you are not authorized to delete it.");
            err.statusCode = 404;
            throw err;
        }
        return report;
    }
}

module.exports = new InterviewService();
