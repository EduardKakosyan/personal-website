import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { renderIcons } from '../scripts/render-icons.mjs'

test('browser and app icons match the header monogram source', async () => {
  for (const [path, expected] of await renderIcons()) {
    assert.deepEqual(readFileSync(new URL(`../public/${path}`, import.meta.url)), expected, path)
  }
})

test('app icons have the advertised dimensions and the ICO includes small sizes', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.json', import.meta.url)))
  for (const icon of manifest.icons) {
    const path = icon.src.split('?')[0]
    const { width, height } = await sharp(
      readFileSync(new URL(`../public${path}`, import.meta.url)),
    ).metadata()
    assert.equal(`${width}x${height}`, icon.sizes)
  }
  const ico = readFileSync(new URL('../public/favicon.ico', import.meta.url))
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 3)
  assert.deepEqual([ico[6], ico[22], ico[38]], [16, 32, 48])
})
