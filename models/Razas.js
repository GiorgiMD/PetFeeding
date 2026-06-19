import Sequelize from 'Sequelize'
import db from './db.js'

export const Raza = db.define('razas', {
    raza:{
        type: Sequelize.STRING
    }
}) 