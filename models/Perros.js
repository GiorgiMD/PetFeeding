import Sequelize from 'Sequelize'
import db from './db.js'

export const Perro = db.define('perros', {
    nombre:{
        type:Sequelize.STRING
    },
    raza_id:{
        type:Sequelize.INTEGER
    },
    edad:{
        type:Sequelize.INTEGER
    },
    peso:{
        type:Sequelize.DECIMAL
    },
    enfermedades:{
        type:Sequelize.JSON
    },
    actividades:{
        type:Sequelize.JSON
    },
    croquetas_id:{
        type: Sequelize.INTEGER
    },
    usuario_id:{
        type:Sequelize.INTEGER
    },
    imagen:{
        type: Sequelize.STRING
    },
    alimento:{
        type: Sequelize.DECIMAL
    },
    esterilizado:{
        type: Sequelize.BOOLEAN
    }
})