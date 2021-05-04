const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        return User.create({
            email: email,
            password: hashedPassword,
            name: name
        });
    })
    .then(user => {
        res.status(201).json({
            message: 'User created!',
            userId: user.id
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({where: {email: email}})
    .then(user => {
        if(!user){
            const error = new Error('User with this email does not exists');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;  
        return bcrypt.compare(password, user.password);
    })
    .then(isValidPassword => {
        if(!isValidPassword) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }
        
        //generating jwt token
        const token = jwt.sign(
            {
            email: loadedUser.email,
            userId: loadedUser.id,
            }, 
            'supersecretsecret', 
            {expiresIn: '1h'}
        );

        res.status(200).json({
            token: token,
            userId: loadedUser.id
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.getUserStatus = (req, res, next) => {
    User.findByPk(req.userId)
    .then(user => {
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            status: user.status
        });

    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.updateUserStatus = (req, res, next) => {

    const updatedStatus = req.body.status;

    User.findByPk(req.userId)
    .then(user => {
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        user.status = updatedStatus;
        return user.save();
    })
    .then(result => {
        res.status(200).json({
            message: 'User status updated',
            status: result.status
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};