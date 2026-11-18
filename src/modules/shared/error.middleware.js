const multer = require('multer');
const HttpError = require('./http-error');

function notFoundHandler(req, res) {
    return res.status(404).json({
        error: `Rota ${req.method} ${req.originalUrl} não encontrada.`
    });
}

// Middleware central de erros: garante respostas JSON padronizadas
// e evita vazar stack traces para o cliente.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'O arquivo excede o tamanho máximo de 4 MB.' });
        }
        return res.status(400).json({
            error: `Falha no upload (${err.code}). Envie um único arquivo no campo "image".`
        });
    }

    // Erros do express.json() (JSON malformado, corpo grande demais etc.)
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
    }
    if (err.expose && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ error: err.message });
    }

    console.error('[ErrorHandler]', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { notFoundHandler, errorHandler };
