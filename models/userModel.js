const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name"],         
        trim: true,
        validate: {
            validator: function(value) { 
                const regex = /^[a-zA-Z\s]*$/;
                return regex.test(value); 
            },
            message: "A user name must only contain alphanumeric characters"
        },
        unique: false
    },
    email: {
        type: String,
        required: [true, "Please provide your email"], 
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide valid email"]
    },
    role: {
        type: String,
        trim: true,
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin'],
            message: "Role must be either: user, quide, lead-guide, admin"
        },
        default: "user"
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    photo: String, 
    password: {
        type: String,
        required: [true, "Please provide a password"], 
        trim: true,
        select: false,
        minlength: 8
    },
    passwordChangedAt: {
        type: Date,
        default: Date.now()
    },
    pesswordResetToken: String,
    passwordResetExpires: Date  
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next(); //  only runs this function if password was actually modified
    this.password = await bcrypt.hash(this.password, 12); // returns promise

    next();
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password') || this.isNew ) return next(); 
    this.passwordChangedAt = Date.now() - 1000;
    next();
});
userSchema.pre(/^find/, async function(next) {
    //this points to the current query
    this.find({ active: {$ne: false} });
    next();
})


// Instance method available in all user documents
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword) // userPassword is hashed, candidatePassword is not. We cannot compare them manually, because in the userModes password.select = false
};

userSchema.methods.changedPasswordAfter = async function(JWTTimestamp) { 
    if(this.passwordChangedAt) {        
        const changedJWTStamp = new Date(JWTTimestamp * 1000);        
        return changedJWTStamp < this.passwordChangedAt
    }    
    return false; // not changed
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex') // 32 - number of characters
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() * 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model('User', userSchema); 

module.exports = User;