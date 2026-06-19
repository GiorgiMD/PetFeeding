import {Usuario} from '../models/Usuarios.js'
import bcryptjs from 'bcryptjs';

const guardarUsuario = async (request, response) => {
    let {nombre, correo, password} = request.body;
    nombre = nombre.trim();
    correo = correo.trim();
    password = password.trim();
    const errores = [];
    const regexEmail = /^[A-Za-z0-9]+([._%+-]?[A-Za-z0-9]+)*@[A-Za-z0-9]+([.-]?[A-Za-z0-9]+)*(\.[A-Za-z]{2,})+$/;
    const regexPassword = /^(?=.*[A-Z])(?=.*[+\*?\^$()[\]{}\\\/!@#%&_:;'"><|`~])[A-Za-z0-9+\*?\^$()[\]{}\\\/!@#%&_:;'"><|`~]{8,}$/;

    if(nombre == '' || correo == '' || password == ''){
        errores.push({mensaje: 'Ningun campo puede ir vacio'})
    }
    else{
        try {
            const usuario = await Usuario.findOne({
                where:{
                    correo
                }
            })

            if(usuario){
                return response.render('usuario', {
                    pagina: 'Usuario',
                    vista:'usuario',
                    nombre:'', correo:'', password:'', errores:[],
                    alerta:{
                        icon: 'warning',
                        title: 'Ya existe un usuario asociado a este correo electronico',
                        text: 'Inicia sesion o intenta con otro correo',
                        redireccion: '/usuario'
                    }
                })
            }
            
            if(!regexEmail.test(correo)){
                errores.push({mensaje:'Correo invalido'})
            }

            if(!regexPassword.test(password)){
                errores.push({mensaje:'La contraseña debe contener al menos una mayuscula, un caracter especial y un total de 8 caracteres'});
            }

        } catch (error) {
            console.log(error);
        }
        
    }    

    if(errores.length>0){
        return response.render('usuario', {
            pagina:'Usuario',
            vista:'usuario',
            nombre, 
            correo, 
            errores
        });
    }
    else{
        try {

            const passwordHash = await bcryptjs.hash(password, 10);
            await Usuario.create({
                nombre, correo, password: passwordHash
            })

            return response.render('usuario', {
                pagina: 'Usuario',
                vista:'usuario',
                nombre:'', correo:'', password:'', errores:[],
                alerta:{
                    icon: 'success',
                    title: 'Usuario registrado',
                    text: 'Tu cuenta se creó correctamente',
                    redireccion: '/login'
                }
            })
        } catch (error) {
            console.log(error);
        }
    }
}

export{
    guardarUsuario
}