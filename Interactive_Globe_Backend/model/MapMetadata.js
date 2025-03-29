const { DataTypes } = require('sequelize');
const sequelize = require('../config/db_connection');
const Maps = require('./Maps');

const MapMetadata = sequelize.define('map_metadata', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    map_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Maps,
            key: 'id'
        },
        allowNull: false,
        unique: true
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
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
}, {
    timestamps: false,
});

Maps.hasOne(MapMetadata, { foreignKey: 'map_id', onDelete: 'CASCADE' });
MapMetadata.belongsTo(Maps, { foreignKey: 'map_id' });

module.exports = MapMetadata;
