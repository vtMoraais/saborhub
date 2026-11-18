const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../../config/env');

function verifyAuthentication(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Acesso negado. Token de autenticação ausente.'
        });
    }

    const [, token] = authorizationHeader.split(' ');
    const secretKey = getJwtSecret();

    try {
        const decodedToken = jwt.verify(token, secretKey);
        const userId = Number(decodedToken.sub);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error('Token sem identificador de usuário válido.');
        }

        req.user = {
            id: userId,
            email: decodedToken.email
        };

        return next();
    } catch (err) {
        return res.status(401).json({
            error: 'Sessão inválida ou token expirado.'
        });
    }
}

module.exports = verifyAuthentication;
