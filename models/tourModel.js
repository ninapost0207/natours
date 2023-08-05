const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"], // provide an error message if the required field was not set
        unique: true,
        trim: true
    },
    duration: {
        type: Number,
        required: [true, "A tour must have a duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a group size"]
    },
    difficulty: {
        type: String, 
        required: [true, "A tour must have a difficulty"]
    },
    ratingsAverage: {
        type: Number,
        default: 4.5
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price"]
    },
    priceDiscount: Number,
    summary: {
        type: String, 
        trim: true
    },
    description: {
        type: String, 
        trim: true,
        required: [true, "A tour must have a description"]
    },
    imageCover: {
        type: String, 
        required: [true, "A tour must have an image"]
    }, 
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date]
});
const Tour = mongoose.model('Tour', tourSchema); // Always use uppercase for models' names and variables


module.exports = Tour;
// Example:
/*const testTour = new Tour({
    name: "The Forest Hiker",
    rating: 4.7,
    price: 497
});
testTour.save().then(doc => {
    console.log(doc);
}).catch(err => console.log(err));*/
