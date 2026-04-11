// starting server 
require("dotenv").config();
const connectToDB = require("./src/config/database"); 
const redisClient = require("./src/config/redis"); 

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // 1. Connect to MongoDB and wait for it
        await connectToDB();
        console.log("🗄️ Connected to MongoDB successfully!");

        // 2. Connect to Redis and wait for it
        await redisClient.connect();
        // Redis is now fully awake and ready to accept commands!

        // 🚀 3. THE FIX: Require the Express app AFTER databases are connected.
        // Now when the routes initialize the rate limiters, Redis is already connected!
        const app = require("./src/app");

        // 4. Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("🚨 Failed to start server due to database error:", error);
        process.exit(1); 
    }
}

// Fire it up!
startServer();