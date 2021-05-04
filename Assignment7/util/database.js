const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-socialmedia', 'root', 'root', {
  dialect: 'mysql', 
  host: 'localhost'
});

module.exports = sequelize;

