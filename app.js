const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');

const app = express();

// GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if(process.env.NODE_ENV === 'development') { // logging only for development
    app.use(morgan('dev')); // logs the main information about each request (method, url, status, etc) # GET /api/v1/tours 200 2.740 ms - 7423
}

// Limit requests from same API
const limiter = rateLimit({ // Limits 100 requests from the same IP in 1 hour
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in 1 hour."
});
app.use('/api', limiter); // apply limiter only to routes starting with this url. In headers will see X-RateLimit-Remaining

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb'})); 

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // filters out all $ and dots from request.params

// Data sanitization against XSS - cross-site scripting attacks
app.use(xss()); // protect from malicious HTML code, converts it into HTML entity "<" => "&lt;" 

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', "ratingsAverage", "ratingsQuantity", "maxGroupSize", "difficulty", "price"]
}));

// Test middleware
app.use((req, res, next) => { //Next - name of 3rd argument according to Convention. Applies to each request
    req.requestTime = new Date().toISOString(); //aplies to every request, set time of the request
    next(); 
});

// Serving static files (html, css...) from the folder and not from a route
app.use(express.static(`${__dirname}/public`))  


// mounting the new routers on the routes
app.use('/api/v1/tours', tourRouter); // After this, in tourRouter.route we change ('/api/v1/tours') to ('/'), and ('/api/v1/tours:id') to ('/:id')
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling unhandled routes - should run after all route handlers
app.all('*', (req, res, next) => { // "all" - will work for all http methods. "*" - stands for everything, for all urls that were not handled before. 
    next(new AppError(`Can't fing ${req.originalUrl} on this server`, 404)) // if next has argument, Express will automatically know that there is an error, skips all middlewares in stack and handles the error
}) 


app.use(globalErrorHandler) 

module.exports = app;