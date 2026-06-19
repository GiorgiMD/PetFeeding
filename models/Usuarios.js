import Sequelize from 'Sequelize'
import db from './db.js'

export const Usuario = db.define('usuarios', {
    nombre:{
        type:Sequelize.STRING
    },
    correo:{
        type: Sequelize.STRING
    },
    password:{
        type: Sequelize.STRING
    }
})