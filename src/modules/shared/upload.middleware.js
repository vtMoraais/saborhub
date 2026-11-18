const multer = require('multer');
const HttpError = require('./http-error');

const VALID_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

const memoryStorage = multer.memoryStorage();

function validateImageType(req, file, callback) {
    if (VALID_MIME_TYPES.has(file.mimetype)) {
        return callback(null, true);
    }
    return callback(
        new HttpError(400, 'Tipo de arquivo não suportado. Utilize apenas JPEG, PNG ou WebP.'),
        false
    );
}

const uploadMiddleware = multer({
    storage: memoryStorage,
    fileFilter: validateImageType,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1
    }
});

module.exports = uploadMiddleware;
