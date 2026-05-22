import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const SRC = 'C:/Users/msi/proyectos/tp-bd-neo4j/pictures/sequence';
const DST = 'C:/Users/msi/proyectos/tp-bd-neo4j/public/sequence';

const files = (await readdir(SRC)).filter(f => f.endsWith('.png')).sort();
console.log(`Converting ${files.length} frames...`);

let done = 0;
const BATCH = 10;
for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  await Promise.all(batch.map(async f => {
    const name = f.replace('.png', '.webp');
    await sharp(join(SRC, f))
      .resize({ width: 1440, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(join(DST, name));
    done++;
  }));
  process.stdout.write(`\r${done}/${files.length}`);
}
console.log('\nDone.');
