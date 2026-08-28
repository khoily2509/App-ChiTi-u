const fs = require('fs');
const path = require('path');

const buffer = fs.readFileSync(path.join(__dirname, '..', 'public', 'mascots', 'zodiac_sheet.png'));
// PNG width at byte 16 (4 bytes), height at byte 20 (4 bytes)
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);

console.log('PNG Dimensions:', width, 'x', height);
