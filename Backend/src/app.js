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

// 🚀 CRITICAL FOR PRODUCTION RATE LIMITING
// Tells Express to use the real user's IP, not the hosting provider's Load Balancer IP
app.set("trust proxy", 1);

// --- Middleware --- (Security Guards and Traffic Directors)
app.use(express.json());  
app.use(cookieParser()); 

// 🚀 FIXED: Prevent CORS mismatch by trimming trailing slashes from the origin URL
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

app.use(cors({
    origin: frontendUrl, 
    credentials: true 
}));

// --- Mount ALL Routes ---
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter); // AI strictly protected
app.use("/api/jobs", jobRouter); 

module.exports = app;

