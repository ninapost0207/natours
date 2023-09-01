const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String, 
        trim: true,
        required: [true, "Review cannot be empty."]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, "Review must belong to a tour."]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "Review must belong to a user."]
    }
}, { 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});
// Prevent duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function(next) { 
    /*this.populate({
        path: 'tour',
        select: "name"
    }).populate({
        path: 'user',
        select: "name photo"
    })*/
    this.populate({
        path: 'user',
        select: "name photo"
    })
    next()
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        }, {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating'}
            }
        }
    ]);
    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating 
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5 
        })
    }
};
reviewSchema.post('save', function () {
    // "this" points to the saved document. "current" points to the Model who created this document.
    this.constructor.calcAverageRatings(this.tour);
});
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.rev = await this.findOne() // pass the data from pre middleware to the post middleware
    next()
});
reviewSchema.post(/^findOneAnd/, async function() {
    // this.findOne() does NOT work here, as the query has already executed
    this.rev.constructor.calcAverageRatings(this.rev.tour);
});

const Review = mongoose.model('Review', reviewSchema); 

module.exports = Review;