import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

test('header accessible name includes both visible identity lines', () => {
  const header = readFileSync(
    new URL('../src/components/layouts/header-client.tsx', import.meta.url),
    'utf8',
  )
  const wordmark = header.slice(header.indexOf('<Link'), header.indexOf('</Link>'))
  assert.doesNotMatch(wordmark, /aria-label=/)
  assert.match(wordmark, /<strong>\{identity.name\}<\/strong>/)
  assert.ok(wordmark.includes('{identity.title} at {identity.company}'))
  assert.ok(wordmark.includes('<span className="sr-only"> home</span>'))
})

test('case study links keep their visible label intact in the accessible name', () => {
  const card = readFileSync(
    new URL('../src/components/features/work/case-study-card.tsx', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(card, /aria-label=/)
  assert.ok(card.includes('Read the case study<span className="sr-only">: {project.title}</span>'))
  assert.ok(card.includes('<span aria-hidden="true">&rarr;</span>'))
})

test('web analytics is opt-in until its Vercel endpoint is enabled', () => {
  const layout = readFileSync(new URL('../src/app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true' && <Analytics \/>/)
})

test('legacy styles are gone and the initial page never hides no-JS content', () => {
  assert.deepEqual(
    readdirSync(new URL('../src/app/', import.meta.url))
      .filter((p) => p.endsWith('.css'))
      .sort(),
    ['globals.css', 'site.css'],
  )
  const transition = readFileSync(
    new URL('../src/components/providers/page-transition-provider.tsx', import.meta.url),
    'utf8',
  )
  assert.match(transition, /initial=\{false\}/)
})
