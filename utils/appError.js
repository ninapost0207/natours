class AppError extends Error {
    constructor(message, statusCode)  {
        super(message); // whatever we pass to Error, it will be a message property. That's why we don't write "this.message = message"

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "fail" : "error";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
};
module.exports = AppError;