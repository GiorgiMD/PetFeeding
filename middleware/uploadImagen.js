import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const carpetaPerros = path.join(process.cwd(), 'uploads', 'perros');

if (!fs.existsSync(carpetaPerros)) {
    fs.mkdirSync(carpetaPerros, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(request, file, cb) {
        cb(null, carpetaPerros);
    },

    filename: function(request, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();
        const nombreArchivo = `${crypto.randomUUID()}${extension}`;

        cb(null, nombreArchivo);
    }
});

const fileFilter = function(request, file, cb) {
    const tiposPermitidos = ['image/jpeg', 'image/png'];

    if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG o PNG '));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

export default upload;