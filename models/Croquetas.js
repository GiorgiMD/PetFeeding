import Sequelize from 'Sequelize';
import db from './db.js';

export const Croqueta = db.define('croquetas', {
    marca:{
        type:Sequelize.STRING
    },
    tipo:{
        type:Sequelize.STRING
    },
    kcal_kg:{
        type: Sequelize.INTEGER
    },
    ruta:{
        type: Sequelize.STRING
    }
})