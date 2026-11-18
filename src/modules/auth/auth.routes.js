const { Router } = require('express');
const authController = require('./auth.controller');
const requireAuth = require('./auth.middleware');
const uploadMiddleware = require('../shared/upload.middleware');

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

authRouter.get('/me', requireAuth, authController.me);
authRouter.get('/me/activities', requireAuth, authController.listActivities);

authRouter.post(
    '/me/image',
    requireAuth,
    uploadMiddleware.single('image'),
    authController.uploadAvatar
);

module.exports = authRouter;
