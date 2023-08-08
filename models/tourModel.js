const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"], 
        unique: [true, "sorry, that name is already taken"],
        trim: true,
        maxlength: [40, "A tour must have less or equal than 40 characters"],
        minlength: [10, "A tour must have more or equal than 10 characters"],        
        validate: {
            validator: function(value) { 
                const regex = /^[a-zA-Z\s]*$/;
                return regex.test(value); 
            },
            message: "A tour must only contain alphanumeric characters"
        }
    },
    slug: String,
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
        lowercase: true,
        required: [true, "A tour must have a difficulty"],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: "Difficulty must be either: easy, medium, or difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1.0, "Rating must be above 1.0"],
        max: [5.0, "Rating must be below 5.0"]
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(value) { // Custom validator, must return a boolean expression
                return value < this.price; // will work only when creating new document, not updating!!!
            },
            message: "Discount price ({VALUE}) should be below regular price"
        }
    },  
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
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    }
}, { // first argument - schema definition, and second argument - object for the options
    toJSON: { virtuals: true }, // each time when data is output as a JSON or Object, virtuals will be a part of the output
    toObject: { virtuals: true }
});

//  VIRTUAL PROPERTIES
tourSchema.virtual('durationWeeks').get( function () { // virtual property will be created each time we get data from db. We cannot use it in a query!!!
    return this.duration / 7;
})

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
// Middleware is a function defined on the schema-level and has two arguments: the event trigger (as a string) and the callback function that is triggered for that particular event.
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

/*tourSchema.post('save', function (doc, next) { // 1st argument - document that was just saved in db
    console.log(doc); //we don't have 'this' key word
    next();
})*/

// QUERY MIDDLEWARE
// Return Mongoose Query objects.
tourSchema.pre(/^find/, function(next) { // all strings that start from 'find': find, findOne, findOneAndUpdate, etc.
    this.find({ secretTour: { $ne: true }}) // will point on the current query and not on the document
    next()
})
//tourSchema.post(/^find/, function(docs, next) - access to all documents returned from the query


// AGGREGATION MIDDLEWARE
//'this' is an Aggregate object, and 'res' is the result of the aggregation call. 'res' is always an array.
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ //adds new stage at the beginning of the array of stages in ALL aggregation pipelines
        $match: { secretTour: { $ne: true } }
    })
    next();
})


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