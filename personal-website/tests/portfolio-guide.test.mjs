import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

// Exercise the same TypeScript contract used by the browser, without a DOM or model download.
const sourceUrl = new URL('../src/content/portfolio.ts', import.meta.url)
const compiled = ts.transpileModule(readFileSync(sourceUrl, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const fixtureModule = { exports: {} }
new Function('require', 'module', 'exports', compiled)(
  createRequire(sourceUrl),
  fixtureModule,
  fixtureModule.exports,
)
const {
  guideActionSchema,
  guideOutputSchema,
  guideOutputSchemaForQuery,
  parseGuideResponse,
  guideDestination,
  directGuideAction,
  retrieveWork,
  portfolioWorks,
  guideSections,
  projectCommands,
  projectCommandAction,
} = fixtureModule.exports

test('the local-AI shortcut opens the autonomy case study without inference', () => {
  const action = directGuideAction('Show me Eduard’s local AI work')
  assert.equal(action.target, 'dgx-autonomy')
  assert.deepEqual(guideDestination(action), { path: '/projects/dgx-autonomy' })
})

test('verification tours resolve to a known section on the case study', () => {
  const action = directGuideAction('Show me the verification checks')
  assert.deepEqual(guideDestination(action), {
    path: '/projects/dgx-autonomy',
    id: 'dgx-verification',
  })
})

test('questions about a project do not initiate navigation', () => {
  assert.equal(directGuideAction('How does HUGO work?'), null)
  assert.equal(retrieveWork('How does HUGO work?')[0].slug, 'hugo')
})

test('removed projects are absent from guide knowledge and cannot be opened', () => {
  assert.equal(
    portfolioWorks.some((work) => work.slug === 'acdc-dashboard'),
    false,
  )
  assert.deepEqual(retrieveWork('ACDC Dashboard'), [])
  assert.equal(directGuideAction('Show me the ACDC Dashboard'), null)
  const action = { action: 'open_project', target: 'acdc-dashboard', reply: 'Open it' }
  assert.equal(guideActionSchema.safeParse(action).success, false)
  assert.equal(guideDestination(action), null)
})

test('unknown topics do not pick a project based on generic words', () => {
  assert.deepEqual(retrieveWork('Tell me about Eduard’s underwater basketweaving'), [])
  assert.equal(directGuideAction('Show me underwater basketweaving'), null)
})

test('biography and selected-work requests have explicit destinations', () => {
  assert.deepEqual(guideDestination(directGuideAction('Show me his background')), {
    path: '/',
    id: 'about',
  })
  assert.deepEqual(guideDestination(directGuideAction('Show me all projects')), {
    path: '/',
    id: 'selected-work',
  })
})

test('external URLs, script URLs, traversal and unknown actions cannot execute', () => {
  for (const target of [
    'https://evil.example',
    'javascript:alert(1)',
    '../../admin',
    '__proto__',
    'voxcoach',
  ]) {
    const action = { action: 'open_project', target, reply: 'Go here' }
    assert.equal(guideActionSchema.safeParse(action).success, false)
    assert.equal(guideDestination(action), null)
  }
  assert.equal(
    guideDestination({ action: 'run_shell', target: 'dgx-autonomy', reply: 'Go here' }),
    null,
  )
})

test('extra tool arguments and mismatched action targets are rejected', () => {
  for (const action of [
    { action: 'open_project', target: 'hugo', reply: 'HUGO', url: 'https://evil.example' },
    { action: 'answer', target: 'hugo', reply: 'HUGO' },
    { action: 'highlight_section', target: 'hugo', reply: 'HUGO' },
    { action: 'open_project', target: 'dgx-verification', reply: 'Verify' },
    { action: 'answer', target: '', reply: '' },
    { action: 'answer', target: '', reply: 'a'.repeat(1201) },
  ])
    assert.equal(guideActionSchema.safeParse(action).success, false)
})

test('every allowed destination stays within the portfolio', () => {
  for (const work of portfolioWorks) {
    assert.deepEqual(
      guideDestination({ action: 'open_project', target: work.slug, reply: work.title }),
      { path: `/projects/${work.slug}` },
    )
  }
  for (const [target, section] of Object.entries(guideSections)) {
    assert.deepEqual(
      guideDestination({ action: 'highlight_section', target, reply: section.label }),
      { path: section.path, id: section.id },
    )
  }
  assert.equal(guideDestination({ action: 'answer', target: '', reply: 'A grounded answer' }), null)
})

test('project commands keep HUGO and Shoreline test questions on their own pages', () => {
  assert.deepEqual(guideDestination(directGuideAction('Show me the tests', 'hugo')), {
    path: '/projects/hugo',
    id: 'testing',
  })
  assert.deepEqual(guideDestination(directGuideAction('Show me the checks', 'shoreline')), {
    path: '/projects/shoreline',
    id: 'evidence',
  })
  assert.equal(directGuideAction('How does it work?', 'hugo'), null)
})

test('an explicitly named project takes precedence over the current page', () => {
  assert.deepEqual(
    guideDestination(directGuideAction('Show me HUGO voice pipeline', 'dgx-autonomy')),
    {
      path: '/projects/hugo',
      id: 'how-it-works',
    },
  )
})

test('every indexed project has distinct commands that resolve without a model', () => {
  const labels = new Set()
  for (const work of portfolioWorks) {
    const commands = projectCommands[work.slug]
    assert.ok(commands.length >= 3)
    assert.equal(new Set(commands.map((command) => command.id)).size, commands.length)
    labels.add(commands.map((command) => command.label).join('|'))
    for (const command of commands) {
      const action = projectCommandAction(work.slug, command.id)
      assert.equal(guideActionSchema.safeParse(action).success, true)
      assert.ok(action.reply.length > 20)
      const destination = guideDestination(action)
      if (destination) assert.equal(destination.path, `/projects/${work.slug}`)
    }
  }
  assert.equal(labels.size, portfolioWorks.length)
})

test('command IDs cannot cross project boundaries or expand navigation permissions', () => {
  assert.equal(projectCommandAction('hugo', 'models'), null)
  assert.equal(projectCommandAction('__proto__', 'voice'), null)
  assert.equal(projectCommandAction('hugo', 'https://example.com'), null)
  assert.equal(projectCommandAction('acdc-dashboard', 'checks'), null)
  assert.equal(projectCommandAction('hugo', '__proto__'), null)
})

test('the reported introductory question only permits an answer with an empty target', () => {
  const schema = JSON.parse(guideOutputSchemaForQuery('what is this about?'))
  assert.deepEqual(schema.properties.action.enum, ['answer'])
  assert.deepEqual(schema.properties.target.enum, [''])
  assert.deepEqual(
    parseGuideResponse(
      JSON.stringify({
        action: 'answer',
        target: '',
        reply: 'This is Eduard’s portfolio.',
      }),
      'what is this about?',
    ),
    {
      action: 'answer',
      target: '',
      reply: 'This is Eduard’s portfolio.',
    },
  )
})

test('every action-target pair allowed during generation also passes execution validation', () => {
  const schema = JSON.parse(guideOutputSchema)
  for (const branch of schema.anyOf) {
    for (const action of branch.properties.action.enum) {
      for (const target of branch.properties.target.enum) {
        assert.equal(
          guideActionSchema.safeParse({ action, target, reply: 'Details.' }).success,
          true,
        )
      }
    }
  }
})

test('invalid, truncated, and unrequested model actions return the notes fallback signal', () => {
  for (const output of [
    '{"action":"answer","reply":',
    JSON.stringify({ action: 'answer', target: 'hugo', reply: 'Details.' }),
    JSON.stringify({ action: 'open_project', target: 'hugo', reply: 'Details.' }),
    JSON.stringify({ action: 'answer', target: '', reply: '   ' }),
    JSON.stringify({ action: 'answer', target: '', reply: 'x'.repeat(1201) }),
    JSON.stringify({ action: 'answer', target: '', reply: 'Details.', url: 'https://evil.test' }),
  ])
    assert.equal(parseGuideResponse(output, 'what is this about?'), null)
  assert.equal(
    parseGuideResponse(
      JSON.stringify({
        action: 'open_project',
        target: 'https://evil.test',
        reply: 'Details.',
      }),
      'Open a project',
    ),
    null,
  )
  assert.equal(
    parseGuideResponse(
      JSON.stringify({
        action: 'open_project',
        target: 'hugo',
        reply: 'Here’s HUGO.',
      }),
      'Open HUGO',
    ).target,
    'hugo',
  )
})
