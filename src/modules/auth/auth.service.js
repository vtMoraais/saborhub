const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../database/prisma');
const imageService = require('../shared/image.service');

const SALT_ROUNDS = 10;

async function registerUser({ name, email, password }) {
    const encryptedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const createdUser = await prisma.user.create({
        data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: encryptedPassword
        },
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
        }
    });

    return createdUser;
}

async function authenticateUser({ email, password }) {
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!existingUser) {
        return null;
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
        return null;
    }

    const secretKey = process.env.JWT_SECRET || 'fallback_secret_key';
    const accessToken = jwt.sign(
        {
            sub: existingUser.id,
            id: existingUser.id,
            email: existingUser.email
        },
        secretKey,
        { expiresIn: '24h' }
    );

    return {
        token: accessToken,
        user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            avatarUrl: existingUser.avatarUrl
        }
    };
}

async function updateProfileImage(userId, imageFile) {
    const savedImageUrl = await imageService.processAndSaveImage(imageFile, 'avatars');

    const updatedRecord = await prisma.user.update({
        where: { id: Number(userId) },
        data: { avatarUrl: savedImageUrl },
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
        }
    });

    return updatedRecord;
}

module.exports = {
    register: registerUser,
    login: authenticateUser,
    updateAvatar: updateProfileImage
};