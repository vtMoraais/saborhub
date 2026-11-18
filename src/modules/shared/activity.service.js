const prisma = require('../../database/prisma');

/**
 * Registra uma ação do usuário na tabela Activity (trilha de auditoria).
 * Falhas no registro não devem derrubar a operação principal, por isso
 * o erro é apenas logado.
 */
async function recordActivity({ userId, action, details }) {
    try {
        await prisma.activity.create({
            data: {
                action,
                details: details ?? null,
                userId: userId ? Number(userId) : null
            }
        });
    } catch (err) {
        console.warn('[ActivityService] Não foi possível registrar atividade:', err.message);
    }
}

async function listUserActivities(userId, limit = 20) {
    return prisma.activity.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}

module.exports = {
    record: recordActivity,
    listByUser: listUserActivities
};
