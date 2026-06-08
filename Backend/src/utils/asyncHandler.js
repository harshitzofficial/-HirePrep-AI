/**
 * @description Wrapper to catch async errors and pass them to Express error handler
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

module.exports = asyncHandler;
