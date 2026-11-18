const authService = require('./auth.service');
const activityService = require('../shared/activity.service');
const { isFilledString, isValidEmail } = require('../shared/validators');

const MIN_PASSWORD_LENGTH = 6;

// Erros inesperados são propagados (Express 5 captura rejeições de funções async)
// e tratados pelo middleware central em shared/error.middleware.js.
const authController = {
    async register(req, res) {
        const { name, email, password } = req.body ?? {};

        if (!isFilledString(name) || !isFilledString(email) || !isFilledString(password)) {
            return res.status(400).json({
                error: 'Informe nome, e-mail e senha para concluir o cadastro.'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: 'Informe um endereço de e-mail válido.'
            });
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
            });
        }

        try {
            const newUser = await authService.register({ name, email, password });
            return res.status(201).json(newUser);
        } catch (err) {
            if (err.code === 'P2002') {
                return res.status(409).json({
                    error: 'Este endereço de e-mail já está em uso.'
                });
            }
            throw err;
        }
    },

    async login(req, res) {
        const { email, password } = req.body ?? {};

        if (!isFilledString(email) || !isFilledString(password)) {
            return res.status(400).json({
                error: 'E-mail e senha precisam ser preenchidos.'
            });
        }

        const sessionData = await authService.login({ email, password });

        if (!sessionData) {
            return res.status(401).json({
                error: 'E-mail ou senha incorretos.'
            });
        }

        return res.status(200).json(sessionData);
    },

    async me(req, res) {
        return res.status(200).json({
            authenticated: true,
            user: req.user
        });
    },

    async listActivities(req, res) {
        const activities = await activityService.listByUser(req.user.id);
        return res.status(200).json(activities);
    },

    async uploadAvatar(req, res) {
        if (!req.file) {
            return res.status(400).json({
                error: 'Envie um arquivo de imagem válido no campo "image".'
            });
        }

        const userWithAvatar = await authService.updateAvatar(req.user.id, req.file);

        return res.status(200).json({
            message: 'Foto de perfil processada e atualizada!',
            user: userWithAvatar
        });
    }
};

module.exports = authController;
