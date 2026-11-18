require('dotenv').config();
const { assertRequiredEnv } = require('./src/config/env');

try {
    assertRequiredEnv();
} catch (err) {
    console.error(`[SaborHub API] ${err.message}`);
    process.exit(1);
}

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[SaborHub API] Servidor inicializado com sucesso em http://localhost:${PORT}`);
});
