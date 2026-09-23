// แก้ภาพเวกเตอร์ที่ assets/brand.svg แล้วรัน npm run icons
import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const svg = await readFile(new URL('../assets/brand.svg', import.meta.url), 'utf8');
for (const [file, size] of [
  ['brand-icon.png', 1024],
  ['brand-favicon.png', 64],
]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(new URL(`../assets/${file}`, import.meta.url), png);
}
