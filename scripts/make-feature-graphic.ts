import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('docs/play-store/feature-graphic-src.png');
const OUT = path.resolve('docs/play-store/feature-graphic.png');
const W = 1024;
const H = 500;

const src = await loadImage(SRC);
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#0b1220';
ctx.fillRect(0, 0, W, H);

const scale = Math.max(W / src.width, H / src.height);
const dw = src.width * scale;
const dh = src.height * scale;
const dx = (W - dw) / 2;
const dy = (H - dh) / 2;
ctx.drawImage(src, dx, dy, dw, dh);

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, canvas.toBuffer('image/png'));
console.log(`wrote ${OUT} ${W}x${H}`);
