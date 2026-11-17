const { Router } = require('express');
const authController = require('./auth.controller');
const requireAuth = require('./auth.middleware');
const uploadMiddleware = require('../shared/upload.middleware');

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

authRouter.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({
        authenticated: true,
        user: req.user
    });
});

authRouter.post(
    '/me/image',
    requireAuth,
    uploadMiddleware.single('image'),
    authController.uploadAvatar
);

module.exports = authRouter;