import {Perro} from '../models/Perros.js'
import {Croqueta} from '../models/Croquetas.js'
import {Raza} from '../models/Razas.js'
import { Enfermedad } from '../models/enfermedades.js';
import { Actividad } from '../models/Actividades.js';
import path from 'path';

// export const DogAPI = async () => { 
//     const apiKey = 'live_DOP0CNpsgX2aUn9WM6fIeDUUpdStJAIFyHHvW8IoPjnU5nxVOQ1CZxay4vK59anT';
//     const url = 'https://api.thedogapi.com/v1/breeds'
//     try {
//         const respuesta = await fetch(url, {
//             method: 'GET',
//             headers:{
//                 'x-api-key':`${apiKey}`
//             }
//         })

//         const resultado =  await respuesta.json();
//         return resultado;

//     } catch (error) {
//         console.log(error);
//     }
// }

export const categorias = ['Control de peso', 'Digestiva', 'Alergias y piel'];

export const actividadesPerros = async () => {
    const actividades = await Actividad.findAll();
    return actividades;
};

export const enfermedadesPerros = async () => {
    const enfermedades = await Enfermedad.findAll();
    return enfermedades;
};

export const Croquetas = async () => {
    const croquetas = await Croqueta.findAll();
    return croquetas;
} 

export const Razas = async () => {
    const razas = await Raza.findAll();
    return razas;
} 

const actualYear = new Date().getFullYear()
const regexNombre = /^[A-Za-zÁáÉéÍíÓóÚúñ\s]+$/;
const razas = await Razas();
const enfermedadesForm = await enfermedadesPerros();
const actividadesForm = await actividadesPerros();
const croquetas = await Croquetas();

function validarNuevoPerro(nombre, raza, years, meses, peso, croquetas, enfYN, actYN, enfermedades, actividades, esterilizado){
    const errores = [];

    if (nombre === '') {
        errores.push({ mensaje: 'El nombre no puede ir vacío' });
    }
    else if(!regexNombre.test(nombre)){
        errores.push({mensaje: 'El nombre no puede contener numeros ni caracteres especiales'});
    }

    if (raza === '') {
        errores.push({ mensaje: 'La raza no puede ir vacía' });
    }

    if(croquetas === ''){
        errores.push({ mensaje: 'Las croquetas no pueden ir vacias' });
    }

    if(years === '' &&  meses == ''){
        errores.push({ mensaje: 'La edad no puede ir vacia' });
    }else{
        if (years === '') {
            years = '0';
        }else if(Number(years) > 25){
            errores.push({mensaje:'Los años maximos permitidos son 25'})
        }else if(Number(years) < 0){
            errores.push({mensaje:'Los años minimos permitidos son 0'})
        }

        if (meses === '') {
            meses='0';
        }else if(Number(meses) > 11){
            errores.push({mensaje:'Los años maximos permitidos son 11'})
        }else if(Number(meses) < 0){
            errores.push({mensaje:'Los meses minimos permitidos son 0'})
        }
    }

    if (peso === '') {
        errores.push({ mensaje: 'El peso no puede ir vacío' });
    }else if(Number(peso) > 100){
        errores.push({ mensaje: 'El peso maximo permitido es 100kg' });
    }else if(Number(peso) < 0.5){
        errores.push({ mensaje: 'El peso minimo permitido es 0.5kg' });
    }
    
    if(!esterilizado){
        errores.push({ mensaje: 'Seleccione si esta esterilizado o no' });
    }

    if(!enfYN){
        errores.push({ mensaje: 'Seleccione si tiene o no enfermedades' });
    }

    if(!actYN){
        errores.push({ mensaje: 'Seleccione si realiza o no actividad física' });
    }

    if (enfYN === 'si') {
        if(!enfermedades){
            errores.push({ mensaje: 'Seleccione al menos una enfermedad' });
        }
    }

    if (actYN === 'si') {
        if(!actividades){
            errores.push({ mensaje: 'Seleccione al menos una actividad física' });
        }
    }

    return errores;
}

