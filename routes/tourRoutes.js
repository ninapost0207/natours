const express = require('express');
const tourController = require('./../controllers/tourController');


const router = express.Router();

router.param('id', tourController.checkID); // param middleware


router
    .route('/') // actually, is a middleware function that only applies to a certain URL
    .get(tourController.getAllTours)
    .post(tourController.checkBody, tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour)

module.exports = router