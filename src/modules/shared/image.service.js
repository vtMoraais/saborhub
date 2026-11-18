const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const HttpError = require('./http-error');

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', '..', 'uploads');

const imageService = {
    async processAndSaveImage(uploadedFile, targetFolder = 'common') {
        if (!uploadedFile || !uploadedFile.buffer) {
            throw new Error('Buffer de imagem ausente para processamento.');
        }

        const destinationDir = path.join(UPLOADS_ROOT, targetFolder);
        fs.mkdirSync(destinationDir, { recursive: true });

        const outputFileName = `img_${Date.now()}_${crypto.randomUUID()}.webp`;
        const absoluteFilePath = path.join(destinationDir, outputFileName);

        try {
            await sharp(uploadedFile.buffer)
                .rotate() // respeita a orientação EXIF de fotos tiradas no celular
                .resize({
                    width: 800,
                    height: 800,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 82 })
                .toFile(absoluteFilePath);
        } catch (err) {
            throw new HttpError(400, 'O arquivo enviado não é uma imagem válida ou está corrompido.');
        }

        return `/uploads/${targetFolder}/${outputFileName}`;
    }
};

module.exports = imageService;
