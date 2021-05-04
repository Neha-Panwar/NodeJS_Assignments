const User = require('../models/user');

exports.getLogin = (req, res, next) => {

    console.log(req.session.isLoggedIn);

    res.render('auth/login', {
        pageTitle: 'Login Page',
        path: '/login',
        isAuthenticated: false
        
    })
};

exports.postLogin = (req, res, next) => {
     
    User.findByPk(1)
    .then(user => {
        req.session.isLoggedIn = true;
        //setting the user across request
        req.session.user = user;
        res.redirect('/');
    })
    .catch(err => console.log(err));

};
