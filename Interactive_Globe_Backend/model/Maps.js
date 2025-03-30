const { DataTypes } = require('sequelize');
const sequelize = require('../config/db_connection');
const Municipality = require('./Municipality');

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
     m_id:{
        type: DataTypes.INTEGER,
        references: {
            model: 'municipalities',
            key: 'id'
        },
        allowNull: false,
     }
}, { 
    timestamps: false,
});

Municipality.hasMany(Maps, { foreignKey: 'm_id', onDelete: 'CASCADE' });
Maps.belongsTo(Municipality, { foreignKey: 'm_id' });


module.exports = Maps;