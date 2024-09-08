const { DataTypes } = require('sequelize')
const db = require('../db/conn')
const User = require('./user')

const Local = db.define('Locias', {
    endereco: {
        type: DataTypes.STRING,
        require: false,
    },
    horaInicio: {
        type: DataTypes.TIME,

    },
    horaFim: {
        type: DataTypes.TIME,
        
    }
})

Local.hasOne(User)
User.hasMany(Local)

module.exports = Local