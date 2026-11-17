const jwt = require('jsonwebtoken');

function verifyAuthentication(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Acesso negado. Token de autenticação ausente.'
        });
    }

    const [, token] = authorizationHeader.split(' ');
    const secretKey = process.env.JWT_SECRET || 'fallback_secret_key';

    try {
        const decodedToken = jwt.verify(token, secretKey);

        req.user = {
            id: decodedToken.sub || decodedToken.id,
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