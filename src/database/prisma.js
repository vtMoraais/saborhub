const { PrismaClient } = require('@prisma/client');

const dbClient = new PrismaClient({
    log: ['error', 'warn']
});

module.exports = dbClient;