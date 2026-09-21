//INSTRUCCIONES

//0. Instalar nodejs en tu computadora

//1. Instalar MySQL en tu computadora

//2. Ejecutar el comando "CREATE DATABASE petfeeding; en un gestor de base de datos"

//3. Ejecutar los siguientes comandos en la terminal (ESTANDO UBICADO EN LA RAIZ DEL PROYECTO)
//mysql -u root -p petfeeding < models/SQL/petfeeding.dump
//npm install
//npm run petfeeding

//4. Abrir http://localhost:4000/ en el navegador

//5.Primero registrarse

//6. Iniciar sesion

//7. Registrar un perrito en "Agregar Perrito"

//8. Gestionar perritos en "Mis Perritos"

import express from 'express'
import router from './routes/routes.js'
import db from './models/db.js'
import bcryptjs  from 'bcryptjs'
import session from 'express-session'
import dotenv from 'dotenv'

const app = express();
const port = process.env.PORT || 4000;
db.authenticate().then(() => console.log('Base de datos conectada')).catch(erros => console.log(error));
app.set('view engine', 'pug')
app.use(express.static('public'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));
app.use('/sweetalert2', express.static('node_modules/sweetalert2/dist'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    name: 'peetfeeding.sid',
    secret:process.env.SECRET, 
    resave: false, 
    saveUninitialized: false,
    cookie:{
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 365
    }
}))
app.use((request, response, next) => {
    response.locals.login = request.session.loggedin || false;
    response.locals.nombre = request.session.nombre || '';
    response.locals.correo = request.session.correo || '';
    response.locals.usuarioId = request.session.usuarioId || null;
    next();
});
app.use('/', router);
app.listen(port, () => {
    console.log(`Servidor funcionando en el puerto ${port}`)
})
