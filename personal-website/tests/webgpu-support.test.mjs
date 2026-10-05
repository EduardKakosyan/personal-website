import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const compiled = ts.transpileModule(
  readFileSync(new URL('../src/lib/webgpu-support.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText
const fixture = { exports: {} }
new Function('module', 'exports', compiled)(fixture, fixture.exports)
const { checkLocalAISupport } = fixture.exports
const gpuWithBuffers = (count) => ({
  requestAdapter: async () => ({ limits: { maxStorageBuffersPerShaderStage: count } }),
})

test('the Firefox Metal limit explains why local AI is unavailable', async () => {
  const result = await checkLocalAISupport(true, gpuWithBuffers(9))
  assert.equal(result.status, 'unsupported')
  assert.match(result.reason, /9 GPU storage buffers/)
  assert.match(result.reason, /needs 10/)
  assert.match(result.reason, /Chrome or Edge/)
})

test('an adapter meeting the runtime limit enables local AI', async () => {
  assert.deepEqual(await checkLocalAISupport(true, gpuWithBuffers(10)), { status: 'supported' })
})

test('missing WebGPU and insecure pages get different recovery instructions', async () => {
  assert.match((await checkLocalAISupport(true)).reason, /WebGPU is unavailable/)
  assert.match((await checkLocalAISupport(false)).reason, /HTTPS or localhost/)
})

test('missing adapters and failed probes resolve to an actionable state', async () => {
  const missing = await checkLocalAISupport(true, { requestAdapter: async () => null })
  assert.equal(missing.status, 'unsupported')
  assert.match(missing.reason, /hardware acceleration/)
  const failed = await checkLocalAISupport(true, {
    requestAdapter: async () => {
      throw new Error('GPU unavailable')
    },
  })
  assert.equal(failed.status, 'unsupported')
  assert.match(failed.reason, /GPU check failed/)
})
