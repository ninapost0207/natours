const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A user must have a name"], 
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "A user must have an email"], 
        unique: true,
        trim: true
    },
    role: {
        type: String,
        default: "user", 
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    photo: String, 
    password: {
        type: String,
        required: [true, "A user must have a password"], 
        unique: true,
        trim: true
    }    
});
const User = mongoose.model('User', userSchema); 

module.exports = User;