const { DataTypes } = require('sequelize');
const sequelize = require('../config/db_connection');

const Maps = sequelize.define('maps', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_name: { 
        type: DataTypes.STRING, 
        allowNull: false
     }
}, { 
    timestamps: false,
});

module.exports = Maps;