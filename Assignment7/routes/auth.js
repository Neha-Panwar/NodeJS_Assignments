const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');


const router = express.Router();

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, {req}) => {
            return User.findOne({where: {email: value}})
                .then(user => {
                    if(user){
                        return Promise.reject('Email address already exists!');
                    }
                });
        })
        .notEmpty()
        .normalizeEmail(),
    body('password', 'Please enter a valid password.')
        .trim()
        .matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{5,}$/)
        .notEmpty(),
    body('name')
        .trim()
        .notEmpty()

], authController.signup);

router.post('/login', authController.postLogin);

router.get('/status', isAuth, authController.getUserStatus);

router.put('/status', isAuth, [
    body('status')
        .trim()
        .notEmpty()
], authController.updateUserStatus);

module.exports = router;