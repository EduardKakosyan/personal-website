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
const { renderGithubReadme } = await import('../scripts/render-github-readme.mts')
const { projects } = await import('../src/content/projects.ts')
const { githubContent } = await import('../profile-readme/content.ts')
const { resumeContent } = await import('../resume/content.ts')
const { fill } = await import('../scripts/lib/fill.mts')
const { tex } = await import('../scripts/lib/tex.mts')
const { findHiddenTerms, hiddenTermPattern, localHiddenTerms } =
  await import('../scripts/lib/hidden-terms.mts')

const resumeTex = readFileSync(join(root, 'resume/resume.tex'), 'utf8')
const githubReadme = readFileSync(join(root, 'profile-readme/README.md'), 'utf8')
const draftNames = [
  'keeper',
  'dgx-autonomy',
  'hugo',
  'claude-hackathon-volta-sep26',
  'personal-website',
  'shoreline',
  'yahtzee',
  'atlantic-ai-conference-hackathon',
  'volta_hackathon',
  'q-learning-network-sim',
  'exosky_nasa',
]

test('GitHub README matches a fresh render and the cleared selection', async () => {
  assert.equal(githubReadme, await renderGithubReadme())
  assert.deepEqual(githubContent.selected, [
    'keeper',
    'dgx-autonomy',
    'hugo',
    'volta-sep26',
    'personal-website',
  ])
  assert.doesNotMatch(githubReadme, /github\.com\/[^\s/]+\/keeper\b/i)
  assert.match(githubReadme, /source private; audit pending/)
  assert.equal((githubReadme.match(/^- \*\*/gm) ?? []).length, 4)
  assert.doesNotMatch(githubReadme, /\d+\s*(?:%|\+|clients|learners|deals)/i)
})

test('README kit has exactly the cleared drafts in the template heading order', () => {
  const folder = join(root, 'repo-readmes')
  const files = readdirSync(folder).filter((file) => !/^[A-Z]+\.md$/.test(file))
  assert.deepEqual(files.sort(), draftNames.map((name) => `${name}.md`).sort())
  const headings = (text) => [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1])
  const expected = headings(readFileSync(join(folder, 'TEMPLATE.md'), 'utf8'))
  assert.deepEqual(expected, [
    'What',
    'Why',
    'Demo',
    'Run it',
    "How it's tested",
    'How it works',
    'Status',
    'More',
  ])
  for (const file of files) {
    const text = readFileSync(join(folder, file), 'utf8')
    assert.deepEqual(headings(text), expected, file)
    assert.match(text, /https:\/\/kakosyaneduard\.ca/, file)
  }
  assert.equal(
    readFileSync(join(root, '../README.md'), 'utf8'),
    readFileSync(join(folder, 'personal-website.md'), 'utf8'),
  )
})

test('all GitHub kit site links resolve and all output files exclude hidden terms', () => {
  const texts = [
    githubReadme,
    readFileSync(join(root, '../README.md'), 'utf8'),
    ...readdirSync(join(root, 'repo-readmes')).map((name) =>
      readFileSync(join(root, 'repo-readmes', name), 'utf8'),
    ),
  ]
  const terms = [...profile.hidden, ...localHiddenTerms()]
  const routes = new Set([
    '/',
    '/projects',
    '/about',
    '/contact',
    resumePdfPath,
    ...projects.map((project) => `/projects/${project.slug}`),
  ])
  for (const text of texts) {
    assert.equal(findHiddenTerms(text, terms).length, 0, 'hidden term in GitHub kit')
    for (const [, href] of text.matchAll(/\]\((https:\/\/kakosyaneduard\.ca[^)]*)\)/g)) {
      assert.ok(routes.has(new URL(href).pathname), href)
    }
  }
  const completed =
    readFileSync(join(root, 'repo-readmes/CHECKLIST.md'), 'utf8').match(/^- \[x\].+$/gm) ?? []
  assert.equal(completed.length, 5)
  assert.match(completed[0], /Approve the generated profile README/)
  assert.match(
    completed[1],
    /Publish the generated README.*6a867472810d905c73b0f373450923aac35d34ad/,
  )
  assert.match(completed[2], /Add HIDDEN_TERMS as a GitHub Actions secret/)
  assert.match(completed[3], /Pass that secret as HIDDEN_TERMS/)
  assert.match(completed[4], /publish the root personal-website README/)
})
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

test('curriculum delivery belongs to AI-First, not the ShiftKey teaching role', () => {
  const teaching = profile.roles.find((role) => role.id === 'teaching')
  assert.equal(teaching.title, 'AI Instructor')
  assert.equal(teaching.org, 'ShiftKey Labs, Dalhousie University')
  assert.match(teaching.summary, /agentic AI course/)
  assert.doesNotMatch(teaching.summary, /curriculum|Skills for Hire|provincial/i)

  const teachingCopy = resumeContent.experience.find((role) => role.roleId === 'teaching')
  assert.doesNotMatch(JSON.stringify(teachingCopy), /curriculum|Skills for Hire|metric:learners/i)
  const clientCopy = resumeContent.experience.find((role) => role.roleId === 'ai-first')
  assert.match(JSON.stringify(clientCopy), /Skills for Hire/)
  assert.match(JSON.stringify(clientCopy), /metric:learners/)
  const learners = profile.metrics.find((metric) => metric.id === 'learners')
  assert.match(
    learners.definition,
    /client engagement, separate from his teaching at ShiftKey Labs/,
  )
})

test('public copy describes hands-on leadership of a team of five developers', () => {
  for (const copy of [
    profile.roles.find((role) => role.id === 'ai-first').summary,
    resumeContent.summary,
    githubContent.role,
    projects.find((project) => project.slug === 'keystone').detail,
  ]) {
    assert.match(copy, /team of five developers/i)
    assert.doesNotMatch(copy, /co-op developers|GTM|revenue and operations/i)
  }
  assert.equal(resumeContent.skills[0].label, 'AI & LLMs')
  assert.doesNotMatch(resumeTex, /co-op developers|GTM|sales opportunities I owned/)
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
