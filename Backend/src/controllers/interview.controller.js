const interviewService = require("../services/interview.service");
const asyncHandler = require("../utils/asyncHandler");

const generateDynamicRoadmapController = asyncHandler(async (req, res) => {
    const { interviewId, jobDescription, resumeText, days } = req.body;
    const data = await interviewService.generateDynamicRoadmap({ interviewId, jobDescription, resumeText, days });
    res.status(200).json(data);
});

const generateInterViewReportController = asyncHandler(async (req, res) => {
    const { selfDescription, jobDescription } = req.body;
    const { fromCache, report } = await interviewService.generateInterviewReport({
        fileBuffer: req.file?.buffer,
        selfDescription,
        jobDescription,
        userId: req.user.id
    });

    res.status(fromCache ? 200 : 201).json({
        message: fromCache ? "Interview report fetched from cache instantly." : "Interview report generated successfully.",
        interviewReport: report
    });
});

const getInterviewReportByIdController = asyncHandler(async (req, res) => {
    const report = await interviewService.getReportById(req.params.interviewId, req.user.id);
    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport: report
    });
});

const getAllInterviewReportsController = asyncHandler(async (req, res) => {
    const reports = await interviewService.getAllReports(req.user.id);
    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports: reports
    });
});

const generateResumePdfController = asyncHandler(async (req, res) => {
    const pdfBuffer = await interviewService.generatePdf(req.params.interviewReportId);
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${req.params.interviewReportId}.pdf`
    });
    res.send(pdfBuffer);
});

const getLiveQuestionsController = asyncHandler(async (req, res) => {
    const data = await interviewService.getLiveQuestions(req.body);
    res.status(200).json(data);
});

const evaluateInterviewController = asyncHandler(async (req, res) => {
    const result = await interviewService.evaluateInterview({
        ...req.body,
        userId: req.user.id
    });
    res.status(200).json(result);
});

const getAllInterviewSessionsController = asyncHandler(async (req, res) => {
    const sessions = await interviewService.getAllSessions(req.user.id);
    res.status(200).json({
        message: "Interview sessions fetched successfully.",
        sessions
    });
});

const evaluateSingleAnswerController = asyncHandler(async (req, res) => {
    const data = await interviewService.evaluateSingleAnswer(req.body);
    res.status(200).json(data);
});

const getLiveHintController = asyncHandler(async (req, res) => {
    const data = await interviewService.getLiveHint(req.body);
    res.status(200).json(data);
});

const deleteInterviewReportController = asyncHandler(async (req, res) => {
    await interviewService.deleteReport(req.params.interviewId, req.user.id);
    res.status(200).json({ message: "Interview report deleted successfully." });
});

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    deleteInterviewReportController,
    generateResumePdfController, 
    getLiveQuestionsController, 
    evaluateInterviewController,
    evaluateSingleAnswerController,
    generateDynamicRoadmapController,
    getAllInterviewSessionsController,
    getLiveHintController
};