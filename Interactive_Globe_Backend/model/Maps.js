const { DataTypes } = require('sequelize');
const sequelize = require('../config/db_connection');
const D_Libraries = require('./Digital_Libraries');
const Coordinates = require('./Coordinates'); 

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
     },
     m_id:{ //id_riferimento al comune
        type: DataTypes.INTEGER,
        references: {
            model: 'digital_libraries',
            key: 'id'
        },
        allowNull: false,
     },
     historical_period: {
        type: DataTypes.INTEGER,
        allowNull: true
     },
    creator: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    coord_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, { 
    timestamps: false,
});

D_Libraries.hasMany(Maps, { foreignKey: 'm_id', as: 'Maps', onDelete: 'CASCADE' });
Maps.belongsTo(D_Libraries, { foreignKey: 'm_id', as: 'Digital_Library' });

Coordinates.hasMany(Maps, { foreignKey: 'coord_id', onDelete: 'SET NULL' });
Maps.belongsTo(Coordinates, { foreignKey: 'coord_id' });

module.exports = Maps;