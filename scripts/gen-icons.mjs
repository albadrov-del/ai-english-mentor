// Generates the PWA icons (a simple robot face on a blue background) as PNGs,
// with a tiny hand-rolled PNG encoder — no image libraries. Re-run: `node scripts/gen-icons.mjs`.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/icons/', import.meta.url));

const BLUE = [31, 111, 235, 255];
const LIGHT = [238, 242, 247, 255];

function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = Math.round(y0 * size); y < Math.round(y1 * size); y++) {
      for (let x = Math.round(x0 * size); x < Math.round(x1 * size); x++) {
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const i = (y * size + x) * 4;
        rgba[i] = c[0];
        rgba[i + 1] = c[1];
        rgba[i + 2] = c[2];
        rgba[i + 3] = c[3];
      }
    }
  };
  rect(0, 0, 1, 1, BLUE); // background
  rect(0.46, 0.14, 0.54, 0.24, LIGHT); // antenna stalk
  rect(0.43, 0.1, 0.57, 0.16, LIGHT); // antenna tip
  rect(0.2, 0.24, 0.8, 0.72, LIGHT); // head
  rect(0.32, 0.38, 0.44, 0.5, BLUE); // left eye
  rect(0.56, 0.38, 0.68, 0.5, BLUE); // right eye
  rect(0.36, 0.58, 0.64, 0.65, BLUE); // mouth
  return rgba;
}

// --- minimal PNG encoder (RGBA, 8-bit) ---
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(new URL(`icon-${size}.png`, `file://${OUT}`), encodePng(size, makeIcon(size)));
  console.log(`wrote icon-${size}.png`);
}
