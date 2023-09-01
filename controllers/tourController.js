const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');


exports.aliasTopTours = (request, response, next) => {     
    request.query.limit = '5';
    request.query.sort = '-ratingsAverage,price';
    request.query.fields = 'name,price,ratingsAverage,duration,summary';
    next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Aggregation operations allow to group, sort, perform calculations, analyze data, and much more.
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
// Geospatial query
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, unit, latlng } = req.params;
    const [lat, lng] = latlng.split(',');
    if(!lat || !lng) {
        next(new AppError('Plese provide latitude and longitude in the format lat,lng.', 400))
    }
    // To get the radians, we need to divide distance to Earth radius, whether it is in miles or kilometers
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; 
    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });
    res.status(200).json({ 
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
});
exports.getDistances = catchAsync(async (req, res, next) => {
    const { unit, latlng } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if(!lat || !lng) {
        next(new AppError('Plese provide latitude and longitude in the format lat,lng.', 400))
    }
    
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [Number(lng), Number(lat)]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        }, {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])
    res.status(200).json({ 
        status: 'success',
        data: {
            data: distances
        }
    })
});