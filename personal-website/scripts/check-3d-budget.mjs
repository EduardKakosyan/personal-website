// After `pnpm build`: every client chunk containing three.js must be ≤ 300 KB gzipped,
// must not be referenced from any prerendered HTML (so it is never preloaded), and must be
// reachable only from the home route ("/").
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BUDGET = 300 * 1024
const next = fileURLToPath(new URL('../.next/', import.meta.url))
const chunksDir = path.join(next, 'static/chunks')
const appDir = path.join(next, 'server/app')
if (!existsSync(chunksDir) || !existsSync(appDir)) {
  console.error('check:3d: no build output. Run `pnpm build` first.')
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  )
const chunks = walk(chunksDir).filter((file) => file.endsWith('.js'))
const serverFiles = walk(appDir).filter((file) => !/\.(map|nft\.json)$/.test(file))
const read = new Map()
const text = (file) => {
  if (!read.has(file)) read.set(file, readFileSync(file, 'utf8'))
  return read.get(file)
}

// Server output for "/" is index.* (prerender), page/ and page.js (+ manifests) at the app root.
const route = (file) => {
  const rel = path.relative(appDir, file).split(path.sep).join('/')
  return /^(index\b|page\b|page\/|page_client-reference-manifest\.js$)/.test(rel) ? '/' : rel
}

// Which routes can load this chunk, following chunk-to-chunk references (dynamic imports).
function routesFor(chunk, seen = new Set()) {
  if (seen.has(chunk)) return []
  seen.add(chunk)
  const name = path.basename(chunk, '.js')
  const direct = serverFiles.filter((file) => text(file).includes(name)).map(route)
  const parents = chunks.filter((file) => file !== chunk && text(file).includes(name))
  return [...direct, ...parents.flatMap((parent) => routesFor(parent, seen))]
}

const three = chunks.filter((file) => /__THREE__|THREE\.WebGLRenderer/.test(text(file)))
const failures = []
if (three.length === 0) failures.push('no three.js chunk found; the check would prove nothing')
for (const chunk of three) {
  const name = path.relative(next, chunk)
  const gz = gzipSync(readFileSync(chunk), { level: 9 }).length
  const html = serverFiles.filter(
    (file) => file.endsWith('.html') && text(file).includes(path.basename(chunk, '.js')),
  )
  const routes = [...new Set(routesFor(chunk))]
  console.log(`${name}: ${(gz / 1024).toFixed(1)} KB gzip; routes ${routes.join(', ') || '(none)'}`)
  if (gz > BUDGET) failures.push(`${name} is ${(gz / 1024).toFixed(1)} KB gzip (budget 300 KB)`)
  if (html.length) failures.push(`${name} is preloaded by ${html.map(route).join(', ')}`)
  if (routes.some((r) => r !== '/')) failures.push(`${name} is reachable from ${routes.join(', ')}`)
  if (!routes.includes('/')) failures.push(`${name} is not reachable from /; is the stage wired?`)
}

if (failures.length) {
  for (const failure of failures) console.error(`check:3d: ${failure}`)
  process.exit(1)
}
console.log(`check:3d: ${three.length} three.js chunk(s) within budget, home route only`)
