const express = require('express');
const tourController = require('../controllers/tourController');


const router = express.Router();

//router.param('id', tourController.checkID); // param middleware

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)
    
router
    .route('/') // actually, is a middleware function that only applies to a certain URL
    .get(tourController.getAllTours)
    .post(tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour)

module.exports = router