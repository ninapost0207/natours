const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (request, response, next) => { 
    const doc = await Model.findByIdAndDelete(request.params.id) 
    if(!doc) {
        return next(new AppError('No document found with this ID', 404))
    }
    response.status(204).json({ 
        status: 'success',
        data: null
    })          
});

exports.updateOne = Model => catchAsync(async (request, response, next) => { 
    const doc = await Model.findByIdAndUpdate(request.params.id, request.body, { //PATCH method
        new: true, //returns new updated document to the client
        runValidators: true 
    }) 
    if(!doc) {
        return next(new AppError("No document found with this ID", 404))
    }
    response.status(200).json({ 
        status: 'success',
        data: {
            data: doc
        }
    })             
});

exports.createOne = Model => catchAsync(async (request, response, next) => { 
    //const newTour = new Tour({request.body});
    //newTour.save()
    const doc = await Model.create(request.body)
    
    response.status(201).json({ 
        status: 'success',
        data: {
            data: doc
        }
    })  
});

exports.getOne = (Model, popOptions) => catchAsync(async (request, response, next) => {
    let query = Model.findById(request.params.id);
    if (popOptions) query = query.populate(popOptions)
    const doc = await query

    if(!doc) {
        return next(new AppError("No document found with this ID", 404))
    }
    response.status(200).json({
        status: 'success',
        data: { data: doc }
    }) 
});

exports.getAll = Model => catchAsync(async (request, response, next) => { 
    // To allow for nested get reviews on tour
    let filter = {};
    if (request.params.tourId) filter = { tour: request.params.tourId }

    // Model.find() will return a query object, so we can chain it with other functions. That is why we don't await the result of find()
    const features = new APIFeatures(Model.find(filter), request.query).filter().sort().limitFields().paginate();
    //only after all chaining methods we await for the result of all these queries. We cannot write const "docs = await new APIFeatures..."
    const docs = await features.query//.explain(); 

    response.status(200).json({
        status: 'success',
        results: docs.length,
        data: {
            data: docs
        }
    })    
});