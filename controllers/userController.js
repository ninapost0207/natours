const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');


const filterObj = (obj, ...allowedFields) => { //create an array of arguments
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el]
    });
    return newObj;
};

exports.getMe = (request, response, next) => {
    request.params.id = request.user.id;
    next()
}

exports.updateMe = catchAsync(async (request, response, next) => { 
    // 1) Create error if user POSTs password data
    if(request.body.password) {
        return next(new AppError("This route is not for password updates. please use /updateMyPassword.", 400))
    }
    
    // 2) Filter out unwanted field names that are not allowed to be updated by the user
    const filteredBody = filterObj(request.body, "name", "email");
    
    // 3) Update user document
    const user = await User.findByIdAndUpdate(request.user.id, filteredBody, { 
        new: true, 
        runValidators: true 
    }) 
    response.status(200).json({
        status: 'success',
        data: {
            user
        }
    })    
});


exports.deleteMe = catchAsync(async (request, response, next) => {     
    const user = await User.findByIdAndUpdate(request.user.id, { active: false }) 
    response.status(204).json({
        status: 'success',
        data: null
    })    
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); // Do not update password with this
exports.deleteUser = factory.deleteOne(User);