const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const brainDir = path.join('C:', 'Users', 'Uyen Lam', '.gemini', 'antigravity', 'brain', '15e966ca-0946-40a8-b7f7-8b29bcc95e82');
const mascotsDir = path.join(__dirname, '..', 'public', 'mascots');

const dynamicMappings = [
  { id: 'rat', searchPrefix: 'rat_bill' },
  { id: 'ox', searchPrefix: 'ox_chef' },
  { id: 'tiger', searchPrefix: 'tiger_coffee' },
  { id: 'dragon', searchPrefix: 'dragon_redpocket' },
  { id: 'snake', searchPrefix: 'snake_calc' },
  { id: 'horse', searchPrefix: 'horse_sports' },
  { id: 'goat', searchPrefix: 'goat_ukulele' },
  { id: 'monkey', searchPrefix: 'monkey_banana' },
];

function findLatestFile(prefix) {
  const files = fs.readdirSync(brainDir).filter(f => f.startsWith(prefix) && f.endsWith('.jpg'));
  if (files.length === 0) return null;
  files.sort((a, b) => fs.statSync(path.join(brainDir, b)).mtimeMs - fs.statSync(path.join(brainDir, a)).mtimeMs);
  return path.join(brainDir, files[0]);
}

for (const item of dynamicMappings) {
  const jpgPath = findLatestFile(item.searchPrefix);
  if (!jpgPath || !fs.existsSync(jpgPath)) {
    console.log(`Missing image for ${item.id}`);
    continue;
  }

  const jpegData = fs.readFileSync(jpgPath);
  const rawData = jpeg.decode(jpegData, { useTArray: true });
  const W = rawData.width;
  const H = rawData.height;

  const png = new PNG({ width: W, height: H });

  for (let i = 0; i < rawData.data.length; i++) {
    png.data[i] = rawData.data[i];
  }

  // Flood fill outer white/light grey background
  const visited = new Uint8Array(W * H);
  const queue = [];

  for (let x = 0; x < W; x++) {
    queue.push([x, 0], [x, H - 1]);
  }
  for (let y = 0; y < H; y++) {
    queue.push([0, y], [W - 1, y]);
  }

  while (queue.length > 0) {
    const [cx, cy] = queue.pop();
    const idx = cy * W + cx;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pIdx = idx << 2;
    const r = png.data[pIdx];
    const g = png.data[pIdx + 1];
    const b = png.data[pIdx + 2];

    const isBg = (r > 215 && g > 215 && b > 215);

    if (isBg) {
      png.data[pIdx + 3] = 0;

      if (cx > 0 && !visited[idx - 1]) queue.push([cx - 1, cy]);
      if (cx < W - 1 && !visited[idx + 1]) queue.push([cx + 1, cy]);
      if (cy > 0 && !visited[idx - W]) queue.push([cx, cy - 1]);
      if (cy < H - 1 && !visited[idx + W]) queue.push([cx, cy + 1]);
    }
  }

  // 2 passes of border de-fringing
  for (let pass = 0; pass < 2; pass++) {
    const toClear = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (W * y + x) << 2;
        if (png.data[idx + 3] === 0) continue;

        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        let touchesAlpha = false;
        const neighbors = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) {
            touchesAlpha = true;
            break;
          }
          const nIdx = (W * ny + nx) << 2;
          if (png.data[nIdx + 3] === 0) {
            touchesAlpha = true;
            break;
          }
        }

        if (touchesAlpha) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 140) {
            toClear.push(idx);
          }
        }
      }
    }

    for (const idx of toClear) {
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0;
    }
  }

  const outPath = path.join(mascotsDir, `${item.id}.png`);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Processed & De-fringed: ${item.id}.png`);
}
