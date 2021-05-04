const express = require('express');

const router = express.Router(); 

const users = [];

router.get('/', (req, res, next) => {

    res.render('user-form', {
        pageTitle: 'User Form'
      });
});


router.post('/', (req, res, next) => {
    console.log(req.body);
    users.push({title: req.body.username});
    res.redirect('/');
    
});

exports.routes = router;
exports.users = users;