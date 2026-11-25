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
    'keeper',
    'keystone',
    'lyfe',
    'personal-website',
    'dgx-autonomy',
    'shoreline',
    'yahtzee',
    'hugo',
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
    ['keeper', 'keystone', 'lyfe', 'dgx-autonomy', 'personal-website'],
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
  // cargrep.com no longer resolves, so CarGrep has no links at all.
  assert.deepEqual(getProjectBySlug('cargrep').facts.links, [])
  assert.equal(getProjectBySlug('keeper').visibility, 'described-only')
})

test('retired projects are gone from the registry and guide, and their pages redirect', async () => {
  for (const slug of ['voxcoach', 'claude-autonomous']) {
    assert.equal(getProjectBySlug(slug), undefined)
    assert.equal(existsSync(new URL(`${slug}.md`, bodies)), false)
  }
  assert.equal(directGuideAction('Open VoxCoach'), null)
  const { default: config } = await import('../next.config.js')
  const redirects = await config.redirects()
  assert.deepEqual(
    redirects.map((rule) => rule.source),
    ['/preview/arrival', '/projects/voxcoach', '/projects/claude-autonomous'],
  )
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

test('every case study is short, follows one shape and has one diagram', () => {
  for (const { slug } of caseStudies) {
    const body = readFileSync(new URL(`${slug}.md`, bodies), 'utf8')
    assert.ok(body.split(/\s+/).length < 800, `${slug} is too long`)
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1])
    assert.deepEqual(
      headings,
      [
        'The problem',
        'What it does',
        'How it works',
        'The choices',
        'Where AI fits',
        'Where it is now',
      ],
      slug,
    )
    const images = [...body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]
    assert.equal(images.length, 1, `${slug} needs exactly one diagram`)
    const [, alt, path] = images[0]
    assert.ok(alt.length > 30, `${slug}: the diagram needs a sentence of alt text`)
    assert.equal(path, `/images/projects/${slug}.svg`)
    assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), path)
  }
  assert.match(readFileSync(new URL('keystone.md', bodies), 'utf8'), /rolling it out/)
})

test('authored website copy avoids empty quality claims', () => {
  const copy = [
    JSON.stringify(projects),
    profile.headline,
    ...profile.roles.map((role) => role.summary),
    ...readdirSync(bodies)
      .filter((name) => name.endsWith('.md'))
      .map((name) => readFileSync(new URL(name, bodies), 'utf8')),
  ].join('\n')
  assert.doesNotMatch(
    copy,
    /\b(?:(?:actually|really|just|truly) works?|works? in practice|actually (?:useful|use)|real[- ]world solutions?|production[- ]ready|battle[- ]tested)\b/i,
  )
})
