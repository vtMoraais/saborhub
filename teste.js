require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_apenas_para_testes';

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');

const app = require('./src/app');
const prisma = require('./src/database/prisma');
const imageService = require('./src/modules/shared/image.service');

// Sem cache, o Sharp não mantém arquivos abertos (no Windows isso impede apagá-los)
sharp.cache(false);

const createdFiles = [];

let server;
let baseUrl;

function signTestToken(userId = 999999) {
    return jwt.sign({ email: 'teste@saborhub.local' }, process.env.JWT_SECRET, {
        subject: String(userId),
        expiresIn: '5m'
    });
}

function authHeaders(token, extra = {}) {
    return { Authorization: `Bearer ${token}`, ...extra };
}

async function postJson(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    return { status: res.status, body: await res.json() };
}

async function uploadFile(url, token, buffer, mimeType, fileName) {
    const form = new FormData();
    form.append('image', new Blob([buffer], { type: mimeType }), fileName);
    const res = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: authHeaders(token),
        body: form
    });
    return { status: res.status, body: await res.json() };
}

function sampleImage(width = 1200, height = 900) {
    return sharp({
        create: { width, height, channels: 3, background: '#e85d04' }
    }).png().toBuffer();
}

function trackUpload(publicUrl) {
    if (publicUrl) createdFiles.push(path.join(__dirname, publicUrl));
}

before(() => {
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
    server.closeAllConnections(); // encerra conexões keep-alive abertas pelo fetch
    server.close();
    await prisma.$disconnect();

    for (const file of createdFiles) {
        try {
            fs.rmSync(file, { force: true });
        } catch (err) {
            console.warn(`Não foi possível remover ${file}: ${err.message}`);
        }
    }
});

// ---------------------------------------------------------------------------
// Testes que NÃO dependem do banco de dados
// ---------------------------------------------------------------------------
describe('Autenticação JWT', () => {
    test('rotas protegidas exigem token', async () => {
        const createRes = await postJson('/restaurants', { name: 'Bistrô Central', category: 'Italiana' });
        assert.equal(createRes.status, 401);

        const avatarRes = await fetch(`${baseUrl}/auth/me/image`, { method: 'POST' });
        assert.equal(avatarRes.status, 401);
    });

    test('token inválido ou assinado com outro segredo é rejeitado', async () => {
        const forged = jwt.sign({ email: 'x@x.com' }, 'outro_segredo', { subject: '1' });
        const res = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders(forged) });
        assert.equal(res.status, 401);

        const garbage = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders('abc.def.ghi') });
        assert.equal(garbage.status, 401);
    });

    test('GET /auth/me devolve os dados do token', async () => {
        const res = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders(signTestToken(42)) });
        const body = await res.json();
        assert.equal(res.status, 200);
        assert.equal(body.user.id, 42);
    });
});

describe('Validação de entrada', () => {
    const token = signTestToken();

    test('cadastro exige nome, e-mail válido e senha de 6+ caracteres', async () => {
        assert.equal((await postJson('/auth/register', { email: 'a@b.com' })).status, 400);
        assert.equal((await postJson('/auth/register', { name: 'Ana', email: 'invalido', password: '123456' })).status, 400);
        assert.equal((await postJson('/auth/register', { name: 'Ana', email: 'a@b.com', password: '123' })).status, 400);
        assert.equal((await postJson('/auth/register', { name: 'Ana', email: 123, password: '123456' })).status, 400);
    });

    test('restaurante exige nome/categoria e avaliação entre 0 e 5', async () => {
        assert.equal((await postJson('/restaurants', { name: 'Sem categoria' }, token)).status, 400);

        const badRating = await postJson('/restaurants', { name: 'X', category: 'Pizza', rating: 9 }, token);
        assert.equal(badRating.status, 400);
        assert.match(badRating.body.error, /entre 0 e 5/);
    });

    test('prato exige id numérico e preço válido', async () => {
        const badId = await postJson('/restaurants/abc/dishes', { name: 'X', category: 'Y', price: 10 }, token);
        assert.equal(badId.status, 400);

        const badPrice = await postJson('/restaurants/1/dishes', { name: 'X', category: 'Y', price: 'abc' }, token);
        assert.equal(badPrice.status, 400);

        const negative = await postJson('/restaurants/1/dishes', { name: 'X', category: 'Y', price: -5 }, token);
        assert.equal(negative.status, 400);
    });

    test('JSON malformado retorna 400 em JSON', async () => {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{ "email": '
        });
        assert.equal(res.status, 400);
        assert.ok((await res.json()).error);
    });
});

describe('Upload de imagens (Multer)', () => {
    const token = signTestToken();

    test('rejeita tipo de arquivo não suportado com 400', async () => {
        const res = await uploadFile('/dishes/1/image', token, Buffer.from('texto'), 'text/plain', 'a.txt');
        assert.equal(res.status, 400);
        assert.match(res.body.error, /JPEG, PNG ou WebP/);
    });

    test('rejeita arquivo acima de 4 MB com 413', async () => {
        const big = Buffer.alloc(4 * 1024 * 1024 + 10);
        const res = await uploadFile('/dishes/1/image', token, big, 'image/png', 'grande.png');
        assert.equal(res.status, 413);
    });

    test('rejeita requisição sem arquivo com 400', async () => {
        const res = await fetch(`${baseUrl}/dishes/1/image`, {
            method: 'POST',
            headers: authHeaders(token)
        });
        assert.equal(res.status, 400);
    });
});

