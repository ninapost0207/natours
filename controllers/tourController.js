const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


exports.aliasTopTours = (request, response, next) => { //creating a middleware to specify the route    
    request.query.limit = '5';
    request.query.sort = '-ratingsAverage,price';
    request.query.fields = 'name,price,ratingsAverage,duration,summary';
    next();
};



exports.getAllTours = catchAsync(async (request, response, next) => { 
    // Tour.find() will return a query object, so we can chain it with other functions. That is why we don't await the result of find()
    const features = new APIFeatures(Tour.find(), request.query).filter().sort().limitFields().paginate();
    //only after all chaining methods we await for the result of all these queries. We cannot write const "tours = await new APIFeatures..."
    const tours = await features.query; // execute query

    response.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    })    
});

exports.getTour = catchAsync(async (request, response, next) => {
    const tour = await Tour.findById(request.params.id) 
    // Tour.findOne({ _id: request.params.id }) - the same. 

    if(!tour) {
        return next(new AppError("No tour found with this ID", 404))
    }
    response.status(200).json({
        status: 'success',
        data: { tour }
    }) 
});

exports.createTour = catchAsync(async (request, response, next) => { 
    //const newTour = new Tour({request.body});
    //newTour.save()
    const newTour = await Tour.create(request.body)
    
    response.status(201).json({ 
        status: 'success',
        data: {
            tour: newTour
        }
    })  
});

exports.updateTour = catchAsync(async (request, response, next) => { 
    const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, { //PATCH method
        new: true, //returns new updated document to the client
        runValidators: true 
    }) 
    if(!tour) {
        return next(new AppError("No tour found with this ID", 404))
    }
    response.status(200).json({ 
        status: 'success',
        data: {
            tour
        }
    })             
});

exports.deleteTour = catchAsync(async (request, response, next) => { 
    const tour = await Tour.findByIdAndDelete(request.params.id) 
    if(!tour) {
        return next(new AppError("No tour found with this ID", 404))
    }
    response.status(204).json({ 
        status: 'success',
        data: null
    })          
});

// Aggregation operations allow you to group, sort, perform calculations, analyze data, and much more.
// Can have one or more "stages". The order of these stages are important. Each stage acts upon the results of the previous stage.

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([ // Mongoose returns an Aggregate object, not a promise
        {
            $match: {
                ratingsAverage: { $gte: 4.5 }
            }
        }, {
            $group: { //Groups input documents using an accumulator 
                //_id: null, // create groups from all the tours together without specification
                _id: { $toUpper: '$difficulty' }, //group results by difficulty
                numTours: { $sum: 1 }, //adds 1 to each document
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' }, // count the average number of the field 
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }, {
            $sort: { //specify which field we want to sort this by
                avgPrice: 1
            }
        }, //{ $match: { _id: { $ne: 'EASY' }} //_id is difficulty now }
    ]);
    res.status(200).json({ 
        status: 'success',
        data: {
            stats
        }
    })  
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = Number(req.params.year);
    const plan = await Tour.aggregate([
        { //Deconstructs an array field from the input documents to output a document for each element. Each output document replaces the array with an element value. 
            $unwind: '$startDates'
        }, {
            $match: {
                startDates: {
                    $gte: new Date(`${ year }-01-01`),
                    $lte: new Date(`${ year }-12-31`)
                }
            }
        }, {
            $group: {
                _id: { $month: '$startDates' }, //Returns the month for a date as a number between 1 (January) and 12 (December).
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' } 
            }
        }, {
            $addFields: { month: '$_id' }
        }, {
            $project: { _id: 0 } // _id won't be shown                
        }, {
            $sort: { numTourStarts: -1} // descending order; 1 is for ascending order
        }, { $limit: 12 } // how many results to show
    ])
    res.status(200).json({ 
        status: 'success',
        data: {
            plan
        }
    })  
});