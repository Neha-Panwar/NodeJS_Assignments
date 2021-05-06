const express = require('express');
const {check, body} = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router(); 

router.get('/login', authController.getLogin);

router.post('/login', 
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .normalizeEmail(),
        
        body('password', 'Please enter a valid password')
            .isLength({min: 5})
            .isAlphanumeric()
            .trim()
    ],

    authController.postLogin
);

router.get('/signup', authController.getSignup);

router.post('/signup', 
    [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value,{req}) => {
            return User.findOne({where : {email: value}})
            .then(userDoc => {
                if(userDoc){
                    return Promise.reject('Email already exists! Please select different email');
                }
            });
        })
        .normalizeEmail(),

    body('password', 'Please enter a password with only numbers and text and atleast 5 characters')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    
    body('confirmPassword')
        .custom((value, {req}) => {
            if(value !== req.body.password) {
                throw new Error('Passwords must match');
            }
            return true;
        })
        .trim()
    ],

    authController.postSignup
);

router.post('/logout', authController.postLogout);

module.exports = router;