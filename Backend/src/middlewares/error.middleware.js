/**
 * @description Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error("🔥 Global Error Caught:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // In production, we don't leak stack traces
    const response = {
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    };

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
