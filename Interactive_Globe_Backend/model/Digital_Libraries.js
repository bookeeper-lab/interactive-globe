const {DataTypes} = require('sequelize');
const sequelize = require('../config/db_connection');

const Municipality = sequelize.define('municipality', {
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

module.exports = Municipality;

