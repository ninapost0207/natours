const util = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // convert 90 days to milliseconds
        httpOnly: true // browser will receive, store and send cookie with every request
    };
    if (process.eventNames.NODE_ENV === "production") cookieOptions.secure = true

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined; // remove password from output when a user signs up

    res.status(statusCode).json({ 
        status: 'success',
        token,
        data: { 
            user
        }
    })  
}

exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create(req.body);
    createSendToken(newUser, 201, res)
});

exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next( new AppError('Please provide email and password', 400));
    };

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');     

    if (!user || !await user.correctPassword(password, user.password)) {
        return next( new AppError('Incorrect email or password', 401));
    };

    // 3) If everything is ok, send token to the client
    createSendToken(user, 200, res)
});

  
exports.logout = (req, res) => {
    /*res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10000),
        httpOnly: true
    })*/
    res.clearCookie('jwt')
    res.status(200).json({ status: 'success'})
};

exports.protect = catchAsync(async(req, res, next) => {
    let token;
    // 1) Getting token and check if it is there
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if(req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if(!token) {
        return next( new AppError('You are not logged in. Please log in to get access', 401));
    }

    // 2) Verification of token
    // in promisify we pass a function that we need to call and that will return a promise, then we call this function with arguments
    // Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid
    const decodedPayload = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET) //pass payload and the secret to create a test signature
    
    // 3) Check if user still exists
    const currentUser = await User.findById(decodedPayload.id)
    if(!currentUser) {
        return next( new AppError('User belonging to this token does no longer exist', 401));
    }
    
    // 4) Check if user changed password after JWT was issued
    if(await currentUser.changedPasswordAfter(decodedPayload.iat)) {
       return next( new AppError('User has recently changed password. Please log in again', 401));
    };

    // Grant access to protected route
    res.locals.user = currentUser; 
    req.user = currentUser; // pass data to the next middleware
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next( new AppError('You do not have permission to perform this action', 403));
        }

        next();
    }
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email})
    if(!user) {
        return next( new AppError('There is no user with this email', 404));
    }
    // 2) Generate the random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateModifiedOnly: true }); //Mongoose will only validate modified paths

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `Forgot your password? Create new: ${resetURL}.\n If you didn't forget your password, please ignore this email.`;
    
    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 minutes).",
            message
        });

        res.status(200).json({
            status: "success",
            message: "Token send to email."
        })
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateModifiedOnly: true });
        return next( new AppError('There was an error sending email. Please, try again later.', 500));
    }
});

exports.resetPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on the token
    const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashToken, passwordResetExpires: { $gt: Date.now() } });
    
    // 2) If token is not expired and the user exists, set new password
    if (!user ) {
        return next( new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update passwordChangedAt for user


    // 4) Log user in, send token
    createSendToken(user, 200, res)    
});

exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1) Get user from the collection
    const user = await User.findById( req.user.id ).select('+password'); 
    
    // 2) Check if the current password is correct
    if (!user || !await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next( new AppError('Incorrect password', 401));
    };

    // 3) If so, update the password
    user.password = req.body.password;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res)
});

// Only for rendered pages, not errors!
exports.isLoggedIn = async(req, res, next) => {
    if(req.cookies.jwt) {
        try {
            // 1) verify token
            const decodedPayload = await util.promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET) //pass payload and the secret to create a test signature
            
            // 2) Check if user still exists
            const currentUser = await User.findById(decodedPayload.id)
            if(!currentUser) {
                return next();
            }
            
            // 3) Check if user changed password after JWT was issued
            if(await currentUser.changedPasswordAfter(decodedPayload.iat)) {
               return next();
            };
            // There is a logged in user
            res.locals.user = currentUser; 
            return next();        
        } catch(err) {
            return next();
        }
    }
    next();
};
