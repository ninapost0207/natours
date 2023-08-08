const User = require('../models/userModel');

exports.getAllUsers = async (request, response) => { 
    try {
        const users = await User.find() 
        response.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        })
    } catch (err) {
        response.status(404).json({
            status: 'fail',
            message: err
        })
    }
};
exports.getUser = async (request, response) => {
    try {
        const user = await User.findById(request.params.id)  
        response.status(200).json({
            status: 'success',
            data: { user }
        })
    } catch (err) {
        response.status(404).json({
            status: 'fail',
            message: err
        })
    }        
};
exports.createUser = async (request, response) => { 
    try {        
        const user = await User.create(request.body)
        
        response.status(201).json({ 
            status: 'success',
            data: { user }
        }) 
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }    
};

exports.updateUser = async (request, response) => { 
    try {
        const user = await User.findByIdAndUpdate(request.params.id, request.body, { 
            new: true, 
            runValidators: true 
        }) 
        
        response.status(200).json({ 
            status: 'success',
            data: { user }
        })         
    } catch (err) {
        response.status(400).json({
            status: 'fail',
            message: err
        })
    }        
};
exports.deleteUser = async (request, response) => { 
    try {
        await User.findByIdAndDelete(request.params.id) 
        
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