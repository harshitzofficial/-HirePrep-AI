const jwt = require("jsonwebtoken");
// REDIS CLIENT FOR BLACKLISTING TOKENS -----BOOM-----
const redisClient = require("../config/redis"); 

async function authUser(req, res, next) {
    // 1. Intelligently check both Cookies and Bearer Headers
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        });
    }

    try {
        // 2. CHECK REDIS BLACKLIST
        // Note: The key format must match EXACTLY what you used in logoutUserController
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Session expired. Please log in again." // Better UX message
            });
        }

        // 3. Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach user payload to request
        req.user = decoded;

        next();

    } catch (err) {
        // This catches both JWT verification errors (expired/tampered tokens)
        // and potential Redis connection errors.
        console.error("Auth Middleware Error:", err.message);
        
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

module.exports = { authUser };