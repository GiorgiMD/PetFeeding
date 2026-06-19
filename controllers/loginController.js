import {Usuario} from '../models/Usuarios.js'
import bcryptjs from 'bcryptjs';

const verificarUsuario = async (request, response) => {
    let {correo, password} = request.body;
    const errores = [];
    correo = correo.trim();
    password = password.trim()

    if(correo == ''){
        errores.push({mensaje:'El correo es invalido'})
    }
    if(password == ''){
        errores.push({mensaje:'Contraseña invalida'})
    }

    if(errores.length>0){
        return response.render('login', {
            pagina: 'Inicio de Sesion',
            vista:'login',
            correo, 
            password:'',
            errores
        });
    }
    else{
        try {
            const usuario = await Usuario.findOne({
                where:{
                    correo
                }
            })

            if(!usuario){
                return response.render('login', {
                    pagina: 'Inicio de Sesion',
                    vista:'login',
                    correo:'', 
                    password:'',
                    errores :[],
                    alerta:{
                        icon: 'error',
                        title: 'Usuario no encontrado',
                        text: 'Primero debe registrarse',
                        redireccion: '/usuario'
                    }
                });
            }
            
            const sesion = await bcryptjs.compare(password, usuario.password);

            if(!sesion){
                return response.render('login', {
                    pagina: 'Inicio de Sesion',
                    vista:'login',
                    correo, 
                    password:'',
                    errores :[{mensaje:'Contraseña incorrecta, intentelo nuevamente'}]
                });
            }
            
            request.session.usuarioId = usuario.id;
            request.session.nombre = usuario.nombre;
            request.session.correo = usuario.correo;
            request.session.loggedin = true;

            return response.redirect('/');

        } catch (error) {
            console.log(error);
        }
    }
}

const verificarSesion = async (request, response) => {
    if(request.session.loggedin){
        return response.render('inicio', {
            pagina: 'Inicio',
            vista:'inicio',
            login: true,
            nombre: request.session.nombre
        })
    }

    return response.render('inicio', {
        login: false,
        pagina: 'Invitado',
        vista:'inicio'
    })
}

const cerrarSesion = (request, response) => {
    const vistaActual = request.query.vista;
    response.render(vistaActual, {
        pagina: vistaActual.charAt(0).toUpperCase() + vistaActual.slice(1),
        vista:vistaActual,
        alerta:{
            icon: 'question',
            title: '¿Seguro que quieres cerrar sesion?',
            text: 'No te nos vayas!!! 😭',
            cancelar: 'Cancelar',
            vistaActual:`/${vistaActual}`,
            redireccion: `/confirmLogOut`
        }
    })
}

const confirmarCierre = (request, response) => {
    request.session.destroy(error => {
        if(error){
            console.log(error);
            return response.redirect('/');
        }

        response.clearCookie('peetfeeding.sid');
        return response.render('inicio', {
            pagina: 'Inicio',
            vista: 'inicio',
            alerta:{
                icon: 'succes',
                title: 'Se cerro la sesion correctamente',
                text: 'Esperamos verte pronto',
                redireccion: '/'
            }
        });
    })
}

export{
    verificarUsuario,
    verificarSesion,
    cerrarSesion,
    confirmarCierre
}