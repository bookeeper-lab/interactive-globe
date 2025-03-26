const {Sequelize} = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    dialect: 'mysql',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: true //per vedere le query sul terminale
});

module.exports = sequelize;