const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if(process.env.NODE_ENV === 'development') { // logging only for development
    app.use(morgan('dev')); // logs the main information about each request (method, url, status, etc) # GET /api/v1/tours 200 2.740 ms - 7423
}
app.use(express.json()); // use Middleware - the function that can modify the incoming request data. Is called middleware, because stands between request and response
app.use((req, res, next) => { //define a Middleware function with 3 arguments. Next - name of 3rd argument according to Convention. Applies to each request
    req.requestTime = new Date().toISOString(); //aplies to every request, set time of the request
    next(); // never forget to use next in all middleware, otherwise request and response cycle will stuck and we would never send back a response
})
app.use(express.static(`${__dirname}/public`)) //serves static files (html, css...) from the folder and not from a route 

// 2) ROUTE HANDLERS - we put them in separate folders (routes)
// GET method route
/*app.get('/', (request, response) => { // in order to specify this url, we add the second argument - callback function and specify the path there
    //response.status(200).send('From the server side')// will show the response from server
    response.status(200).json({message: 'From the server side', app: 'Natours'}) // Express automatically set the Content-type to application/json
});
// POST method route
app.post('/', (req, res) => {
    res.send('You can post to this URL')
});*/

// 3) ROUTES
/*app.get('/api/v1/tours', getAllTours);
app.get('/api/v1/tours/:id', getTour);
app.post('/api/v1/tours', createTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);*/


// mounting the new routers on the routes
app.use('/api/v1/tours', tourRouter); // After this, in tourRouter.route we change ('/api/v1/tours') to ('/'), and ('/api/v1/tours:id') to ('/:id')
app.use('/api/v1/users', userRouter);


module.exports = app;