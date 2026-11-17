const { Router } = require('express');
const dishController = require('./dish.controller');
const requireAuth = require('../auth/auth.middleware');
const uploadMiddleware = require('../shared/upload.middleware');

const dishRouter = Router();

dishRouter.post(
    '/:dishId/image',
    requireAuth,
    uploadMiddleware.single('image'),
    dishController.uploadImage
);

module.exports = dishRouter;