const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

class AuthService {
    async register({ username, email, password }) {
        if (password.length < 8) {
            const err = new Error("Password must be at least 8 characters.");
            err.statusCode = 400;
            throw err;
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (isUserAlreadyExists) {
            const err = new Error("User already exists");
            err.statusCode = 400;
            throw err;
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash
        });

        const token = this.generateToken(user);
        return { user, token };
    }

    async login({ email, password }) {
        const user = await userModel.findOne({ email });
        if (!user) {
            const err = new Error("Invalid email or password");
            err.statusCode = 400;
            throw err;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const err = new Error("Invalid email or password");
            err.statusCode = 400;
            throw err;
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    async logout(token) {
        if (!token) return;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded && decoded.exp) {
                const currentTime = Math.floor(Date.now() / 1000);
                const timeLeft = decoded.exp - currentTime;

                if (timeLeft > 0) {
                    await redisClient.setEx(`blacklist:${token}`, timeLeft, "true");
                }
            }
        } catch (error) {
            console.error("Redis Logout Error:", error);
            // Ignore token verification errors during logout (e.g., token already expired)
        }
    }

    async getMe(userId) {
        const user = await userModel.findById(userId);
        if (!user) {
            const err = new Error("User account not found.");
            err.statusCode = 404;
            throw err;
        }
        return user;
    }

    generateToken(user) {
        return jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
    }
}

module.exports = new AuthService();
