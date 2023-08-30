const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

//router.param('id', tourController.checkID); // param middleware

router
    .use('/:tourId/reviews', reviewRouter) // Nested routes

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)
    
router
    .route('/') // actually, is a middleware function that only applies to a certain URL
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)





module.exports = router