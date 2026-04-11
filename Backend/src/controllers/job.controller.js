const { getJobSearchQueryFromResume, fetchLiveJobs } = require("../services/job.service");
const interviewReportModel = require("../models/interviewReport.model");
const redisClient = require("../config/redis"); // 🚀 Import Redis

async function searchJobsController(req, res) {
    try {
        const { location } = req.query;

        if (!location) {
            return res.status(400).json({ message: "Location is required." });
        }

        // 1. Get user's latest resume
        const latestReport = await interviewReportModel.findOne({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("resume");

        if (!latestReport) {
            return res.status(404).json({ message: "Please generate an interview report first so we can analyze your resume." });
        }

        // 2. Generate the search query via AI
        const searchQuery = await getJobSearchQueryFromResume(latestReport.resume);

        // 3. Create a unique cache key based on the query and location
        const cacheKey = `jobs:${searchQuery.replace(/\s+/g, '_').toLowerCase()}:${location.toLowerCase()}`;

        // 4. Check Redis first!
        const cachedJobs = await redisClient.get(cacheKey);
        
        if (cachedJobs) {
            console.log("⚡ CACHE HIT: Serving jobs from Redis!");
            return res.status(200).json({
                message: "Jobs fetched successfully (cached)",
                searchQuery,
                jobs: JSON.parse(cachedJobs)
            });
        }

        console.log("🐢 CACHE MISS: Fetching fresh jobs from API...");

        // 5. Fetch fresh jobs from the external API
        const jobs = await fetchLiveJobs(searchQuery, location);

        // 6. Save to Redis for 6 hours (21600 seconds)
        // Job listings don't change every minute, 6 hours is very safe!
        await redisClient.setEx(cacheKey, 21600, JSON.stringify(jobs));

        res.status(200).json({
            message: "Jobs fetched successfully",
            searchQuery,
            jobs
        });

    } catch (error) {
        console.error("Job Search Error:", error); 
        res.status(500).json({ message: "Server error while searching jobs." });
    }
}

module.exports = { searchJobsController };