/**
 * Erro de domínio com status HTTP associado.
 * Lançado pelas camadas de Controller/Service e convertido em resposta JSON
 * pelo middleware central de erros (error.middleware.js).
 */
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

module.exports = HttpError;
