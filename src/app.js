const express = require('express');
const cors = require('cors');
const path = require('path');

const authRouter = require('./modules/auth/auth.routes');
const restaurantRouter = require('./modules/restaurant/restaurant.routes');
const dishRouter = require('./modules/dishes/dish.routes');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Servindo arquivos estáticos (Imagens processadas e Front-end)
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const rootDir = path.resolve(__dirname, '..');

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(rootDir));

// Registro de Rotas da Arquitetura em Camadas
app.use('/auth', authRouter);
app.use('/restaurants', restaurantRouter);
app.use('/dishes', dishRouter);

module.exports = app;