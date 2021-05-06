const Sequelize = require('sequelize');

const sequelize = new Sequelize('ourshop', 'root', 'root', {
  dialect: 'mysql', 
  host: 'localhost'
});

module.exports = sequelize;


