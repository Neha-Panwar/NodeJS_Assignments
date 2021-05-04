const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete3', 'root', 'root', {
  dialect: 'mysql', 
  host: 'localhost'
});

module.exports = sequelize;




