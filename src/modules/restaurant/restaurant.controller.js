const restaurantService = require('./restaurant.service');

const restaurantController = {
    async list(req, res) {
        try {
            const catalog = await restaurantService.listRestaurants();
            return res.status(200).json(catalog);
        } catch (err) {
            console.error('[RestaurantController.list]', err.message);
            return res.status(500).json({
                error: 'Erro ao carregar a listagem de restaurantes.'
            });
        }
    },

    async create(req, res) {
        const { name, category, rating } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                error: 'Os campos nome e categoria são obrigatórios.'
            });
        }

        try {
            const authenticatedUserId = req.user.id || req.user.sub;

            const createdRestaurant = await restaurantService.createRestaurant({
                name,
                category,
                rating: rating ?? 5.0,
                ownerId: Number(authenticatedUserId)
            });

            return res.status(201).json(createdRestaurant);
        } catch (err) {
            console.error('[RestaurantController.create]', err.message);
            return res.status(500).json({
                error: 'Falha ao salvar o novo restaurante.'
            });
        }
    },

    async addDish(req, res) {
        const { restaurantId } = req.params;
        const { name, category, price, description } = req.body;

        if (!name || !category || price === undefined) {
            return res.status(400).json({
                error: 'Informe nome, categoria e preço para cadastrar o prato.'
            });
        }

        try {
            const createdDish = await restaurantService.createDish({
                name,
                category,
                price: parseFloat(price),
                description: description || '',
                restaurantId: parseInt(restaurantId, 10)
            });

            return res.status(201).json(createdDish);
        } catch (err) {
            console.error('[RestaurantController.addDish]', err.message);
            return res.status(500).json({
                error: 'Não foi possível vincular o prato ao restaurante informado.'
            });
        }
    }
};

module.exports = restaurantController;