const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Thought = db.define('Thought', {
    title: {
        type: DataTypes.STRING,
        allowNull: true,
        require: false,
        default: "a"
    },
    weight: {
        type:DataTypes.DOUBLE,
        allowNull: true,
        require: false,
    },
    age: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        require: false,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
        require: false,
    },
    available: {
        type: DataTypes.BOOLEAN,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        require: false,
    },
    adopter: {
        type: DataTypes.BIGINT}

})

const User = require('./user')

Thought.belongsTo(User)
User.hasMany(Thought
    
)
module.exports = Thought