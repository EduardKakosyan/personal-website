import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { loadTs } from './helpers/load-ts.mjs'
import { findHiddenTerms, localHiddenTerms } from '../scripts/lib/hidden-terms.mts'

const { narrate, numbersGrounded } = loadTs(
  new URL('../src/lib/narrate/narrate.ts', import.meta.url),
)
const { buildPrompt } = loadTs(new URL('../src/lib/narrate/prompt.ts', import.meta.url))
const { dgxModel, MODEL_TIMEOUT_MS } = loadTs(
  new URL('../src/lib/narrate/dgx-client.ts', import.meta.url),
)
const { chapters, personaOrder } = loadTs(new URL('../src/content/story.ts', import.meta.url))
const { profile } = loadTs(new URL('../src/content/profile.ts', import.meta.url))

const dir = new URL('./fixtures/narrator/', import.meta.url)
const fixtures = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(new URL(file, dir), 'utf8')))
const hidden = [...profile.hidden, ...localHiddenTerms()]

test('narrator fixtures cover success and every failure path', () => {
  assert.ok(fixtures.length >= 15)
  const actions = new Set(fixtures.map((fixture) => fixture.expect.action))
  for (const action of ['answer', 'open_project', 'highlight_section', 'navigate', null])
    assert.ok(actions.has(action), `no fixture expects ${action}`)
  assert.ok(fixtures.some((fixture) => fixture.error === 'timeout'))
  assert.ok(fixtures.some((fixture) => fixture.expect.modelCalled === false))
})

for (const fixture of fixtures) {
  test(`narrator eval: ${fixture.name} (${fixture.source})`, async () => {
    let calls = 0
    const callModel = async (request) => {
      calls++
      assert.equal(request.messages[0].role, 'system')
      assert.doesNotThrow(() => JSON.parse(request.schema))
      if (fixture.error === 'timeout') throw new DOMException('timed out', 'TimeoutError')
      return fixture.raw
    }
    const result = await narrate(fixture.input, { callModel, env: fixture.env ?? {} })
    const { expect } = fixture
    if (expect.modelCalled === false) assert.equal(calls, 0, 'the model must not be called')
    if (expect.action === null) {
      assert.equal(result, null)
      return
    }
    if (expect.action === 'navigate') {
      // Either opening the project or pointing at one of its sections is a correct answer.
      assert.ok(['open_project', 'highlight_section'].includes(result.action), result.action)
      assert.ok(result.href.startsWith(expect.hrefPrefix), result.href)
    } else {
      assert.equal(result.action, expect.action)
      if (expect.target) assert.equal(result.target, expect.target)
      assert.equal(result.href, expect.href)
    }
    if (expect.mentions)
      assert.ok(
        expect.mentions.some((word) => result.reply.includes(word)),
        `reply mentions none of ${expect.mentions.join(', ')}: ${result.reply}`,
      )
    assert.deepEqual(findHiddenTerms(result.reply, hidden), [])
    if (fixture.input.kind === 'bridge') assert.ok(result.reply.length <= 320)
  })
}

test('prompts for every persona and chapter carry no hidden terms', () => {
  for (const persona of Object.keys(personaOrder))
    for (const chapter of chapters.map((item) => item.id))
      for (const input of [
        { kind: 'bridge', persona, chapter },
        { kind: 'question', persona, chapter, text: 'What did he build for clients?' },
      ]) {
        const prompt = buildPrompt(input)
        assert.deepEqual(findHiddenTerms(prompt.grounding, hidden), [])
        assert.ok(prompt.grounding.includes(chapters.find((c) => c.id === chapter).headline))
        assert.ok(prompt.maxTokens <= 300)
      }
})

test('numbers in a reply must come from the grounding', () => {
  assert.equal(numbersGrounded('226 learners, 88% completion', 'had 226 learners and 88%'), true)
  assert.equal(numbersGrounded('No numbers here.', ''), true)
  assert.equal(numbersGrounded('Saved 40% of the time', 'had 226 learners'), false)
  assert.equal(numbersGrounded('Built in 2026', 'start 2026-02'), true)
})

