const AppError = require("../utils/appError");

// Global Error Handling Middleware

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = Object.values(err.keyValue)[0];
    const message = `Duplicate field value: ${value}. Please use another value`; 
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`; 
    return new AppError(message, 400);
};
 
const handleJWTError = () => new AppError('Invalid token. Please log in again', 401);
const handleExpiredError = () => new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
    // API
    if(req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack
        })
    } 
    // Rendered webpage
    console.error("Error", err)
    return res.status(err.statusCode).render('error', {
        title: "Something went wrong",
        msg: err.message
    })

};

const sendErrorProd = (err, req, res) => {    
    // API
    if(req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to the client
        if(err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        } 
        // 1) Log error
        console.error("Error", err)
        
        // 2) Send generic message
        return res.status(500).json({
            status: "error",
            message: "Something went wrong"
        })       
    } 
    // Rendered webpage
    if(err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: "Something went wrong",
            msg: err.message
        })    
    } 
    return res.status(err.statusCode).render('error', {
        title: "Something went wrong",
        msg: "Please try again later"
    })     
};

module.exports = (err, req, res, next) => { // if pass 4 arguments in app.use, express will automatically recognise it as an Error handling middleware
    err.statusCode = err.statusCode || 500; 
    err.status = err.status || "error";

    if(process.env.NODE_ENV === "development") {
        sendErrorDev (err, req, res)
    } else if(process.env.NODE_ENV === "production") {
        // errors below will be passed in these 3 functions, that will return new Errors, which will be marked as operational(because created from AppError class) and then passed in sendErrorProd
        let error = {...err};
        error.message = err.message;
        if(err.name === "CastError")  error = handleCastErrorDB(error);        
        if(err.code === 11000) error = handleDuplicateFieldsDB(error);
        if(err.name === "ValidationError")  error = handleValidationErrorDB(error);
        if(err.name === "JsonWebTokenError")  error = handleJWTError();
        if(err.name === "TokenExpiredError")  error = handleExpiredError();

        sendErrorProd(error, req, res)
    }

}