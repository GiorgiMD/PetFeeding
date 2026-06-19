import { Croqueta } from "../models/Croquetas.js";
import { Perro } from "../models/Perros.js";
import { Raza } from "../models/Razas.js";
import { enfermedadesPerros, actividadesPerros, Croquetas, Razas, categorias } from "./nuevo_perroController.js";
import path from 'path';
import fs from 'fs';

Perro.belongsTo(Croqueta, {
    foreignKey: 'croquetas_id',
    as: 'croqueta'
});

Croqueta.hasMany(Perro, {
    foreignKey: 'croquetas_id',
    as: 'perros'
});

Perro.belongsTo(Raza,{
    foreignKey: 'raza_id',
    as: 'raza'
});

Raza.hasMany(Perro,{
    foreignKey: 'raza_id',
    as: 'perros'
})

const obtenerPerros = async (request, response) => {
    try {
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
        
        const perros = await Perro.findAll({
            where:{
                usuario_id: response.locals.usuarioId
            },
            include: [
                {
                    model: Croqueta,
                    as: 'croqueta'
                },
                {
                    model: Raza,
                    as: 'raza'
                }
            ]
        })

        if(perros.length<1){
            return response.render('mis_perros', {
                pagina:'Mis Perritos', 
                vista:'mis_perros'
            })
        }

        return response.render('mis_perros', {
            pagina:'Mis Perritos', 
            vista:'mis_perros',
            perros
        })
        console.log(`Croquetas Ruta ${perro.croqueta.ruta}`)
    } catch (error) {
        console.log(error)
    }
}

const mostrarImagenPerro = async (request, response) => {
    const { id } = request.params;

    try {
        const perro = await Perro.findOne({
            where: {
                id,
                usuario_id: request.session.usuarioId
            }
        });

        const nombreImagen = path.basename(perro.imagen);

        const rutaImagen = path.resolve(
            process.cwd(),
            'uploads',
            'perros',
            nombreImagen
        );

        return response.sendFile(rutaImagen);

    } catch (error) {
        console.log(error);
    }
};

const editarPerro = async (request, response) => {
    const {id} = request.params;
    const razas = await Razas();
    const enfermedadesForm = await enfermedadesPerros();
    const actividadesForm = await actividadesPerros();
    const croquetas = await Croquetas();

    const perro = await Perro.findOne({
        where:{
            id
        }
    });

    let {nombre, raza_id, edad, peso, esterilizado, enfermedades, actividades, alimento, croquetas_id, imagen} = perro;
    const years = edad/12;
    const meses = edad - (years*12);

    const enfermedadesSeleccionadas = enfermedades ? JSON.parse(enfermedades) : [];
    const actividadesSeleccionadas = actividades ? JSON.parse(actividades) : [];

    const enfYN = enfermedadesSeleccionadas.length > 0 ? 'si' : 'no';
    const actYN = actividadesSeleccionadas.length > 0 ? 'si' : 'no';

    response.render('nuevo_perro',{
        pagina: 'Editar Perrito',
        vista: 'nuevo_perro',
        razas,
        enfermedadesForm,
        actividadesForm,
        errores: [],
        nombre,
        raza: raza_id,
        years,
        meses,
        peso,
        enfYN,
        actYN,
        esterilizado,
        enfermedades: enfermedadesSeleccionadas,
        actividades: actividadesSeleccionadas,
        imagen,
        categorias,
        croquetas,
        croquetas_id,
        editando: true,
        id
    });
}

const destruirPerro = async (request, response) => {
    const {id} = request.params;
    try {
        await Perro.destroy({
            where:{
                id
            }
        })

        return response.redirect('/mis_perros')
    } catch (error) {
        console.log(error);
    }
}

const eliminarPerro = async (request, response) => {
    const {id} = request.params;
    
    const perro = await Perro.findOne({
        where:{
            id
        }
    });

    response.render('mis_perros', {
        pagina:'Mis Perritos',
        vista:'mis_perros',
        alerta:{
            icon: 'question',
            title: '¿Estas seguro?',
            text: `${perro.nombre} abandonara tu familia 🥺`,
            cancelar: 'Cancelar',
            vistaActual:'/mis_perros',
            redireccion: `/destruir/${id}`
        }
    })
}

const alimentarPerro = async (request, response) => {
    let estado = request.session.estadoESP || 'off';
    let id = request.params.id;

    if(estado === 'off'){
        estado = 'on'
    }else{
        estado = 'off'
    }

    const perro = await Perro.findOne({
        where:{
            id
        },
        include: [
            {
                model: Croqueta,
                as: 'croqueta'
            },
            {
                model: Raza,
                as: 'raza'
            }
        ]
    })

    const gramos = perro.alimento;

    try {
        const respuesta = await fetch(`${process.env.IP_ESP32}/servo/abrir?gramos=${gramos}`);
        // http://192.168.1.89/servo/toggle
        if(!respuesta.ok){
            return response.status(500).json({
                ok: false,
                mensaje: 'La ESP32 no respondió correctamente'
            });
        }

        const datos = await respuesta.json();
        request.session.estadoESP = estado;

        return response.render('mis_perros',{
            pagina:'Mis perritos',
            vista:'mis_perros',
            estado
        })

    } catch (error) {
       return response.status(500).json({
            ok: false,
            mensaje: 'No se pudo conectar con la ESP32 ' + error
        });
    }
    
}

export{
    obtenerPerros, mostrarImagenPerro, editarPerro, eliminarPerro, destruirPerro, alimentarPerro
}