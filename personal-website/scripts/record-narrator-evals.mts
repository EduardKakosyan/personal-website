// Calls the live DGX Spark for every fixture marked "record": true and saves the raw model
// output, so `pnpm test` evaluates real outputs offline. Manual: run it after changing the prompt
// or the model, review the diff, then run `pnpm test`.
//
//   vercel env pull .env.local   # DGX_NARRATE_URL, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
//   pnpm narrator:record
//
// Or straight to the model over an SSH port forward, skipping the tunnel (loopback only):
//   ssh -N -L 18090:127.0.0.1:8090 hugo-dgx1 &
//   DGX_NARRATE_DIRECT_URL=http://127.0.0.1:18090 pnpm narrator:record
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { loadTs } from '../tests/helpers/load-ts.mjs'

const { buildPrompt } = loadTs(new URL('../src/lib/narrate/prompt.ts', import.meta.url))
const { dgxModel, chatBody, MODEL_TIMEOUT_MS } = loadTs(
  new URL('../src/lib/narrate/dgx-client.ts', import.meta.url),
)

function directModel(base: string) {
  const url = new URL('v1/chat/completions', base.endsWith('/') ? base : `${base}/`)
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
    throw new Error('DGX_NARRATE_DIRECT_URL must be a loopback address')
  return async (request: unknown) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(chatBody(request, process.env.DGX_NARRATE_MODEL)),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`model returned ${response.status}`)
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('model reply had no content')
    return content
  }
}

const dir = new URL('../tests/fixtures/narrator/', import.meta.url)
const direct = process.env.DGX_NARRATE_DIRECT_URL
const callModel = direct ? directModel(direct) : dgxModel(process.env)
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
