const dishService = require('./dish.service');
const { parseId } = require('../shared/validators');

const dishController = {
    async uploadImage(req, res) {
        const dishId = parseId(req.params.dishId, 'dishId');

        if (!req.file) {
            return res.status(400).json({
                error: 'Arquivo de imagem obrigatório não encontrado na requisição (campo "image").'
            });
        }

        const dishRecord = await dishService.updateDishImage(dishId, req.file, req.user.id);

        return res.status(200).json({
            message: 'Foto do prato otimizada e salva com sucesso!',
            dish: dishRecord
        });
    }
};

module.exports = dishController;
