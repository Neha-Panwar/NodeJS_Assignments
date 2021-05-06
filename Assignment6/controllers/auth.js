const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const {validationResult} = require('express-validator/check');

const User = require('../models/user');


exports.getLogin = (req, res, next) => {

    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login Page',
        path: '/login',
        errorMessage : message,
        oldInput: {email: "", password: ""},
    })
};

exports.postLogin = (req, res, next) => {
    
    const email = req.body.email;
    const password = req.body.password;
    
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login Page',
            path: '/login',
            errorMessage : errors.array()[0].msg,
            oldInput: {email: email, password: password}

        });
    }

    User.findOne({where: {email: email}})
    .then(user => {

        if(!user ){
            return res.status(422).render('auth/login', {
                pageTitle: 'Login Page',
                path: '/login',
                errorMessage : 'Invalid email or password',
                oldInput: {email: email, password: password}
            });
        }

        bcrypt.compare(password, user.password)
            .then(doMatch => {
                if(doMatch === true) {
                    req.session.isLoggedIn = true;
                    //setting the user across request
                    req.session.user = user;
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/');
                    });
                }
                
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login Page',
                    path: '/login',
                    errorMessage : 'Invalid email or password',
                    oldInput: {email: email, password: password}
                });
            })
            .catch(err => {
                console.log(err);
                res.redirect('/login');
            });
       
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

};

exports.getSignup = (req, res, next) => {

    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {email: "", password: "", confirmPassword: ""},
        validationErrors: []
        
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {email: email, password: password, confirmPassword: req.body.confirmPassword},
            validationErrors: errors.array()
        });
    }
             bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    return User.create({ 
                        email: email, 
                        password: hashedPassword
                    });
                })
                .then(user => {
                    console.log(user.id);
                    return user.createCart();
                })
                .then(result => {
                    res.redirect('/login');
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        

};

exports.postLogout = (req, res, next) => {    
    console.log("Destroying session")
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });

};

