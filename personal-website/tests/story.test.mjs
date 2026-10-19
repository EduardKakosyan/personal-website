import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, statSync, readFileSync, readdirSync } from 'node:fs'
import { loadTs } from './helpers/load-ts.mjs'
import { findHiddenTerms, localHiddenTerms } from '../scripts/lib/hidden-terms.mts'
const { chapters, personaOrder, narratorLines, parsePersona } = loadTs(
  new URL('../src/content/story.ts', import.meta.url),
)
const { storyCopy } = loadTs(new URL('../src/content/story-copy.ts', import.meta.url))
const { projects } = loadTs(new URL('../src/content/projects.ts', import.meta.url))
const { profile } = loadTs(new URL('../src/content/profile.ts', import.meta.url))
const { guideSections, guideDestination } = loadTs(
  new URL('../src/content/portfolio.ts', import.meta.url),
)

test('each persona is a complete permutation ending at next-step with complete narration', () => {
  for (const [persona, order] of Object.entries(personaOrder)) {
    assert.deepEqual([...order].sort(), chapters.map((c) => c.id).sort())
    assert.equal(order.at(-1), 'next-step')
    for (const id of order) assert.ok(narratorLines[persona][id].length > 20)
  }
  assert.equal(personaOrder.recruiter[0], 'adoption')
  assert.equal(personaOrder.engineer[0], 'private-local')
  for (const value of ['invalid', '__proto__', undefined, [], 'hiring-manager'])
    assert.equal(parsePersona(value), 'hiring-manager')
  assert.equal(parsePersona('engineer'), 'engineer')
})
test('story proof, links, guide targets and optimized themed stills resolve', () => {
  const slugs = new Set([...projects, ...profile.clientWork].map((p) => p.slug))
  for (const chapter of chapters) {
    for (const slug of chapter.proof) assert.ok(slugs.has(slug))
    assert.ok(
      ['/about', '/contact', ...projects.map((p) => `/projects/${p.slug}`)].includes(
        chapter.learnMore,
      ),
    )
    assert.equal(guideSections[chapter.id].id, chapter.id)
    assert.deepEqual(
      guideDestination({
        action: 'highlight_section',
        target: chapter.id,
        reply: 'Read this chapter.',
      }),
      { path: '/', id: chapter.id },
    )
    for (const theme of ['light', 'dark']) {
      const url = new URL(`../public${chapter.still[theme]}`, import.meta.url)
      assert.ok(existsSync(url))
      assert.ok(statSync(url).size < 40000)
      assert.equal(readFileSync(url).subarray(8, 12).toString(), 'WEBP')
    }
  }
})
test('story copy contains no hidden terms or literal count claims and fills only site metrics', () => {
  const copy = [
    ...chapters.flatMap((c) => [c.headline, c.line, c.still.alt]),
    ...Object.values(narratorLines).flatMap(Object.values),
  ].join('\n')
  assert.deepEqual(findHiddenTerms(copy, [...profile.hidden, ...localHiddenTerms()]), [])
  assert.doesNotMatch(copy, /\d/)
  assert.match(
    storyCopy(chapters.find((c) => c.id === 'adoption').line),
    /226 learners, with 88% completion/,
  )
  assert.throws(() => storyCopy('{metric:oppsWon}'))
  assert.throws(() => storyCopy('{metric:missing}'))
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
