const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const imageService = {
    async processAndSaveImage(uploadedFile, targetFolder = 'common') {
        if (!uploadedFile || !uploadedFile.buffer) {
            throw new Error('Buffer de imagem ausente para processamento.');
        }

        const destinationDir = path.resolve(__dirname, '..', '..', '..', 'uploads', targetFolder);

        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }

        const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 999999)}`;
        const outputFileName = `img_${uniqueSuffix}.webp`;
        const absoluteFilePath = path.join(destinationDir, outputFileName);

        await sharp(uploadedFile.buffer)
            .resize({
                width: 800,
                height: 800,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 82 })
            .toFile(absoluteFilePath);

        return `/uploads/${targetFolder}/${outputFileName}`;
    }
};

module.exports = imageService;