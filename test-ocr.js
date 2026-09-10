const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { createWorker } = require('tesseract.js');

const dir = 'C:/Users/ChrisPC/Pictures/Screenshots/';
const files = fs.readdirSync(dir);
const match = files.find(f => f.includes('154535')); // This is the input image shown in the latest run
const fullPath = path.join(dir, match);
console.log('Testing image:', fullPath);
const buf = fs.readFileSync(fullPath);

let width = buf.readUInt32BE(16);
let height = buf.readUInt32BE(20);

let pos = 8;
let idats = [];
while (pos < buf.length) {
  let len = buf.readUInt32BE(pos);
  let type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idats.push(buf.slice(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
let compressed = Buffer.concat(idats);
let uncompressed = zlib.inflateSync(compressed);

let raw = Buffer.alloc(width * height * 4);
let lineSize = width * 4;
let prevLine = Buffer.alloc(lineSize);

let srcPos = 0;
for (let y = 0; y < height; y++) {
  let filter = uncompressed[srcPos++];
  let line = uncompressed.slice(srcPos, srcPos + lineSize);
  srcPos += lineSize;
  for (let i = 0; i < lineSize; i++) {
    let val = line[i];
    let left = (i >= 4) ? raw[y * lineSize + i - 4] : 0;
    let up = prevLine[i];
    let corner = (i >= 4) ? prevLine[i - 4] : 0;
    if (filter === 1) val = (val + left) & 0xff;
    else if (filter === 2) val = (val + up) & 0xff;
    else if (filter === 3) val = (val + Math.floor((left + up) / 2)) & 0xff;
    else if (filter === 4) {
      let p = left + up - corner;
      let pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - corner);
      let pr = (pa <= pb && pa <= pc) ? left : (pb <= pc ? up : corner);
      val = (val + pr) & 0xff;
    }
    raw[y * lineSize + i] = val;
  }
  prevLine = raw.slice(y * lineSize, (y + 1) * lineSize);
}

let isDarkPixel = (x, y) => {
  let idx = (y * width + x) * 4;
  let r = raw[idx], g = raw[idx+1], b = raw[idx+2];
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150;
};

let rowDarkCounts = [];
for (let y = 0; y < height; y++) {
  let count = 0;
  for (let x = 0; x < width; x++) if (isDarkPixel(x, y)) count++;
  rowDarkCounts.push({ y, count });
}

let colDarkCounts = [];
for (let x = 0; x < width; x++) {
  let count = 0;
  for (let y = 0; y < height; y++) if (isDarkPixel(x, y)) count++;
  colDarkCounts.push({ x, count });
}

let topY = rowDarkCounts.findIndex(r => r.count > width * 0.4);
let bottomY = rowDarkCounts.length - 1 - [...rowDarkCounts].reverse().findIndex(r => r.count > width * 0.4);
let leftX = colDarkCounts.findIndex(c => c.count > height * 0.4);
let rightX = colDarkCounts.length - 1 - [...colDarkCounts].reverse().findIndex(c => c.count > height * 0.4);

console.log('Grid lines:', { leftX, topY, rightX, bottomY });

let gridW = rightX - leftX;
let gridH = bottomY - topY;
let cellW = gridW / 9;
let cellH = gridH / 9;

function makeBmpBuffer(pixels, w, h) {
  let headerSize = 54;
  let rowSize = Math.floor((24 * w + 31) / 32) * 4;
  let pixelArraySize = rowSize * h;
  let fileSize = headerSize + pixelArraySize;

  let buf = Buffer.alloc(fileSize);
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(headerSize, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(w, 18);
  buf.writeInt32LE(h, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let srcIdx = ((h - 1 - y) * w + x) * 4;
      let dstIdx = headerSize + y * rowSize + x * 3;
      buf[dstIdx] = pixels[srcIdx + 2];
      buf[dstIdx + 1] = pixels[srcIdx + 1];
      buf[dstIdx + 2] = pixels[srcIdx];
    }
  }
  return buf;
}

(async () => {
  let worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: '123456789',
    tessedit_pageseg_mode: '10'
  });

  let grid = Array.from({length: 9}, () => Array(9).fill(0));

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let cellX = leftX + c * cellW + cellW * 0.18;
      let cellY = topY + r * cellH + cellH * 0.18;
      let w = Math.floor(cellW * 0.64);
      let h = Math.floor(cellH * 0.64);

      let localMin = 255, localMax = 0;
      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          let px = Math.floor(cellX + ix);
          let py = Math.floor(cellY + iy);
          let idx = (py * width + px) * 4;
          let lum = 0.299 * raw[idx] + 0.587 * raw[idx+1] + 0.114 * raw[idx+2];
          if (lum < localMin) localMin = lum;
          if (lum > localMax) localMax = lum;
        }
      }

      let cellPixels = Buffer.alloc(w * h * 4);
      let darkCount = 0;

      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          let px = Math.floor(cellX + ix);
          let py = Math.floor(cellY + iy);
          let idx = (py * width + px) * 4;
          let lum = 0.299 * raw[idx] + 0.587 * raw[idx+1] + 0.114 * raw[idx+2];

          let dstIdx = (iy * w + ix) * 4;
          let isDark = false;
          if (localMax - localMin > 30) {
            let normalized = ((lum - localMin) / (localMax - localMin)) * 255;
            isDark = normalized < 140;
          }

          let val = isDark ? 0 : 255;
          cellPixels[dstIdx] = val;
          cellPixels[dstIdx+1] = val;
          cellPixels[dstIdx+2] = val;
          cellPixels[dstIdx+3] = 255;
          if (isDark) darkCount++;
        }
      }

      if (darkCount > 15) {
        // Upscale cell image to 100x100 with padding
        let uw = 100, uh = 100;
        let upscaled = Buffer.alloc(uw * uh * 4, 255);
        let tx = 15, ty = 15, tw = 70, th = 70;

        for (let uy = 0; uy < uh; uy++) {
          for (let ux = 0; ux < uw; ux++) {
            let dstIdx = (uy * uw + ux) * 4;
            if (ux >= tx && ux < tx + tw && uy >= ty && uy < ty + th) {
              let srcX = Math.floor((ux - tx) / tw * w);
              let srcY = Math.floor((uy - ty) / th * h);
              let srcIdx = (srcY * w + srcX) * 4;
              upscaled[dstIdx] = cellPixels[srcIdx];
              upscaled[dstIdx+1] = cellPixels[srcIdx+1];
              upscaled[dstIdx+2] = cellPixels[srcIdx+2];
            }
          }
        }

        let bmpBuf = makeBmpBuffer(upscaled, uw, uh);
        let { data } = await worker.recognize(bmpBuf);
        let text = data.text.trim();
        let val = parseInt(text, 10);
        if (isNaN(val)) {
          let sym = data.symbols?.[0]?.text?.trim();
          if (sym) val = parseInt(sym, 10);
        }

        if (!isNaN(val) && val >= 1 && val <= 9) {
          grid[r][c] = val;
        } else {
          console.log(`Cell (${r}, ${c}) failed to recognize: "${text}" (darkCount: ${darkCount})`);
        }
      }
    }
  }

  await worker.terminate();
  console.log('RECOGNIZED GRID:');
  grid.forEach((row, i) => console.log('Row ' + i + ':', row.join(' ')));
})();
