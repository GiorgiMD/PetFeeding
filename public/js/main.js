import { limpiarHTML, verificarSesion, mostrarEnfsActs, alertaSweet, mostrarOcultarPassword, inputTexto, editandoPerro } from "./funciones.js"
import { ojoAbierto, ojoCerrado } from "./components.js";

document.addEventListener('DOMContentLoaded', () => {
    const vistaActual = document.body.dataset.vista;
    console.log(vistaActual);

    console.log('verificar sesion');
    verificarSesion();

    const funcionesPorVista = {
        inicio: [alertaSweet],

        login:[
            mostrarOcultarPassword,
            alertaSweet
        ],
        
        nuevo_perro: [
            mostrarEnfsActs,
            inputTexto,
            alertaSweet, 
            editandoPerro
        ],
        
        usuario:[
            mostrarOcultarPassword,
            alertaSweet
        ] ,

        mis_perros:[
            alertaSweet
        ]
    };

    const funciones = funcionesPorVista[vistaActual] || []
    funciones.forEach(funcion => {
        funcion();
    })
})