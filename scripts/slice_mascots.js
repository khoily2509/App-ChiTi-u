const fs = require('fs');
const path = require('path');

async function sliceMascots() {
  try {
    const sharp = require('sharp');
    const inputPath = path.join(__dirname, 'public', 'mascots', 'zodiac_sheet.png');
    const outputDir = path.join(__dirname, 'public', 'mascots');

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    console.log('Image dimensions:', metadata.width, 'x', metadata.height);

    const W = metadata.width;
    const H = metadata.height;

    // 3 columns x 4 rows
    // Row 0: Rat (Tí), Ox (Sửu), Tiger (Dần)
    // Row 1: Cat (Mão), Dragon (Thìn), Snake (Tỵ)
    // Row 2: Horse (Ngọ), Goat (Mùi), Monkey (Thân)
    // Row 3: Rooster (Dậu), Dog (Tuất), Pig (Hợi)

    const ZODIACS = [
      ['rat', 'ox', 'tiger'],
      ['cat', 'dragon', 'snake'],
      ['horse', 'goat', 'monkey'],
      ['rooster', 'dog', 'pig']
    ];

    // Calculate grid coordinates based on actual image
    const colWidth = Math.floor(W / 3);
    const rowHeight = Math.floor(H / 4);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const name = ZODIACS[r][c];
        const left = Math.max(0, c * colWidth);
        const top = Math.max(0, r * rowHeight);
        const width = Math.min(colWidth, W - left);
        const height = Math.min(rowHeight, H - top);

        const outPath = path.join(outputDir, `${name}.png`);
        await sharp(inputPath)
          .extract({ left, top, width, height })
          .trim() // trim whitespace to get perfect tight bounding box
          .toFile(outPath);
        
        console.log(`Saved ${name}.png`);
      }
    }
    console.log('All 12 Zodiac mascots sliced successfully!');
  } catch (err) {
    console.error('Error slicing:', err);
  }
}

sliceMascots();
