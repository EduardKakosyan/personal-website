import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { loadTs } from './helpers/load-ts.mjs'
import { findHiddenTerms, localHiddenTerms } from '../scripts/lib/hidden-terms.mts'

const { projects, caseStudies, getProjectBySlug } = loadTs(
  new URL('../src/content/projects.ts', import.meta.url),
)
const { portfolioWorks, featuredWorks, directGuideAction } = loadTs(
  new URL('../src/content/portfolio.ts', import.meta.url),
)
const { profile } = loadTs(new URL('../src/content/profile.ts', import.meta.url))
const bodies = new URL('../src/content/project-descriptions/', import.meta.url)

test('one pure registry owns unique slugs and preserves all previous routes', async () => {
  const source = readFileSync(new URL('../src/content/projects.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\bimport\b|\brequire\s*\(|\bfs\b/)
  const native = await import('../src/content/projects.ts')
  assert.equal(native.projects.length, projects.length)
  assert.equal(new Set(projects.map((p) => p.slug)).size, projects.length)
  for (const slug of [
    'dgx-autonomy',
    'shoreline',
    'yahtzee',
    'hugo',
    'claude-autonomous',
    'voxcoach',
    'dev-template',
    'healthbyte',
    'second-brain',
    'cargrep',
    'network-sim',
    'volta-sep26',
    'exosky',
  ]) {
    assert.ok(getProjectBySlug(slug), slug)
  }
  assert.equal(getProjectBySlug('../../private'), undefined)
  assert.deepEqual(
    portfolioWorks.map((p) => p.slug),
    projects.map((p) => p.slug),
  )
})

test('featured case studies have complete facts, authored bodies and qualitative outcomes', () => {
  assert.deepEqual(
    caseStudies.map((p) => p.slug),
    ['keystone', 'keeper', 'dgx-autonomy'],
  )
  assert.deepEqual(
    featuredWorks.map((p) => p.slug),
    caseStudies.map((p) => p.slug),
  )
  for (const project of projects) {
    assert.match(project.slug, /^[a-z0-9-]+$/)
    assert.ok(existsSync(new URL(`${project.slug}.md`, bodies)))
    for (const key of ['role', 'when', 'team'])
      assert.ok(project.facts[key].trim(), `${project.slug}: ${key}`)
    assert.ok(project.facts.stack.length)
    for (const link of project.facts.links) assert.equal(new URL(link.href).protocol, 'https:')
  }
  for (const project of caseStudies) {
    assert.ok(project.beat && project.outcome)
    assert.doesNotMatch(project.outcome, /\d/)
  }
})

test('described-only work never offers repository links; CarGrep website is not a repo', () => {
  for (const project of projects.filter((p) => p.visibility === 'described-only')) {
    for (const link of project.facts.links) {
      assert.doesNotMatch(link.href, /github\.com|gitlab\.com|bitbucket\.org/)
      assert.notEqual(link.label, 'Source code')
    }
  }
  assert.equal(portfolioWorks.find((p) => p.slug === 'cargrep').repo, undefined)
  assert.equal(getProjectBySlug('cargrep').facts.links[0].href, 'https://www.cargrep.com')
  assert.equal(getProjectBySlug('keeper').visibility, 'described-only')
})

test('VoxCoach is navigable archive work, not a featured case study', () => {
  assert.equal(getProjectBySlug('voxcoach').tier, 'archive')
  assert.equal(
    featuredWorks.some((p) => p.slug === 'voxcoach'),
    false,
  )
  assert.equal(directGuideAction('Open VoxCoach').target, 'voxcoach')
  for (const slug of ['keystone', 'keeper'])
    assert.equal(directGuideAction(`Open ${slug}`).target, slug)
})

test('project Markdown and registry contain no hidden terms', () => {
  const terms = [...profile.hidden, ...localHiddenTerms()]
  for (const file of readdirSync(bodies).filter((file) => file.endsWith('.md'))) {
    assert.equal(
      findHiddenTerms(readFileSync(new URL(file, bodies), 'utf8'), terms).length,
      0,
      `hidden term in ${file}`,
    )
  }
  assert.equal(findHiddenTerms(JSON.stringify(projects), terms).length, 0)
})

test('new case studies are short, retain section anchors and use only synthetic Keystone visuals', () => {
  for (const slug of ['keystone', 'keeper']) {
    const body = readFileSync(new URL(`${slug}.md`, bodies), 'utf8')
    assert.ok(body.split(/\s+/).length < 800)
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1])
    assert.deepEqual(
      headings,
      slug === 'keystone'
        ? ['Discovery', 'Definitions', 'Architecture', 'Build', 'What broke']
        : ['Problem', 'System', 'Decisions', 'Result', 'What broke'],
    )
    if (slug === 'keystone') {
      assert.match(body, /rolling out/)
      const images = [...body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]
      assert.equal(images.length, 3)
      for (const [, path] of images) {
        assert.match(path, /^\/images\/keystone\/[a-z]+\.svg$/)
        assert.match(
          readFileSync(new URL(`../public${path}`, import.meta.url), 'utf8'),
          /SYNTHETIC/,
        )
      }
    }
  }
})
