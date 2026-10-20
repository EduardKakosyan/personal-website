import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, statSync, readFileSync, readdirSync } from 'node:fs'
import { loadTs } from './helpers/load-ts.mjs'
import { findHiddenTerms, localHiddenTerms } from '../scripts/lib/hidden-terms.mts'
const { chapters, portfolioAudience, portfolioOrder, personaOrder, narratorLines, parsePersona } =
  loadTs(new URL('../src/content/story.ts', import.meta.url))
const { storyCopy } = loadTs(new URL('../src/content/story-copy.ts', import.meta.url))
const { projects } = loadTs(new URL('../src/content/projects.ts', import.meta.url))
const { profile } = loadTs(new URL('../src/content/profile.ts', import.meta.url))
const { guideSections, guideDestination, projectCommands } = loadTs(
  new URL('../src/content/portfolio.ts', import.meta.url),
)

test('homepage has one work-first reading order without audience selection', () => {
  assert.deepEqual(portfolioOrder, ['systems', 'private-local', 'adoption', 'next-step'])
  assert.deepEqual(portfolioOrder, personaOrder[portfolioAudience])
  const scroller = readFileSync(
    new URL('../src/components/features/story/story-scroller.tsx', import.meta.url),
    'utf8',
  )
  assert.match(scroller, /portfolioOrder\.map/)
  assert.doesNotMatch(scroller, /PersonaChooser|URLSearchParams|popstate|What brings you here/)
  const hero = readFileSync(
    new URL('../src/components/features/story/story-hero.tsx', import.meta.url),
    'utf8',
  )
  assert.match(hero, /Forward Deployed AI Developer/)
  assert.match(hero, /based in Halifax/)
  assert.doesNotMatch(hero, /metricsFor|team of five|story-proof/)
  assert.equal(profile.identity.company, 'AI-First Solutions')
  assert.equal(profile.identity.title, 'Lead AI Developer')
  assert.match(profile.headline, /local organizations/)
  assert.match(profile.headline, /loop engineering, local AI systems/)
})

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
  assert.equal(findHiddenTerms(copy, [...profile.hidden, ...localHiddenTerms()]).length, 0)
  assert.doesNotMatch(copy.replace(/\bn8n\b/g, ''), /\d/)
  assert.match(
    storyCopy(chapters.find((c) => c.id === 'adoption').line),
    /226 learners, 88% completion\./,
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

test('homepage copy keeps teaching attribution, build supervision and project status explicit', () => {
  const systems = chapters.find((chapter) => chapter.id === 'systems')
  const local = chapters.find((chapter) => chapter.id === 'private-local')
  const teaching = chapters.find((chapter) => chapter.id === 'adoption')
  assert.match(systems.line, /rolling it out now/)
  assert.match(local.line, /briefs and review the results with help from Claude/)
  assert.match(teaching.line, /Through AI-First.*client’s data science and ML curriculum/)
  assert.match(teaching.line, /separate role at ShiftKey Labs/)
  assert.match(narratorLines.recruiter['private-local'], /original Camp Yahtzee release/)
  assert.match(narratorLines.recruiter['private-local'], /Later.*CodeLayer/)
})

test('authored website copy avoids empty quality claims', () => {
  const bodies = new URL('../src/content/project-descriptions/', import.meta.url)
  const copy = [
    JSON.stringify(chapters),
    JSON.stringify(narratorLines),
    JSON.stringify(projects),
    JSON.stringify(projectCommands),
    profile.headline,
    ...profile.roles.map((role) => role.summary),
    readFileSync(
      new URL('../src/components/features/story/story-hero.tsx', import.meta.url),
      'utf8',
    ),
    ...readdirSync(bodies)
      .filter((name) => name.endsWith('.md'))
      .map((name) => readFileSync(new URL(name, bodies), 'utf8')),
  ].join('\n')
  assert.doesNotMatch(
    copy,
    /\b(?:(?:actually|really|just|truly) works?|works? in practice|actually (?:useful|use)|real[- ]world solutions?|production[- ]ready|battle[- ]tested)\b/i,
  )
})
