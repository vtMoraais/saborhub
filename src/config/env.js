const REQUIRED_VARIABLES = ['DATABASE_URL', 'JWT_SECRET'];

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Variável de ambiente JWT_SECRET não definida. Copie o .env.example para .env.');
    }
    return secret;
}

function assertRequiredEnv() {
    const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);
    if (missing.length > 0) {
        throw new Error(
            `Variáveis de ambiente ausentes: ${missing.join(', ')}. ` +
            'Copie o arquivo .env.example para .env e ajuste os valores.'
        );
    }
}

module.exports = { getJwtSecret, assertRequiredEnv };
