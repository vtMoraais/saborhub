const HttpError = require('./http-error');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PRICE = 99999999.99; // limite da coluna Decimal(10, 2)

function isFilledString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
    return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

function parseId(value, label = 'id') {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new HttpError(400, `O parâmetro "${label}" deve ser um número inteiro positivo.`);
    }
    return parsed;
}

function parsePrice(value) {
    const parsed = Number(value);
    if (value === null || value === '' || !Number.isFinite(parsed) || parsed < 0 || parsed > MAX_PRICE) {
        throw new HttpError(400, 'O preço deve ser um número maior ou igual a zero.');
    }
    return parsed;
}

function parseRating(value) {
    if (value === undefined || value === null) {
        return 5.0;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
        throw new HttpError(400, 'A avaliação deve ser um número entre 0 e 5.');
    }
    return Math.round(parsed * 10) / 10;
}

module.exports = {
    isFilledString,
    isValidEmail,
    parseId,
    parsePrice,
    parseRating
};
