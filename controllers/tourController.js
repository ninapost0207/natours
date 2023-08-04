const fs = require('fs');

const toursData = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)) // __dirname is the folder where the current script is located

exports.checkID = (req, res, next, val) => {         
    if (Number(req.params.id) >= toursData.length) {
        return res.status(404).json({
            status: "fail",
            message: "Invalid ID"
        })
    };    
    next();
};

exports.getAllTours = (request, response) => { //v1 - should always specify the version of API
    response.status(200).json({
        status: 'success',
        results: toursData.length,
        requestedAt: request.requestTime, // just check the work of middleware
        data: {
            tours: toursData
        }
    })
};

exports.getTour = (request, response) => {
    const tour = toursData.find(el => el.id === Number(request.params.id))     
    response.status(200).json({
        status: 'success',
        data: { tour }
    })
};

exports.createTour = (request, response) => { // URL is the same as in GET request
    const newId = toursData[toursData.length - 1].id + 1;
    const newTour = Object.assign({id: newId}, request.body) // allows us to create new object by merging two existing objects together
    
    toursData.push(newTour);
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(toursData), err => {
        response.status(201).json({ //this status means 'created'
            status: 'success',
            data: {
                tour: newTour
            }
        }) 
    })    
};

exports.updateTour = (request, response) => { 
    const tour = toursData.find(el => el.id === Number(request.params.id))
    const newTour = Object.assign(tour, request.body)
    
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(toursData), err => {
        response.status(200).json({ 
            status: 'success',
            data: {
                tour: newTour
            }
        }) 
    })
};

exports.deleteTour = (request, response) => { 
    const index = toursData.findIndex(el => el.id === Number(request.params.id))    
    toursData.splice(index, 1);    
    
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(toursData), err => {
        response.status(204).json({ // means "no content"
            status: 'success',
            data: null
        }) 
    })
};
