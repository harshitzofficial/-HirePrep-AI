const { createClient } = require('redis');

// In Docker, the host will simply be 'redis'. Locally, it's localhost.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ 
    url: redisUrl,
    pingInterval: 300000, // Send a PING every 5 minutes to keep the connection alive
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                // Return null to stop reconnecting after 5 attempts
                // This allows the app to proceed without Redis in local development
                return null;
            }
            return Math.min(retries * 500, 2000); // Gradual increase in wait time
        }
    }
});

redisClient.on('error', (err) => {
    // Only log critical errors to avoid spamming the logs during expected socket closures
    if (err.message !== 'Socket closed unexpectedly') {
        console.error('❌ Redis Client Error:', err.message);
    }
});

redisClient.on('reconnecting', () => console.log('🔄 Redis client is reconnecting...'));
redisClient.on('connect', () => console.log('📦 Connected to Redis successfully!'));

module.exports = redisClient;
