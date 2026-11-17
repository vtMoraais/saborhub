const { Router } = require('express');
const restaurantController = require('./restaurant.controller');
const requireAuth = require('../auth/auth.middleware');

const restaurantRouter = Router();

restaurantRouter.get('/', restaurantController.list);
restaurantRouter.post('/', requireAuth, restaurantController.create);
restaurantRouter.post('/:restaurantId/dishes', requireAuth, restaurantController.addDish);

module.exports = restaurantRouter;