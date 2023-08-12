module.exports = fn => { //the argument is asynchronous function
    return (req, res, next) => {
        fn(req, res, next).catch(err => next(err));
    }
}