const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
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

    try{
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
                        email: email,
                        password: hashedPassword,
                        name: name
                    });
        
        res.status(201).json({
            message: 'User created!',
            userId: user.id
        });
    }
    catch(err){
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
};

exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try{
        const user = await User.findOne({where: {email: email}});
    
        if(!user){
            const error = new Error('User with this email does not exists');
            error.statusCode = 401;
            throw error;
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if(!isValidPassword) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }
        
        //generating jwt token
        const token = jwt.sign(
            {
            email: user.email,
            userId: user.id,
            }, 
            'supersecretsecret', 
            {expiresIn: '1h'}
        );
    
        res.status(200).json({
            token: token,
            userId: user.id
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
};

exports.getUserStatus = async (req, res, next) => {

    try{
        const user = await User.findByPk(req.userId);
    
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
    
        res.status(200).json({
            status: user.status
        });
    }
    catch(err){
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
};

exports.updateUserStatus = async (req, res, next) => {

    const updatedStatus = req.body.status;

    try{
        const user = await User.findByPk(req.userId);
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
    
        user.status = updatedStatus;
        const result = await user.save();
    
        res.status(200).json({
            message: 'User status updated',
            status: result.status
        });
    }
    catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
};