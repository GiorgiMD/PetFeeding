import Sequelize from 'Sequelize'
import db from './db.js'

export const Enfermedad = db.define('enfermedades', {
    nombre:{
        type: Sequelize.STRING
    },
    categoria:{
        type: Sequelize.STRING
    },
    recomendacionGeneral:{
        type: Sequelize.STRING
    },
    gravedad:{
        type: Sequelize.STRING
    },
    descripcion:{
        type: Sequelize.STRING
    }
}) 