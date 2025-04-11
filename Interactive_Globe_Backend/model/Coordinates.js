const { DataTypes } = require('sequelize');
const sequelize = require('../config/db_connection');

const Coordinates = sequelize.define('Coordinates', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: false
});

module.exports = Coordinates;
