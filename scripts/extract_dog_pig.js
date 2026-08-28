const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '..', 'public', 'mascots', 'zodiac_sheet.png');
const mascotsDir = path.join(__dirname, '..', 'public', 'mascots');

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const W = this.width;
    const H = this.height;

    // Dog is row 3, col 1 (Tuất)
    // Pig is row 3, col 2 (Hợi)

    // Let's process Dog (Row 3, Col 1)
    const dogX = 205;
    const dogY = 745;
    const dogW = 180;
    const dogH = 205;

    const dogCell = new PNG({ width: dogW, height: dogH });
    for (let y = 0; y < dogH; y++) {
      for (let x = 0; x < dogW; x++) {
        const srcIdx = (W * (dogY + y) + (dogX + x)) << 2;
        const dstIdx = (dogW * y + x) << 2;

        const r = this.data[srcIdx];
        const g = this.data[srcIdx + 1];
        const b = this.data[srcIdx + 2];
        const a = this.data[srcIdx + 3];

        // Green sofa chair color is roughly (R: 40-100, G: 90-150, B: 70-130)
        const isGreenChair = (g > 80 && g > r + 15 && g > b + 10);
        const isWhiteBg = (r > 230 && g > 230 && b > 230);

        if (isGreenChair || isWhiteBg) {
          dogCell.data[dstIdx + 3] = 0;
        } else {
          dogCell.data[dstIdx] = r;
          dogCell.data[dstIdx + 1] = g;
          dogCell.data[dstIdx + 2] = b;
          dogCell.data[dstIdx + 3] = a;
        }
      }
    }

    // Process Pig (Row 3, Col 2)
    const pigX = 385;
    const pigY = 745;
    const pigW = 180;
    const pigH = 205;

    const pigCell = new PNG({ width: pigW, height: pigH });
    for (let y = 0; y < pigH; y++) {
      for (let x = 0; x < pigW; x++) {
        const srcIdx = (W * (pigY + y) + (pigX + x)) << 2;
        const dstIdx = (pigW * y + x) << 2;

        const r = this.data[srcIdx];
        const g = this.data[srcIdx + 1];
        const b = this.data[srcIdx + 2];
        const a = this.data[srcIdx + 3];

        // Burgundy sofa chair color is roughly (R: 120-180, G: 40-80, B: 60-100)
        // while pig body is light pink (R: 240-255, G: 180-220, B: 190-230)
        const isBurgundyChair = (r > 100 && r < 200 && g < 100 && b < 120);
        const isWhiteBg = (r > 230 && g > 230 && b > 230);

        if (isBurgundyChair || isWhiteBg) {
          pigCell.data[dstIdx + 3] = 0;
        } else {
          pigCell.data[dstIdx] = r;
          pigCell.data[dstIdx + 1] = g;
          pigCell.data[dstIdx + 2] = b;
          pigCell.data[dstIdx + 3] = a;
        }
      }
    }

    // Save dog.png and pig.png
    dogCell.pack().pipe(fs.createWriteStream(path.join(mascotsDir, 'dog.png')));
    pigCell.pack().pipe(fs.createWriteStream(path.join(mascotsDir, 'pig.png')));

    console.log('✓ Extracted dog and pig without sofa!');
  });
