const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../database/prisma');
const imageService = require('../shared/image.service');
const activityService = require('../shared/activity.service');
const HttpError = require('../shared/http-error');
const { getJwtSecret } = require('../../config/env');

const SALT_ROUNDS = 10;

const PUBLIC_USER_FIELDS = {
    id: true,
    name: true,
    email: true,
    avatarUrl: true
};

async function registerUser({ name, email, password }) {
    const encryptedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const createdUser = await prisma.user.create({
        data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: encryptedPassword
        },
        select: PUBLIC_USER_FIELDS
    });

    await activityService.record({
        userId: createdUser.id,
        action: 'USER_REGISTERED',
        details: `Usuário ${createdUser.email} cadastrado.`
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

    // Pelo padrão JWT (RFC 7519) o "sub" deve ser uma string
    const accessToken = jwt.sign(
        { email: existingUser.email },
        getJwtSecret(),
        { subject: String(existingUser.id), expiresIn: '24h' }
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
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
        throw new HttpError(404, 'O usuário deste token não foi encontrado.');
    }

    const savedImageUrl = await imageService.processAndSaveImage(imageFile, 'avatars');

    const updatedRecord = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: savedImageUrl },
        select: PUBLIC_USER_FIELDS
    });

    await activityService.record({
        userId,
        action: 'AVATAR_UPDATED',
        details: savedImageUrl
    });

    return updatedRecord;
}

module.exports = {
    register: registerUser,
    login: authenticateUser,
    updateAvatar: updateProfileImage
};
