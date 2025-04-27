const {DataTypes} = require('sequelize');
const sequelize = require('../config/db_connection');

const Digital_Libraries = sequelize.define('digital_libraries', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mapsNumber:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    markerColor: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false,
});

module.exports = Digital_Libraries;

