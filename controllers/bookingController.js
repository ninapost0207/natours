const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');


exports.getCheckoutSession = catchAsync(async(req, res, next) => {
    // 1) Get currently booked tour
    const tour = await Tour.findById(req.params.tourId)
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // 2) Create checkout session
    const product = await stripe.products.create({
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    });
     
    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tour.price * 100,
        currency: 'usd',
    });
     
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        mode: 'payment',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
    });

    // 3) Create session as response and send it to client
    res.status(200).json({
        status: 'success',
        session
    })    
  });

  exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    // This is TEMPORARY, because unsecure, everyone can make bookings without payment
    const { tour, user, price } = req.query;
    if (!tour || !user || !price) return next(); 
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
  })
  exports.getAllBookings = factory.getAll(Booking);
  exports.getBooking = factory.getOne(Booking);
  exports.createBooking = factory.createOne(Booking);
  exports.updateBooking = factory.updateOne(Booking);
  exports.deleteBooking = factory.deleteOne(Booking);