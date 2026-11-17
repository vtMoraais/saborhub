const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./src/app');
const imageService = require('./src/modules/shared/image.service');

test('Arquitetura em Camadas - Rotas protegidas devem exigir token JWT', async (t) => {
    const server = app.listen(0);
    const { port } = server.address();
    const baseUrl = `http://localhost:${port}`;

    try {
        // 1. Tentar criar restaurante sem JWT deve retornar 401
        const resUnauth = await fetch(`${baseUrl}/restaurants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Bistrô Central', category: 'Italiana' })
        });
        assert.equal(resUnauth.status, 401);

        // 2. Tentar upload de avatar sem JWT deve retornar 401
        const resAvatarUnauth = await fetch(`${baseUrl}/auth/me/image`, {
            method: 'POST'
        });
        assert.equal(resAvatarUnauth.status, 401);

        // 3. ImageService deve rejeitar chamada sem buffer de arquivo
        await assert.rejects(
            async () => {
                await imageService.processAndSaveImage(null, 'avatars');
            },
            { message: 'Buffer de imagem ausente para processamento.' }
        );
    } finally {
        server.close();
    }
});