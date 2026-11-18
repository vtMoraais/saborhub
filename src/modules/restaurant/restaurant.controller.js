const restaurantService = require('./restaurant.service');
const { isFilledString, parseId, parsePrice, parseRating } = require('../shared/validators');

// Erros inesperados são propagados (Express 5 captura rejeições de funções async)
// e tratados pelo middleware central em shared/error.middleware.js.
const restaurantController = {
    async list(req, res) {
        const catalog = await restaurantService.listRestaurants();
        return res.status(200).json(catalog);
    },

    async create(req, res) {
        const { name, category, rating } = req.body ?? {};

        if (!isFilledString(name) || !isFilledString(category)) {
            return res.status(400).json({
                error: 'Os campos nome e categoria são obrigatórios.'
            });
        }

        const createdRestaurant = await restaurantService.createRestaurant({
            name,
            category,
            rating: parseRating(rating),
            ownerId: req.user.id
        });

        return res.status(201).json(createdRestaurant);
    },

    async addDish(req, res) {
        const restaurantId = parseId(req.params.restaurantId, 'restaurantId');
        const { name, category, price, description } = req.body ?? {};

        if (!isFilledString(name) || !isFilledString(category) || price === undefined) {
            return res.status(400).json({
                error: 'Informe nome, categoria e preço para cadastrar o prato.'
            });
        }

        if (description !== undefined && description !== null && typeof description !== 'string') {
            return res.status(400).json({
                error: 'A descrição do prato deve ser um texto.'
            });
        }

        const createdDish = await restaurantService.createDish({
            name,
            category,
            price: parsePrice(price),
            description,
            restaurantId,
            requesterId: req.user.id
        });

        return res.status(201).json(createdDish);
    }
};

module.exports = restaurantController;
