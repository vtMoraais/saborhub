const prisma = require('../../database/prisma');
const imageService = require('../shared/image.service');

async function attachImageToDish(dishId, imageFile) {
    const targetId = Number(dishId);

    const existingDish = await prisma.dish.findUnique({
        where: { id: targetId }
    });

    if (!existingDish) {
        return null;
    }

    const optimizedImageUrl = await imageService.processAndSaveImage(imageFile, 'dishes');

    const updatedDish = await prisma.dish.update({
        where: { id: targetId },
        data: { imageUrl: optimizedImageUrl }
    });

    return updatedDish;
}

module.exports = {
    updateDishImage: attachImageToDish
};