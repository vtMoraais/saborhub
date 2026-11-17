const authService = require('./auth.service');

const authController = {
    async register(req, res) {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Informe nome, e-mail e senha para concluir o cadastro.'
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
            return res.status(500).json({
                error: 'Falha interna ao registrar usuário.'
            });
        }
    },

    async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'E-mail e senha precisam ser preenchidos.'
            });
        }

        try {
            const sessionData = await authService.login({ email, password });

            if (!sessionData) {
                return res.status(401).json({
                    error: 'E-mail ou senha incorretos.'
                });
            }

            return res.status(200).json(sessionData);
        } catch (err) {
            return res.status(500).json({
                error: 'Falha ao processar autenticação.'
            });
        }
    },

    async uploadAvatar(req, res) {
        if (!req.file) {
            return res.status(400).json({
                error: 'Envie um arquivo de imagem válido no campo "image".'
            });
        }

        try {
            const currentUserId = req.user.id || req.user.sub;
            const userWithAvatar = await authService.updateAvatar(currentUserId, req.file);

            return res.status(200).json({
                message: 'Foto de perfil processada e atualizada!',
                user: userWithAvatar
            });
        } catch (err) {
            return res.status(500).json({
                error: err.message || 'Não foi possível atualizar a foto de perfil.'
            });
        }
    }
};

module.exports = authController;