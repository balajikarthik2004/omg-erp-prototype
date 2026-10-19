/**
 * Builds the poster-sized copies of the photo library.
 *
 * The source pictures in `public/images` are page hero art — one is 2.7 MB. A
 * poster embeds its photograph as a data URI so the exported .svg is a single
 * self-contained file, and base64 adds a third again on top, so shipping the
 * originals would mean a 7 MB poster. The photo panel is never larger than
 * 1024 × 900, so a 1600px JPEG is all the detail a print can use.
 *
 * Run after adding an entry to POSTER_PHOTOS:  node scripts/build-poster-photos.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'public/images')
const OUT_DIR = path.join(ROOT, 'public/images/posters')

const MAX_EDGE = 1600
const QUALITY = 82

/** Source file -> the name the poster library asks for. Keep in step with `POSTER_PHOTOS`. */
const PHOTOS = [
  ['tamil heritage.png', 'sangam-stage.jpg'],
  ['sangam-hall.webp', 'sangam-hall.jpg'],
  ['catalogue/Thirukalyanam.png', 'thirukalyanam.jpg'],
  ['diya-promise.jpg', 'lamp-jasmine.jpg'],
  ['temple-hanging-lamp.jpg', 'hanging-lamp.jpg'],
  ['hero-hanging-deepams.jpg', 'hanging-deepams.jpg'],
  ['temple.webp', 'gopuram-daylight.jpg'],
  ['project-rajagopuram.webp', 'rajagopuram-daylight.jpg'],
  ['sevalaya-annadhanam.webp', 'annadhanam-hall.jpg'],
  ['temple-gopuram-grand.webp', 'gopuram-sunset-lamps.jpg'],
  ['Festival.png', 'festival-procession.jpg'],
  ['catalogue/Car Festival.png', 'car-festival.jpg'],
  ['temple-gopuram.webp', 'gopuram-dusk-lamps.jpg'],
]

fs.mkdirSync(OUT_DIR, { recursive: true })

let total = 0
for (const [from, to] of PHOTOS) {
  const src = path.join(SRC_DIR, from)
  if (!fs.existsSync(src)) {
    console.error(`missing source: ${from}`)
    process.exitCode = 1
    continue
  }
  const out = path.join(OUT_DIR, to)
  const info = await sharp(src)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(out)
  total += info.size
  const before = fs.statSync(src).size
  console.log(`${to.padEnd(28)} ${info.width}x${info.height}  ${(before / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB`)
}
console.log(`\n${PHOTOS.length} photos, ${(total / 1024).toFixed(0)}KB total`)
