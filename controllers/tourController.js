const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (request, response, next) => { //creating a middleware to specify the route
    request.query.limit = '5';
    request.query.sort = '-ratingsAverage,price';
    request.query.fields = 'name,price,ratingsAverage,duration,summary';
    next();
};



exports.getAllTours = async (request, response) => { 
    try {        
        const features = new APIFeatures(Tour.find(), request.query).filter().sort().limitFields().paginate();
        const tours = await features.query;

        // SEND RESPONSE
        response.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        })
    } catch (err) {
        response.status(404).json({
            status: 'fail',
            message: err
        })
    }
};

exports.getTour = async (request, response) => {
    try {
        const tour = await Tour.findById(request.params.id) //function is used to find a single document by its _id field. 
        // Tour.findOne({ _id: request.params.id }) - the same. 
        response.status(200).json({
            status: 'success',
            data: { tour }
        })
    } catch (err) {
        response.status(404).json({
            status: 'fail',
            message: err
        })
    }        
};

exports.createTour = async (request, response) => { // URL is the same as in GET request
    try {
        //const newTour = new Tour({});
        //newTour.save()
        const newTour = await Tour.create(request.body)
        
        response.status(201).json({ //this status means 'created'
            status: 'success',
            data: {
                tour: newTour
            }
        }) 
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }    
};

exports.updateTour = async (request, response) => { 
    try {
        const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, { //PATCH method
            new: true, //returns new updated document to the client
            runValidators: true //checks the types of values
        }) 
        
        response.status(200).json({ 
            status: 'success',
            data: {
                tour
            }
        })         
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }        
};

exports.deleteTour = async (request, response) => { 
    try {
        await Tour.findByIdAndDelete(request.params.id) 
        
        response.status(204).json({ 
            status: 'success',
            data: null
        })         
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }    
};

//The aggregation framework gives the flexibility to filter and transform documents in more complex ways than a query
// aggregation pipeline (MingoDB feature) is like a regular query, we can manipulate data in different steps (stages)
exports.getTourStats = async (req, res) => {
    try {
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
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }   
};

exports.getMonthlyPlan = async (req, res) => {
    try {
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
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }  
}