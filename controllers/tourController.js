const fs = require('fs');
const Tour = require('../models/tourModel');


exports.getAllTours = async (request, response) => { //v1 - should always specify the version of API
    try {
        const tours = await Tour.find() //find all documents that match a query
        //It takes 3 arguments and they are: query, query projection (which fields to include or exclude from the query), and the general query options (like limit, skip, etc).
        //may call it without any arguments and it will return all the documents in that model. 
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
