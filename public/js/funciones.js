import { ojoAbierto, ojoCerrado } from "./components.js";

//Limpiar cualquier html
export function limpiarHTML(clase){
    const elementos = document.querySelectorAll(clase);
    elementos.forEach((elemento, tiempo) =>{ 
        setTimeout(() => {
            elemento.remove()
        }, 3000 * (++tiempo))
    }) 
}

//Verificar si hay sesion para modificar el header
export function verificarSesion(){
    const sesionExiste = document.getElementById('sesionExiste');
    const btnRegistro = document.getElementById('btnRegistro');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const agregarPerrito = document.getElementById('agregarPerrito');
    const misPerritos = document.getElementById('misPerritos');

    if(sesionExiste){
        btnRegistro.classList.add('d-none');
        btnLogin.classList.add('d-none');
        btnLogout.classList.remove('d-none');
        agregarPerrito.classList.remove('d-none');
        misPerritos.classList.remove('d-none');
    }
    else{
        btnRegistro.classList.remove('d-none')
        btnLogin.classList.remove('d-none')
        btnLogout.classList.add('d-none');
        agregarPerrito.classList.add('d-none');
        misPerritos.classList.add('d-none');
    }
}

//Mostrar enfermedades/actividades en 'registro'
export function mostrarEnfsActs(){
    const radioSi = document.getElementById('enfSi');
    const radioNo = document.getElementById('enfNo');
    const contenedorEnfermedades = document.getElementById('contenedorEnfermedades');
    const checksEnfermedades = document.querySelectorAll('#contenedorEnfermedades input[type="checkbox"]');

    radioSi.addEventListener('change', () => {
        if(radioSi.checked) contenedorEnfermedades.classList.remove('d-none');
    })

    radioNo.addEventListener('change', () => {
        if(radioNo.checked) contenedorEnfermedades.classList.add('d-none');
        checksEnfermedades.forEach(check => check.checked = false);
    })

    const actSi = document.getElementById('actSi');
    const actNo = document.getElementById('actNo');
    const contenedorActividades = document.getElementById('contenedorActividades');
    const checksActividades = document.querySelectorAll('#contenedorActividades input[type="checkbox"]');

    actSi.addEventListener('change', () => {
        if(actSi.checked) contenedorActividades.classList.remove('d-none');
    })

    actNo.addEventListener('change', () => {
        if(actNo.checked) contenedorActividades.classList.add('d-none');
        checksActividades.forEach(check => check.checked = false);
    })
}

//Mostrar alerta de usuario creado correctamente en 'usuario'
export function alertaSweet(){
    const alerta = document.querySelector('#alerta');
    
    if(alerta){
        const mostarBotonDenegar = alerta.dataset.cancelar === 'Cancelar';
        const presionarFuera = alerta.dataset.cancelar === '' ? Swal.DismissReason.backdrop : '';
        const vistaActual = alerta.dataset.vistaactual === '/inicio' ? '/' : alerta.dataset.vistaactual;
        Swal.fire({
            icon: alerta.dataset.icon,
            title: alerta.dataset.title,
            text: alerta.dataset.text,
            confirmButtonText: 'Aceptar',
            showDenyButton: mostarBotonDenegar,
            denyButtonText:alerta.dataset.cancelar,
            background: '#fff7ec',
            color: '#4b2b16',
            backdrop: 'rgba(70, 43, 25, 0.45)',
            width: 'min(92vw, 520px)',
            buttonsStyling: false,
            customClass: {
                popup: 'swal-paws-popup',
                title: 'swal-paws-title',
                htmlContainer: 'swal-paws-text',
                confirmButton: 'btn btn-paws',
                denyButton: 'btn btn-pawsCancelar'
            }
        }).then((resultado) => {
            if(resultado.isConfirmed || resultado.dismiss === presionarFuera){
                return window.location.href = alerta.dataset.redireccion;
            }

            window.location.href = vistaActual;
        })
    }
}

export function mostrarOcultarPassword(){
    const mostrarPassword = document.getElementById('mostrarPassword');
    const password = document.getElementById('password');
    const labelPassword = document.querySelector('.password-toggle');
    
    mostrarPassword.addEventListener('change', () => {
        console.log('activado')
        if(mostrarPassword.checked == true){
            password.type = 'text';
            labelPassword.innerHTML = ojoAbierto;
        }
        else{
            password.type = 'password';
            labelPassword.innerHTML = ojoCerrado;
        }
    })
}

export function inputTexto(){
    const inputImagen = document.querySelector('#imagen');
    const fileName = document.querySelector('#fileName');

    if (!inputImagen || !fileName) return;

    inputImagen.addEventListener('change', () => {
        if (inputImagen.files.length > 0) {
            fileName.textContent = inputImagen.files[0].name;
        } else {
            fileName.textContent = 'Ningún archivo seleccionado';
        }
    });
}

export function editandoPerro(){
    const btnRegistrar = document.querySelector('#btnRegistrar');
    const editando = document.querySelector('#editando');

    if(editando){
        btnRegistrar.textContent = 'Guardar Cambios';
    }
    
} 