import Sequelize from 'Sequelize'
import db from './db.js'

export const Actividad = db.define('actividades', {
    nombre:{
        type: Sequelize.STRING
    },
    intensidad:{
        type: Sequelize.STRING
    },
    factorActividad:{
        type: Sequelize.INTEGER
    },
    
}) 