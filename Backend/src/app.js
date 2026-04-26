// server ko create karna
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors"); 

// --- RATE LIMITING IMPORTS ---
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("./config/redis"); 

// --- Import ALL Routes ---
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const jobRouter = require("./routes/job.routes");

const app = express();

// 🚀 FIXED: Prevent CORS mismatch by trimming trailing slashes from the origin URL
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

// --- Middleware --- (Security Guards and Traffic Directors)

// 1. Manual CORS handling to ensure credentials and preflight are perfect
app.use((req, res, next) => {
    // Determine if the origin is allowed (localhost:5173 or the env variable)
    const origin = req.headers.origin;
    if (origin === frontendUrl || !origin) {
        res.setHeader("Access-Control-Allow-Origin", origin || frontendUrl);
    }
    
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Cookie");
    res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");

    // Handle Preflight (OPTIONS) requests
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    
    next();
});

// 🚀 CRITICAL FOR PRODUCTION RATE LIMITING
// Tells Express to use the real user's IP, not the hosting provider's Load Balancer IP
app.set("trust proxy", 1);

app.use(express.json());  
app.use(cookieParser()); 

// --- Mount ALL Routes ---
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter); // AI strictly protected
app.use("/api/jobs", jobRouter); 

module.exports = app;