const guardarPerro = async (request, response) => {
    console.log(request.body);
    let { nombre, raza, years, meses, peso, croqueta, enfYN, actYN, enfermedades, actividades, esterilizado } = request.body;
    nombre = nombre.trim(); years=years.trim(); meses=meses.trim(); peso=peso.trim();

    const imagen = request.file ? request.file.filename : null;
    const errores = validarNuevoPerro(nombre, raza, years, meses, peso, croqueta, enfYN, actYN, enfermedades, actividades, esterilizado);

    if (errores.length > 0) {
        
        response.render('nuevo_perro',{
            pagina: 'Nuevo Perrito',
            vista:'nuevo_perro',
            razas,
            enfermedadesForm,
            actividadesForm,
            errores,
            nombre,
            raza,
            years,
            meses,
            peso,
            enfYN,
            actYN,
            esterilizado,
            enfermedades,
            actividades,
            imagen,
            categorias,
            croquetas_id:croqueta,
            croquetas
        });
    }
    else{
        const edad = (Number(years)*12) + Number(meses);
        console.log(years);
        try {
            const alimento = await calcularAlimento({
                peso,
                edad,
                raza,
                esterilizado,
                enfermedades,
                actividades,
                croqueta
            });

           const datosPerro = {
                nombre,
                raza_id: raza,
                edad,
                peso,
                enfermedades: JSON.stringify(enfermedades),
                actividades: JSON.stringify(actividades),
                croquetas_id: croqueta,
                alimento,
                esterilizado: esterilizado === 'true'
            };

            if (request.file) {
                datosPerro.imagen = request.file.filename;
            }

            if(request.params.id) {
                await Perro.update(datosPerro, {
                    where: {
                        id: request.params.id,
                        usuario_id: response.locals.usuarioId
                    }
                });

                return response.render('mis_perros', {
                    pagina: 'Mis Perritos',
                    vista: 'mis_perros',
                    alerta: {
                        icon: 'success',
                        title: 'Perrito editado correctamente',
                        text: '',
                        redireccion: '/mis_perros'
                    }
                });
            }
            
            await Perro.create({
                nombre, raza_id: raza, edad, peso, 
                enfermedades: JSON.stringify(enfermedades),
                actividades: JSON.stringify(actividades), 
                croquetas_id: croqueta,
                usuario_id: response.locals.usuarioId,
                imagen,
                alimento,
                esterilizado: esterilizado === 'true'
            })

            return response.render('mis_perros', {
                pagina: 'Mis Perritos',
                vista:'mis_perros',
                alerta:{
                    icon: 'succes',
                    title: 'Perrito añadido correctamente',
                    text: `${nombre} se unio a tu familia 🐾`,
                    redireccion: '/mis_perros'
                }
            })

        } catch (error) {
            console.log(error)
        }
    }
};

async function calcularAlimento({peso, edad, raza, esterilizado, enfermedades = [], actividades = [], croqueta }) {
    const razaSeleccionada = await Raza.findByPk(raza);
    const croquetaSeleccionada = await Croqueta.findByPk(croqueta);

    const tamanoRaza = razaSeleccionada.tamano;

    const edadAdultaMeses = tamanoRaza === 'grande' || tamanoRaza === 'gigante' ? 16 : 12;

    const edadNumero = Number(edad);
    const pesoNumero = Number(peso);
    const esterilizadoBool = esterilizado === 'true';

    const esCachorro = edadNumero < edadAdultaMeses;   

    const tieneObesidad = enfermedades.includes('Obesidad');
    const tieneSobrepeso = enfermedades.includes('Sobrepeso');

    const actividadLigera =
        actividades.includes('Caminar') ||
        actividades.includes('Entrenamiento de obediencia');

    const actividadModerada =
        actividades.includes('Correr') ||
        actividades.includes('Nadar') ||
        actividades.includes('Obstaculos') ||
        actividades.includes('Obstáculos');

    let factor;

    if (esCachorro) {
        factor = edadNumero < 4 ? 3.0 : 2.0;
    } else if (tieneObesidad) {
        factor = 1.0;
    } else if (tieneSobrepeso) {
        factor = 1.2;
    } else if (actividadModerada) {
        factor = 2.0;
    } else if (actividadLigera) {
        factor = esterilizadoBool ? 1.6 : 1.8;
    } else {
        factor = esterilizadoBool ? 1.4 : 1.6;
    }

    const RER = 70 * Math.pow(pesoNumero, 0.75);
    const MER = RER * factor;

    const kcalKg = Number(croquetaSeleccionada.kcal_kg);
    const kcalg = kcalKg/1000;
    const gramosAlimento = (MER / kcalg);

    return Math.round(gramosAlimento);
}

export {
    guardarPerro
};