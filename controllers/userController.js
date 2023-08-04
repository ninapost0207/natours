const fs = require('fs');

const usersData = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/users.json`));


exports.checkID = (req, res, next, val) => {         
    const user = usersData.find(el => el._id === req.params.id)
    if (!user) {
        return res.status(404).json({
            status: "fail",
            message: "Invalid ID"
        })
    } 
    next();
};

exports.getAllUsers = (request, response) => { 
    response.status(200).json({
        status: 'success',
        results: usersData.length,         
        data: {
            users: usersData
        }
    })
};
exports.getUser = (request, response) => { 
    const user = usersData.find(el => el._id === request.params.id)
    
    response.status(200).json({
        status: 'success',
        data: { user }
    })
};
exports.createUser = (request, response) => { 
    const newId = usersData[usersData.length - 1]._id + '1';
    const newUser = Object.assign({_id: newId}, request.body) // allows us to create new object by merging two existing objects together
    
    usersData.push(newUser);
    fs.writeFile(`${__dirname}/dev-data/data/users.json`, JSON.stringify(usersData), err => {
        response.status(201).json({ //this status means 'created'
            status: 'success',
            data: {
                user: newUser
            }
        }) 
    })    
};

exports.updateUser = (request, response) => { 
    const user = usersData.find(el => el._id === request.params.id)
        
    const newUser = Object.assign(user, request.body)
    
    fs.writeFile(`${__dirname}/dev-data/data/users.json`, JSON.stringify(usersData), err => {
        response.status(200).json({ 
            status: 'success',
            data: {
                user: newUser
            }
        }) 
    })
};
exports.deleteUser = (request, response) => { 
    const index = usersData.findIndex(el => el._id === request.params.id)
        
    usersData.splice(index, 1);    
    
    fs.writeFile(`${__dirname}/dev-data/data/users.json`, JSON.stringify(usersData), err => {
        response.status(204).json({ 
            status: 'success',
            data: null
        }) 
    })
};