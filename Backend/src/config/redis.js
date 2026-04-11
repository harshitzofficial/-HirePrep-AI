const { createClient } = require('redis');

// In Docker, the host will simply be 'redis'. Locally, it's localhost.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('📦 Connected to Redis successfully!'));


module.exports = redisClient;