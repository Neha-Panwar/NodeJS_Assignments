const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const {validationResult} = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: 'xyz valid api'
    }
}));

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
        errorMessage : message
        // isAuthenticated: isLoggedIn,
        // isAuthenticated: false
        
    })
};

exports.postLogin = (req, res, next) => {
    
    const email = req.body.email;
    const password = req.body.password;
    
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.render('auth/login', {
            pageTitle: 'Login Page',
            path: '/login',
            errorMessage : errors.array()[0].msg
        });
    }

    User.findOne({where: {email: email}})
    .then(user => {

        if(!user ){
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
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
                
                req.flash('error', 'Invalid email or password');
                res.redirect('/login');
            })
            .catch(err => {
                console.log(err);
                res.redirect('/login');
            });
       
    })
    .catch(err => console.log(err));

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
        errorMessage: message
        // isAuthenticated: false
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    // const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg
            // isAuthenticated: false
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
                    return transporter.sendMail({
                        to: email,
                        from: 'shop@node-complete.com',
                        subject: 'Signup succeeded!',
                        html: '<h1>You successfully signed up! </h1>'
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        

};

exports.postLogout = (req, res, next) => {    
    console.log("Destroying session")
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });

};

exports.getReset =(req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    }
    else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({where: {email: req.body.email}})
            .then(user => {
                if(!user) {
                    req.flash('error', 'No account with that email found');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                user.save();

            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@node-complete.com',
                    subject: 'Password Reset',
                    html:  `
                        <p>You requested a password reset</p>
                        <p>Click <a href="https://localhost:3000/reset/${token}">here</a> to set a new password. </p>
                        `
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({where: {resetToken: token, resetTokenExpiration: {$gt: Date.now()}}})
        .then(user => {
            let message = req.flash('error');
            if(message.length > 0) {
                message = message[0];
            }
            else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user.id,
                passwordToken: token
            });
        })
        .catch(err => {
            console.log(err);
        });
    

};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({where: {
        resetToken: passwordToken, 
        resetTokenExpiration: {$gt: Date.now()}, 
        id: userId
    }})
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration= undefined;
        return resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        console.log(err);
    });
};