test('narrator grounding preserves team leadership and separates the teaching engagements', () => {
  const { grounding } = buildPrompt({
    kind: 'question',
    persona: 'recruiter',
    chapter: 'adoption',
    text: 'What did Eduard teach and who does he lead?',
  })
  assert.match(grounding, /team of five developers/)
  assert.match(
    grounding,
    /Skills for Hire curriculum work was a client engagement through AI-First, separate from/,
  )
  assert.doesNotMatch(grounding, /co-op developers|AI Instructor & Curriculum Developer/)
})

test('the Spark client sends Access credentials, a timeout and no thinking', async () => {
  const env = {
    DGX_NARRATE_URL: 'https://narrator.example.test',
    CF_ACCESS_CLIENT_ID: 'id',
    CF_ACCESS_CLIENT_SECRET: 'secret',
  }
  let seen
  const fetcher = async (url, init) => {
    seen = { url: String(url), init }
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":1}' } }] }))
  }
  const call = dgxModel(env, fetcher)
  const output = await call({ messages: [], schema: '{"type":"object"}', maxTokens: 50 })
  assert.equal(output, '{"ok":1}')
  assert.equal(seen.url, 'https://narrator.example.test/v1/chat/completions')
  assert.equal(seen.init.headers['CF-Access-Client-Id'], 'id')
  assert.equal(seen.init.headers['CF-Access-Client-Secret'], 'secret')
  assert.equal(seen.init.redirect, 'error')
  assert.ok(seen.init.signal instanceof AbortSignal)
  assert.equal(MODEL_TIMEOUT_MS, 3000)
  const body = JSON.parse(seen.init.body)
  assert.equal(body.max_tokens, 50)
  assert.equal(body.chat_template_kwargs.enable_thinking, false)
  assert.equal(body.response_format.type, 'json_schema')
})

test('the Spark client can use the model server API key instead of Cloudflare Access', async () => {
  let headers
  const fetcher = async (_url, init) => {
    headers = init.headers
    return new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }))
  }
  await dgxModel(
    { DGX_NARRATE_URL: 'https://dgx1.example.ts.net', DGX_NARRATE_API_KEY: 'k3y' },
    fetcher,
  )({ messages: [], schema: '{}', maxTokens: 10 })
  assert.equal(headers.Authorization, 'Bearer k3y')
  assert.equal(headers['CF-Access-Client-Id'], undefined)
  // Half an Access pair is not a credential.
  await assert.rejects(
    dgxModel(
      { DGX_NARRATE_URL: 'https://x.example.test', CF_ACCESS_CLIENT_ID: 'a' },
      fetcher,
    )({
      messages: [],
      schema: '{}',
      maxTokens: 10,
    }),
    /not configured/,
  )
})

test('the Spark client fails closed', async () => {
  const ok = async () => new Response('{}')
  const request = { messages: [], schema: '{}', maxTokens: 10 }
  await assert.rejects(dgxModel({}, ok)(request), /not configured/)
  await assert.rejects(
    dgxModel(
      {
        DGX_NARRATE_URL: 'http://plain.example.test',
        CF_ACCESS_CLIENT_ID: 'a',
        CF_ACCESS_CLIENT_SECRET: 'b',
      },
      ok,
    )(request),
    /https/,
  )
  const env = {
    DGX_NARRATE_URL: 'https://narrator.example.test/',
    CF_ACCESS_CLIENT_ID: 'a',
    CF_ACCESS_CLIENT_SECRET: 'b',
  }
  await assert.rejects(
    dgxModel(env, async () => new Response('no', { status: 502 }))(request),
    /502/,
  )
  await assert.rejects(dgxModel(env, ok)(request), /no content/)
  // With no configuration, the whole pipeline returns null instead of throwing.
  assert.equal(
    await narrate(
      { kind: 'bridge', persona: 'recruiter', chapter: 'systems' },
      { callModel: dgxModel({}) },
    ),
    null,
  )
})
