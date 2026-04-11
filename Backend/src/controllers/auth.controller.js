const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REDIS CLIENT FOR BLACKLISTING TOKENS -----BOOM-----
const redisClient = require("../config/redis");

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please provide all fields" });
        }
        // Time complexity for findOne is O(log n) on indexed fields, which is efficient for our use case. We are checking both username and email to ensure uniqueness.
        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (isUserAlreadyExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hash = await bcrypt.hash(password, 10); // 10 is the salt rounds, you can adjust it based on your security needs and performance considerations

        const user = await userModel.create({
            username,
            email,
            password: hash
        });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // Required for SameSite=None
            sameSite: "None", // Required for cross-domain cookies (Vercel -> Render)
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
            

        res.status(201).json({
            message: "User registered successfully",
            user: { id: user._id, username: user.username, email: user.email }
        });
    } 
    catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    //"I wrapped controllers in try-catch to prevent server crashes and ensure proper error handling."
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }
        //no decryption only comparison
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "User loggedIn successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } 
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }

}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in Redis blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    // 1. Get token from cookies OR headers (Matches our new middleware logic)
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            // 2. Decode the token to find its expiration time
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded && decoded.exp) {
                // 3. Calculate how many seconds until it naturally expires
                const currentTime = Math.floor(Date.now() / 1000);
                const timeLeft = decoded.exp - currentTime;

                // 4. Save to Redis with a self-destruct timer (TTL)
                if (timeLeft > 0) {
                    await redisClient.setEx(`blacklist:${token}`, timeLeft, "true");
                }
            }
        } catch (error) {
            console.error("Redis Logout Error:", error);
            // We log the error but continue, so the user's cookie still gets cleared
        }
    }

    // 5. Clear the cookie from the browser
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    });

    res.status(200).json({
        message: "User logged out successfully"
    });
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    try{
        const user = await userModel.findById(req.user.id);

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
   }
   catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};