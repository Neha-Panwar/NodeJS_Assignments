const express = require('express');

const homeRoutes = require('./home');

const router = express.Router(); 

router.get('/users', (req, res, next) => {

  const users = homeRoutes.users;

  res.render('user-info', {
      pageTitle: 'Users Detail', 
      userList: users, 
      hasUsers: users.length > 0,
  }); 

});

module.exports = router;
