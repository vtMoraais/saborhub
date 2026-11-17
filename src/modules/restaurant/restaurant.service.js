const prisma = require('../../database/prisma');

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
    return prisma.restaurant.create({
        data: {
            name: name.trim(),
            category: category.trim(),
            rating: rating !== undefined ? Number(rating) : 5.0,
            ownerId: Number(ownerId)
        }
    });
}

async function insertDishForRestaurant({ name, category, price, description, restaurantId }) {
    return prisma.dish.create({
        data: {
            name: name.trim(),
            category: category.trim(),
            price: Number(price),
            description: description ? description.trim() : '',
            restaurantId: Number(restaurantId)
        }
    });
}

module.exports = {
    listRestaurants: fetchAllRestaurants,
    createRestaurant: insertRestaurant,
    createDish: insertDishForRestaurant
};