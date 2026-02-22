import fs from 'fs';

function getPngDimensions(filePath) {
    const buffer = fs.readFileSync(filePath);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

const files = [
    'mobile/assets/images/logo.png',
    'mobile/assets/images/splash_logo.png',
    'mobile/assets/images/adaptive-icon.png',
    'mobile/assets/images/icon.png',
    'public/zimaio-logo.png',
    'public/zimaio_mineral_edition,_no_background_v1.2.png'
];

files.forEach(file => {
    try {
        const dims = getPngDimensions(file);
        console.log(`${file}: ${dims.width}x${dims.height}`);
    } catch (e) {
        console.log(`${file}: Error ${e.message}`);
    }
});
