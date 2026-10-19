// Calls the live DGX Spark for every fixture marked "record": true and saves the raw model
// output, so `pnpm test` evaluates real outputs offline. Manual: run it after changing the prompt
// or the model, review the diff, then run `pnpm test`.
//
//   vercel env pull .env.local   # DGX_NARRATE_URL, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
//   pnpm narrator:record
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { loadTs } from '../tests/helpers/load-ts.mjs'

const { buildPrompt } = loadTs(new URL('../src/lib/narrate/prompt.ts', import.meta.url))
const { dgxModel } = loadTs(new URL('../src/lib/narrate/dgx-client.ts', import.meta.url))

const dir = new URL('../tests/fixtures/narrator/', import.meta.url)
const callModel = dgxModel(process.env)
let recorded = 0
let failed = 0
for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
  const url = new URL(file, dir)
  const fixture = JSON.parse(readFileSync(url, 'utf8'))
  if (!fixture.record) continue
  const started = Date.now()
  try {
    const raw = await callModel(buildPrompt(fixture.input))
    Object.assign(fixture, {
      raw,
      source: 'dgx',
      model: process.env.DGX_NARRATE_MODEL ?? 'qwen3.6-35b-a3b',
      recordedAt: new Date().toISOString(),
      ms: Date.now() - started,
    })
    writeFileSync(url, `${JSON.stringify(fixture, null, 2)}\n`)
    recorded++
    console.log(`recorded ${fixture.name} in ${Date.now() - started} ms`)
  } catch (error) {
    failed++
    console.error(`failed ${fixture.name}: ${error instanceof Error ? error.message : error}`)
  }
}
console.log(`${recorded} recorded, ${failed} failed. Now run: pnpm test`)
if (failed) process.exit(1)
