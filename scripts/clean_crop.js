const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '..', 'public', 'mascots', 'zodiac_sheet.png');
const outputDir = path.join(__dirname, '..', 'public', 'mascots');

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const W = this.width;
    const H = this.height;

    console.log(`Processing high-quality flood-fill extraction on ${W}x${H}...`);

    const ZODIACS = [
      ['rat', 'ox', 'tiger'],
      ['cat', 'dragon', 'snake'],
      ['horse', 'goat', 'monkey'],
      ['rooster', 'dog', 'pig']
    ];

    const rowTops = [135, 335, 535, 745];
    const rowHeights = [195, 195, 195, 205];
    const colLefts = [20, 205, 385];
    const colWidths = [180, 180, 180];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const name = ZODIACS[r][c];
        const srcX = colLefts[c];
        const srcY = rowTops[r];
        const cropW = colWidths[c];
        const cropH = rowHeights[r];

        // 1. Create sub-image
        const cell = new PNG({ width: cropW, height: cropH });
        for (let y = 0; y < cropH; y++) {
          for (let x = 0; x < cropW; x++) {
            const gx = srcX + x;
            const gy = srcY + y;
            const srcIdx = (W * gy + gx) << 2;
            const dstIdx = (cropW * y + x) << 2;
            cell.data[dstIdx] = this.data[srcIdx];
            cell.data[dstIdx + 1] = this.data[srcIdx + 1];
            cell.data[dstIdx + 2] = this.data[srcIdx + 2];
            cell.data[dstIdx + 3] = this.data[srcIdx + 3];
          }
        }

        // 2. Perform BFS Flood-Fill from the 4 outer borders ONLY
        // This ensures white pixels INSIDE the cat body are 100% PRESERVED without speckles!
        const visited = new Uint8Array(cropW * cropH);
        const queue = [];

        // Push border pixels
        for (let x = 0; x < cropW; x++) {
          queue.push([x, 0], [x, cropH - 1]);
        }
        for (let y = 0; y < cropH; y++) {
          queue.push([0, y], [cropW - 1, y]);
        }

        while (queue.length > 0) {
          const [cx, cy] = queue.pop();
          const idx = cy * cropW + cx;
          if (visited[idx]) continue;
          visited[idx] = 1;

          const pIdx = idx << 2;
          const red = cell.data[pIdx];
          const green = cell.data[pIdx + 1];
          const blue = cell.data[pIdx + 2];

          // If close to white/off-white background
          const isBackground = red > 235 && green > 235 && blue > 235;

          if (isBackground) {
            cell.data[pIdx + 3] = 0; // Set alpha to 0 (Transparent)

            // Check 4 neighbors
            if (cx > 0 && !visited[idx - 1]) queue.push([cx - 1, cy]);
            if (cx < cropW - 1 && !visited[idx + 1]) queue.push([cx + 1, cy]);
            if (cy > 0 && !visited[idx - cropW]) queue.push([cx, cy - 1]);
            if (cy < cropH - 1 && !visited[idx + cropW]) queue.push([cx, cy + 1]);
          }
        }

        // 3. Find tight bounding box of remaining non-transparent pixels
        let minX = cropW, maxX = 0, minY = cropH, maxY = 0;
        let hasContent = false;

        for (let y = 0; y < cropH; y++) {
          for (let x = 0; x < cropW; x++) {
            const idx = (y * cropW + x) << 2;
            if (cell.data[idx + 3] > 0) {
              hasContent = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (hasContent) {
          const pad = 4;
          const finalMinX = Math.max(0, minX - pad);
          const finalMaxX = Math.min(cropW - 1, maxX + pad);
          const finalMinY = Math.max(0, minY - pad);
          const finalMaxY = Math.min(cropH - 1, maxY + pad);

          const targetW = (finalMaxX - finalMinX) + 1;
          const targetH = (finalMaxY - finalMinY) + 1;

          const finalCropped = new PNG({ width: targetW, height: targetH });
          for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
              const srcIdx = (cropW * (finalMinY + y) + (finalMinX + x)) << 2;
              const dstIdx = (targetW * y + x) << 2;
              finalCropped.data[dstIdx] = cell.data[srcIdx];
              finalCropped.data[dstIdx + 1] = cell.data[srcIdx + 1];
              finalCropped.data[dstIdx + 2] = cell.data[srcIdx + 2];
              finalCropped.data[dstIdx + 3] = cell.data[srcIdx + 3];
            }
          }

          const outPath = path.join(outputDir, `${name}.png`);
          finalCropped.pack().pipe(fs.createWriteStream(outPath))
            .on('finish', () => console.log(`✓ Clean flood-fill saved: ${name}.png (${targetW}x${targetH})`));
        }
      }
    }
  });
