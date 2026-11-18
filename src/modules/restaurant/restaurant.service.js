const prisma = require('../../database/prisma');
const activityService = require('../shared/activity.service');
const HttpError = require('../shared/http-error');

async function fetchAllRestaurants() {
    return prisma.restaurant.findMany({
        include: {
            dishes: true
        },
        orderBy: {
            id: 'desc'
        }
    });
}

async function insertRestaurant({ name, category, rating, ownerId }) {
    const createdRestaurant = await prisma.restaurant.create({
        data: {
            name: name.trim(),
            category: category.trim(),
            rating,
            ownerId
        }
    });

    await activityService.record({
        userId: ownerId,
        action: 'RESTAURANT_CREATED',
        details: `Restaurante #${createdRestaurant.id} "${createdRestaurant.name}" criado.`
    });

    return createdRestaurant;
}

async function insertDishForRestaurant({ name, category, price, description, restaurantId, requesterId }) {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
    });

    if (!restaurant) {
        throw new HttpError(404, 'O restaurante informado não foi localizado.');
    }

    // Apenas o dono do restaurante pode alterar o cardápio
    if (restaurant.ownerId !== requesterId) {
        throw new HttpError(403, 'Apenas o dono do restaurante pode cadastrar pratos nele.');
    }

    const createdDish = await prisma.dish.create({
        data: {
            name: name.trim(),
            category: category.trim(),
            price,
            description: description ? description.trim() : '',
            restaurantId
        }
    });

    await activityService.record({
        userId: requesterId,
        action: 'DISH_CREATED',
        details: `Prato #${createdDish.id} "${createdDish.name}" adicionado ao restaurante #${restaurantId}.`
    });

    return createdDish;
}

module.exports = {
    listRestaurants: fetchAllRestaurants,
    createRestaurant: insertRestaurant,
    createDish: insertDishForRestaurant
};
