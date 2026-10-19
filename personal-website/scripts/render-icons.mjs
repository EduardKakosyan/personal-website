import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'

export async function renderIcons() {
  const monogram = readFileSync(new URL('../public/monogram.svg', import.meta.url), 'utf8')
  const icon = monogram
    .replace('fill="#93482e"', 'fill="#f4f2eb"')
    .replace('fill="none">', 'fill="none"><rect width="64" height="64" rx="12" fill="#93482e"/>')
  const raster = (size) => sharp(Buffer.from(icon)).resize(size, size).png().toBuffer()
  const images = await Promise.all([16, 32, 48].map(raster))
  // ICO directory entries point to PNG payloads, one for each small browser-icon size.
  const directory = Buffer.alloc(6 + images.length * 16)
  directory.writeUInt16LE(1, 2)
  directory.writeUInt16LE(images.length, 4)
  let offset = directory.length
  images.forEach((image, index) => {
    const entry = 6 + index * 16
    directory[entry] = [16, 32, 48][index]
    directory[entry + 1] = directory[entry]
    directory.writeUInt16LE(1, entry + 4)
    directory.writeUInt16LE(32, entry + 6)
    directory.writeUInt32LE(image.length, entry + 8)
    directory.writeUInt32LE(offset, entry + 12)
    offset += image.length
  })
  return new Map([
    ['favicon/icon.svg', Buffer.from(icon)],
    ['favicon.ico', Buffer.concat([directory, ...images])],
    ['favicon/favicon-32x32.png', images[1]],
    ['favicon/apple-touch-icon.png', await raster(180)],
    ['favicon/favicon-192x192.png', await raster(192)],
    ['favicon/favicon-512x512.png', await raster(512)],
  ])
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [path, buffer] of await renderIcons()) {
    writeFileSync(new URL(`../public/${path}`, import.meta.url), buffer)
  }
  console.log('Generated browser and app icons from public/monogram.svg')
}
