import Sequelize from 'sequelize'
import dotenv from 'dotenv'

dotenv.config();
const name = process.env.DB_NAME;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;

const db = new Sequelize(name, user, password, {
    host,
    port,
    dialect: 'mysql',
    define: {
        timestamps: false
    },
    pool:{
        max:5,
        min:0,
        acquire:30000,
        idle:10000
    },
    operatorAliases: false
})

export default db;