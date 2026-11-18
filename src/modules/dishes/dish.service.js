const prisma = require('../../database/prisma');
const imageService = require('../shared/image.service');
const activityService = require('../shared/activity.service');
const HttpError = require('../shared/http-error');

async function attachImageToDish(dishId, imageFile, requesterId) {
    const existingDish = await prisma.dish.findUnique({
        where: { id: dishId },
        include: { restaurant: { select: { ownerId: true } } }
    });

    if (!existingDish) {
        throw new HttpError(404, 'O prato especificado não foi localizado.');
    }

    // Apenas o dono do restaurante pode alterar a foto do prato
    if (existingDish.restaurant.ownerId !== requesterId) {
        throw new HttpError(403, 'Apenas o dono do restaurante pode alterar a foto deste prato.');
    }

    const optimizedImageUrl = await imageService.processAndSaveImage(imageFile, 'dishes');

    const updatedDish = await prisma.dish.update({
        where: { id: dishId },
        data: { imageUrl: optimizedImageUrl }
    });

    await activityService.record({
        userId: requesterId,
        action: 'DISH_IMAGE_UPDATED',
        details: `Prato #${dishId}: ${optimizedImageUrl}`
    });

    return updatedDish;
}

module.exports = {
    updateDishImage: attachImageToDish
};
