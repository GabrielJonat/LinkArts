const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Adoption = db.define('Adoption', {
    status: {
        type: DataTypes.BOOLEAN,
        require: true,
        allowNull: false,
    }
})

const User = require('./user')

const Thought = require('./thoughts')

Adoption.belongsTo(User)
Adoption.belongsTo(Thought)
User.hasMany(Adoption)
Thought.hasOne(Adoption)
module.exports = Adoption