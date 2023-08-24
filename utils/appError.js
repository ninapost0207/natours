class AppError extends Error {
    constructor(message, statusCode)  {
        super(message); // whatever we pass to Error, it will be a message property. That's why we don't write "this.message = message"

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "fail" : "error";
        this.isOperational = true;

        // used when constructing Error object without extending the Error class. When extending the Error class, capturing the stack trace is already done by the Error constructor
        Error.captureStackTrace(this, this.constructor)
    }
};
module.exports = AppError;