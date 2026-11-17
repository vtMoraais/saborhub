const dishService = require('./dish.service');

const dishController = {
    async uploadImage(req, res) {
        const { dishId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                error: 'Arquivo de imagem obrigatório não encontrado na requisição.'
            });
        }

        try {
            const dishRecord = await dishService.updateDishImage(dishId, req.file);

            if (!dishRecord) {
                return res.status(404).json({
                    error: 'O prato especificado não foi localizado.'
                });
            }

            return res.status(200).json({
                message: 'Foto do prato otimizada e salva com sucesso!',
                dish: dishRecord
            });
        } catch (err) {
            return res.status(500).json({
                error: err.message || 'Erro ao processar a foto do prato.'
            });
        }
    }
};

module.exports = dishController;