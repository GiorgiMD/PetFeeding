import express from 'express'
import {paginaNuevoPerro, paginaUsuario, paginaLogin} from '../controllers/paginasController.js'
import {guardarPerro} from '../controllers/nuevo_perroController.js'
import {guardarUsuario} from '../controllers/usuarioController.js'
import {verificarUsuario, verificarSesion, cerrarSesion, confirmarCierre} from '../controllers/loginController.js'
import { obtenerPerros, mostrarImagenPerro, editarPerro, eliminarPerro , destruirPerro, alimentarPerro} from '../controllers/mis_perrosController.js'
import upload from '../middleware/uploadImagen.js';
const router = express.Router();

router.get('/', verificarSesion);
router.get('/nuevo_perro', paginaNuevoPerro)
router.get('/usuario', paginaUsuario)
router.get('/login', paginaLogin)
router.get('/mis_perros', obtenerPerros);
router.get('/mis_perros/imagen/:id', mostrarImagenPerro);
router.get('/logout', cerrarSesion);
router.get('/confirmLogOut', confirmarCierre);
router.get('/editar/:id', editarPerro);
router.post('/nuevo_perro', upload.single('imagen'), guardarPerro);
router.post('/editar/:id', upload.single('imagen'), guardarPerro);
router.get('/alimentar_perro/:id', alimentarPerro);
router.get('/eliminar/:id', eliminarPerro);
router.get('/destruir/:id', destruirPerro);
router.post('/usuario', guardarUsuario);
router.post('/login', verificarUsuario);

export default router;