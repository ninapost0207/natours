const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');

const app = express();

// MIDDLEWARES
if(process.env.NODE_ENV === 'development') { // logging only for development
    app.use(morgan('dev')); // logs the main information about each request (method, url, status, etc) # GET /api/v1/tours 200 2.740 ms - 7423
}
app.use(express.json()); // use Middleware - the function that can modify the incoming request data. Is stands between request and response
app.use((req, res, next) => { //define a Middleware function with 3 arguments. Next - name of 3rd argument according to Convention. Applies to each request
    req.requestTime = new Date().toISOString(); //aplies to every request, set time of the request
    next(); // never forget to use next in all middleware, otherwise request and response cycle will stuck and we would never send back a response
})
app.use(express.static(`${__dirname}/public`)) //serves static files (html, css...) from the folder and not from a route 


// mounting the new routers on the routes
app.use('/api/v1/tours', tourRouter); // After this, in tourRouter.route we change ('/api/v1/tours') to ('/'), and ('/api/v1/tours:id') to ('/:id')
app.use('/api/v1/users', userRouter);

// Handling unhandled routes - should run after all route handlers
app.all('*', (req, res, next) => { // "all" - will work for all http methods. "*" - stands for everything, for all urls that were not handled before. 
    next(new AppError(`Can't fing ${req.originalUrl} on this server`, 404)) // if next has argument, Express will automatically know that there is an error, skips all middlewares in stack and handles the error
}) 


app.use(globalErrorHandler) 

module.exports = app;