import { enfermedadesPerros, actividadesPerros, Croquetas, Razas, categorias } from "./nuevo_perroController.js";
import { obtenerPerros } from "./mis_perrosController.js";

const paginaNuevoPerro = async (request, response) => {
    const razas = await Razas();
    const croquetas = await Croquetas();
    const actividadesForm = await actividadesPerros();
    const enfermedadesForm = await enfermedadesPerros();
    
    if(!response.locals.login){
        return response.render('inicio',{
            pagina:'Inicio',
            vista:'inicio',
            alerta:{
                icon: 'error',
                title: 'No puedes acceder aqui',
                text: 'Debes iniciar sesion primero',
                redireccion: '/login'
            }
        })
    }

    return response.render('nuevo_perro', {
        pagina: 'Nuevo Perrito',
        vista:'nuevo_perro',
        razas,
        croquetas,
        categorias,
        enfermedadesForm,
        actividadesForm,
        errores: [],
        nombre:'',
        raza:'',
        years:'',
        meses:'',
        peso:'',
        enfYN:'',
        actYN:'',
        esterilizado:'',
        enfermedades:[],
        actividades:[],
        imagen:''
    })
}

const paginaUsuario = (request, response) => {
    response.render('usuario', {
        pagina: 'Usuario',
        vista:'usuario',
        nombre:'',
        correo:'',
        password:'',
        erores: []
    })
}

const paginaLogin = (request, response) => {
    response.render('login', {
        pagina: 'Inicio de Sesion',
        vista:'login',
        correo:'',
        password:'',
        errores: []
    })
}

export{
    paginaNuevoPerro,
    paginaUsuario,
    paginaLogin
}