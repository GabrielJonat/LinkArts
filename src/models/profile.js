const { DataTypes } = require('sequelize')
const db = require('../db/conn')
const User = require('./user')

const Profile = db.define('Profile', {
    image: {
        type: DataTypes.STRING,
    },
    state: {
        type: DataTypes.STRING,
    },
    city: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.STRING,
    },
    userId: {
        type: DataTypes.BIGINT
    }
})

module.exports = Profile