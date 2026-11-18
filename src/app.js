const express = require('express');
const cors = require('cors');
const path = require('path');

const authRouter = require('./modules/auth/auth.routes');
const restaurantRouter = require('./modules/restaurant/restaurant.routes');
const dishRouter = require('./modules/dishes/dish.routes');
const { notFoundHandler, errorHandler } = require('./modules/shared/error.middleware');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Arquivos estáticos: apenas as imagens processadas e a página do front-end.
// (Servir a raiz inteira do projeto exporia o código-fonte da API.)
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const frontEndFile = path.resolve(__dirname, '..', 'index.html');

app.use('/uploads', express.static(uploadsDir));
app.get(['/', '/index.html'], (req, res) => res.sendFile(frontEndFile));

// Registro de Rotas da Arquitetura em Camadas
app.use('/auth', authRouter);
app.use('/restaurants', restaurantRouter);
app.use('/dishes', dishRouter);

// Rotas inexistentes e tratamento central de erros (sempre por último)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
