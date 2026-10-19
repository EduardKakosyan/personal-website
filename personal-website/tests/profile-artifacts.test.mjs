import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadTs } from './helpers/load-ts.mjs'

// Guards the facts → artifacts pipeline without TeX or network access.
const root = fileURLToPath(new URL('..', import.meta.url))
const { profile, metricsFor, resumePdfPath, clientWorkIndex } = loadTs(
  join(root, 'src/content/profile.ts'),
)
// The render scripts are ESM that import .ts files with extensions, so they load through
// Node's built-in type stripping (Node ≥ 22.18; CI runs Node 24).
const { renderResume } = await import('../scripts/render-resume.mts')
const { fill } = await import('../scripts/lib/fill.mts')
const { tex } = await import('../scripts/lib/tex.mts')
const { findHiddenTerms, hiddenTermPattern, localHiddenTerms } =
  await import('../scripts/lib/hidden-terms.mts')

const resumeTex = readFileSync(join(root, 'resume/resume.tex'), 'utf8')
// Client names are never committed: they come from the gitignored hidden-terms.local.txt or the
// HIDDEN_TERMS env var. In CI the names are a secret, so failures there name the term by number.
const localTerms = localHiddenTerms()
const describeTerm = (term, terms) =>
  process.env.CI ? `hidden term #${terms.indexOf(term) + 1}` : `"${term}"`

test('profile parses and every metric has a definition', () => {
  assert.equal(profile.identity.email, 'kakosyaneduard@gmail.com')
  assert.deepEqual(profile.metrics.map((metric) => metric.id).sort(), [
    'learners',
    'oppsWon',
    'projects',
  ])
  for (const metric of profile.metrics) {
    assert.ok(metric.definition.length >= 20, `${metric.id} needs a definition`)
    assert.ok(metric.surfaces.length > 0, `${metric.id} must name its surfaces`)
  }
  // Deal data is for the résumé only (design Q5).
  assert.deepEqual(
    metricsFor('site')
      .map((metric) => metric.id)
      .sort(),
    ['learners', 'projects'],
  )
  assert.deepEqual(metricsFor('github'), [])
})

test('fill rejects unknown metrics and metrics not cleared for a surface', () => {
  assert.equal(fill('{metric:projects} projects', profile.metrics, 'site'), '39 projects')
  assert.throws(() => fill('{metric:clients}', profile.metrics, 'resume'), /Unknown metric/)
  assert.throws(() => fill('{metric:oppsWon}', profile.metrics, 'site'), /not cleared/)
  assert.throws(() => fill('{metric:projects.value}', profile.metrics, 'resume'), /Malformed/)
})

test('resume.tex matches a fresh render', () => {
  assert.equal(
    renderResume(),
    resumeTex,
    'resume/resume.tex is stale: run `pnpm resume` and commit the result',
  )
})

test('resume.sha matches sha256(resume.tex)', () => {
  const recorded = readFileSync(join(root, 'resume/resume.sha'), 'utf8').trim().split(/\s+/)[0]
  const actual = createHash('sha256').update(resumeTex).digest('hex')
  assert.equal(recorded, actual, 'the PDF was not rebuilt from this resume.tex: run `pnpm resume`')
  assert.ok(existsSync(join(root, 'public', resumePdfPath)), 'the résumé PDF is missing')
})

test('the committed profile holds no client names, only anonymised client work', () => {
  assert.deepEqual(profile.hidden, ['Sideline', 'Breakwater'])
  for (const work of profile.clientWork) {
    assert.equal(work.url, clientWorkIndex, `${work.slug} must link to the case-study index`)
  }
})

test('hidden terms come from the local file and HIDDEN_TERMS, matched as whole words', () => {
  assert.ok(localHiddenTerms({ HIDDEN_TERMS: ' Acme Corp , ,Zed ' }).includes('Acme Corp'))
  assert.ok(hiddenTermPattern('ACME').test('built for ACME.'))
  assert.ok(!hiddenTermPattern('ACME').test('acme-loader'), 'acronyms match case-sensitively')
  assert.ok(hiddenTermPattern('Acme Corp').test('the acme\ncorp build'))
  assert.ok(!hiddenTermPattern('Acme').test('Acmeville'))
})

test('no hidden term (profile.hidden + local client names) in resume.tex', () => {
  const terms = [...profile.hidden, ...localTerms]
  const found = findHiddenTerms(resumeTex, terms)
  assert.deepEqual(
    found.map((term) => describeTerm(term, terms)),
    [],
    'the résumé mentions a hidden term',
  )
})

test(
  'no local hidden term in any tracked text file under personal-website/',
  {
    skip: localTerms.length
      ? false
      : 'no hidden-terms.local.txt or HIDDEN_TERMS; nothing to scan for',
  },
  () => {
    // Tracked files plus new files that are not ignored, i.e. everything a commit could include.
    const files = execFileSync('git', ['ls-files', '-z', '-co', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean)
    assert.ok(files.length > 50, 'expected git to list the repository files')
    const offenders = []
    for (const file of files) {
      const path = join(root, file)
      if (!existsSync(path)) continue
      const bytes = readFileSync(path)
      if (bytes.subarray(0, 8000).includes(0)) continue // binary (images, PDF)
      for (const term of findHiddenTerms(bytes.toString('utf8'), localTerms)) {
        offenders.push(`${file}: ${describeTerm(term, localTerms)}`)
      }
    }
    assert.deepEqual(offenders, [], 'client names must not be committed')
  },
)

test('no undefined count claims (\\d+\\+, \\d+%, "N clients") in resume.tex', () => {
  // Drop LaTeX comments, then every number the résumé may print, exactly as it is rendered.
  let text = resumeTex.replace(/(^|[^\\])%.*$/gm, '$1')
  for (const metric of metricsFor('resume')) {
    text = text.split(`\\textbf{${tex(metric.value)}}`).join(' ')
    if (metric.detail) text = text.split(tex(metric.detail)).join(' ')
  }
  const claims = [
    /\d[\d,.]*[ ]?\+/,
    /\d[\d,.]*[ ]?\\%/,
    /\b\d[\d,]*[ ]+(clients|customers|companies|organi[sz]ations|firms|engagements|deployments|agents|systems|learners|students|participants|deals)\b/i,
  ]
  for (const claim of claims) {
    const found = claim.exec(text)?.[0]
    assert.ok(!found, `undefined count claim in resume.tex: "${found}"`)
  }
})

test('no GitHub/LinkedIn/mailto URL literals in src/ outside profile.ts', () => {
  const profileFile = join(root, 'src/content/profile.ts')
  const literals = [
    /linkedin\.com\//i,
    // The profile URL itself; repository URLs (github.com/<user>/<repo>) are project facts.
    /github\.com\/eduardkakosyan(?![\w.-]|\/[\w.-])/i,
    /mailto:(?!\$\{)/i,
    /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
  ]
  const offenders = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (path !== profileFile && /\.(tsx?|mts|css|md|json)$/.test(entry.name)) {
        const source = readFileSync(path, 'utf8')
        for (const literal of literals) {
          const match = literal.exec(source)
          if (match) offenders.push(`${relative(root, path)}: ${match[0]}`)
        }
      }
    }
  }
  walk(join(root, 'src'))
  assert.deepEqual(offenders, [], 'read these from profile.identity instead')
})
