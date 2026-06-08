const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");

const cookieOptions = {
    httpOnly: true,
    secure: true, // Required for SameSite=None
    sameSite: "None", // Required for cross-domain cookies (Vercel -> Render)
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

/**
 * @name registerUserController
 * @description register a new user
 */
const registerUserController = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide all fields" });
    }

    const { user, token } = await authService.register({ username, email, password });

    res.cookie("token", token, cookieOptions);
    res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, username: user.username, email: user.email }
    });
});

/**
 * @name loginUserController
 * @description login a user
 */
const loginUserController = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, token } = await authService.login({ email, password });

    res.cookie("token", token, cookieOptions);
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: { id: user._id, username: user.username, email: user.email }
    });
});

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in Redis blacklist
 */
const logoutUserController = asyncHandler(async (req, res) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    await authService.logout(token);

    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    res.status(200).json({ message: "User logged out successfully" });
});

/**
 * @name getMeController
 * @description get the current logged in user details.
 */
const getMeController = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);

    res.status(200).json({
        message: "User details fetched successfully",
        user: { id: user._id, username: user.username, email: user.email }
    });
});

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
};