describe('ImageService (Sharp)', () => {
    test('rejeita chamada sem buffer', async () => {
        await assert.rejects(
            () => imageService.processAndSaveImage(null, 'avatars'),
            { message: 'Buffer de imagem ausente para processamento.' }
        );
    });

    test('rejeita buffer que não é imagem com status 400', async () => {
        await assert.rejects(
            () => imageService.processAndSaveImage({ buffer: Buffer.from('nao sou imagem') }, 'testes'),
            (err) => err.status === 400
        );
    });

    test('converte para WebP e limita a 800px', async () => {
        const publicUrl = await imageService.processAndSaveImage({ buffer: await sampleImage() }, 'testes');
        trackUpload(publicUrl);

        assert.match(publicUrl, /^\/uploads\/testes\/img_.+\.webp$/);
        const meta = await sharp(fs.readFileSync(path.join(__dirname, publicUrl))).metadata();
        assert.equal(meta.format, 'webp');
        assert.equal(meta.width, 800);
        assert.equal(meta.height, 600);
    });
});

describe('Segurança dos arquivos estáticos', () => {
    test('front-end é servido em /', async () => {
        const res = await fetch(`${baseUrl}/`);
        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type'), /text\/html/);
    });

    test('código-fonte e configuração não são expostos', async () => {
        for (const file of ['/src/app.js', '/package.json', '/prisma/schema.prisma', '/.env']) {
            const res = await fetch(`${baseUrl}${file}`);
            assert.equal(res.status, 404, `${file} não deveria estar acessível`);
        }
    });
});

// ---------------------------------------------------------------------------
// Testes de integração: rodam somente se houver um PostgreSQL acessível
// (DATABASE_URL do .env com as migrations aplicadas).
// ---------------------------------------------------------------------------
describe('Integração com PostgreSQL', async () => {
    let databaseAvailable = false;
    try {
        await prisma.$queryRaw`SELECT 1`;
        await prisma.user.count();
        databaseAvailable = true;
    } catch {
        databaseAvailable = false;
    }

    const skip = databaseAvailable ? false : 'banco indisponível — rode "docker compose up -d" e "npm run db:migrate"';
    const suffix = Date.now();
    const owner = { name: 'Dono Teste', email: `dono_${suffix}@saborhub.test`, password: 'senha123' };
    const intruder = { name: 'Outro Teste', email: `outro_${suffix}@saborhub.test`, password: 'senha123' };
    const state = {};

    after(async () => {
        if (!databaseAvailable) return;
        const users = await prisma.user.findMany({
            where: { email: { in: [owner.email, intruder.email] } },
            select: { id: true }
        });
        const ids = users.map((u) => u.id);
        await prisma.activity.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
    });

    test('cadastro, e-mail duplicado e login', { skip }, async () => {
        const created = await postJson('/auth/register', owner);
        assert.equal(created.status, 201);
        assert.equal(created.body.password, undefined, 'a senha não pode ser devolvida');

        assert.equal((await postJson('/auth/register', owner)).status, 409);
        await postJson('/auth/register', intruder);

        assert.equal((await postJson('/auth/login', { ...owner, password: 'errada' })).status, 401);

        const login = await postJson('/auth/login', owner);
        assert.equal(login.status, 200);
        state.ownerToken = login.body.token;
        state.intruderToken = (await postJson('/auth/login', intruder)).body.token;
    });

    test('criação e listagem de restaurantes', { skip }, async () => {
        const created = await postJson('/restaurants', { name: 'Cantina Teste', category: 'Italiana', rating: 4.7 }, state.ownerToken);
        assert.equal(created.status, 201);
        assert.equal(Number(created.body.rating), 4.7);
        state.restaurantId = created.body.id;

        const list = await (await fetch(`${baseUrl}/restaurants`)).json();
        assert.ok(list.some((r) => r.id === state.restaurantId));
    });

    test('somente o dono pode cadastrar pratos', { skip }, async () => {
        const dish = { name: 'Lasanha', category: 'Massas', price: 49.9 };

        const forbidden = await postJson(`/restaurants/${state.restaurantId}/dishes`, dish, state.intruderToken);
        assert.equal(forbidden.status, 403);

        const notFound = await postJson('/restaurants/999999999/dishes', dish, state.ownerToken);
        assert.equal(notFound.status, 404);

        const created = await postJson(`/restaurants/${state.restaurantId}/dishes`, dish, state.ownerToken);
        assert.equal(created.status, 201);
        state.dishId = created.body.id;
    });

    test('upload de foto do prato e avatar', { skip }, async () => {
        const image = await sampleImage();

        const forbidden = await uploadFile(`/dishes/${state.dishId}/image`, state.intruderToken, image, 'image/png', 'p.png');
        assert.equal(forbidden.status, 403);

        const dishRes = await uploadFile(`/dishes/${state.dishId}/image`, state.ownerToken, image, 'image/png', 'p.png');
        assert.equal(dishRes.status, 200);
        trackUpload(dishRes.body.dish.imageUrl);

        const served = await fetch(`${baseUrl}${dishRes.body.dish.imageUrl}`);
        assert.equal(served.status, 200);

        const avatarRes = await uploadFile('/auth/me/image', state.ownerToken, image, 'image/png', 'a.png');
        assert.equal(avatarRes.status, 200);
        trackUpload(avatarRes.body.user.avatarUrl);
    });

    test('atividades do usuário são registradas', { skip }, async () => {
        const res = await fetch(`${baseUrl}/auth/me/activities`, { headers: authHeaders(state.ownerToken) });
        const actions = (await res.json()).map((a) => a.action);
        assert.equal(res.status, 200);
        for (const expected of ['USER_REGISTERED', 'RESTAURANT_CREATED', 'DISH_CREATED', 'DISH_IMAGE_UPDATED', 'AVATAR_UPDATED']) {
            assert.ok(actions.includes(expected), `atividade ${expected} ausente`);
        }
    });
});
