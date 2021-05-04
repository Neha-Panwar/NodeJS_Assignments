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
            .withMessage('Please enter a valid email.'),
        
        body('password', 'Please enter a valid password')
            .isLength({min: 5})
            .isAlphanumeric()
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
            // //dummy validation
            // if(value === 'test@test.com'){
            //     throw new Error('This email address is forbidden');
            // }
            // return true;

            return User.findOne({where : {email: value}})
            .then(userDoc => {
                if(userDoc){
                    return Promise.reject('Email already exists! Please select different email');
                }
            });
        }),

    body(
        'password', 
        'Please enter a password with only numbers and text and atleast 5 characters'
    )
        .isLength({min: 5})
        .isAlphanumeric(),
    
    body('confirmPassword')
        .custom((value, {req}) => {
            if(value !== req.body.password) {
                throw new Error('Passwords must match');
            }
            return true;
        })
    ],

    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);



module.exports = router;