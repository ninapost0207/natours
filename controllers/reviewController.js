const Review = require('../models/reviewModel');
//const APIFeatures = require('../utils/apiFeatures');
//const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (request, response, next) => { 
    let filter = {};
    if (request.params.tourId) filter = { tour: request.params.tourId }
    const reviews = await Review.find(filter);    

    response.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    })    
});

exports.createReview = catchAsync(async (request, response, next) => {
    // Allow nested routes
    if(!request.body.tour) request.body.tour = request.params.tourId;
    if(!request.body.user) request.body.user = request.user.id;

    const review = await Review.create(request.body)
    
    response.status(201).json({
        status: 'success',
        data: { review }
    }) 
});
