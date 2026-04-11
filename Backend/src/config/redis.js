const { createClient } = require('redis');

// In Docker, the host will simply be 'redis'. Locally, it's localhost.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ 
    url: redisUrl,
    pingInterval: 300000, // Send a PING every 5 minutes to keep the connection alive
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('🚨 Redis max retries reached. Stopping reconnection.');
                return new Error('Redis max retries reached');
            }
            return Math.min(retries * 100, 3000); // Wait between retries
        }
    }
});

redisClient.on('error', (err) => {
    // Only log critical errors to avoid spamming the logs during expected socket closures
    if (err.message !== 'Socket closed unexpectedly') {
        console.error('❌ Redis Client Error:', err);
    }
});

redisClient.on('reconnecting', () => console.log('🔄 Redis client is reconnecting...'));
redisClient.on('connect', () => console.log('📦 Connected to Redis successfully!'));

module.exports = redisClient;
