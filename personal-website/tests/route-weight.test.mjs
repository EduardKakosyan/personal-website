import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const src = fileURLToPath(new URL('../src/', import.meta.url))
const forbidden = /^(three(?:\/|$)|@react-three\/|@mlc-ai\/web-llm(?:\/|$)|lenis$)/
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  )

function imports(file) {
  const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  return ast.statements.flatMap((node) => {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) return []
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return []
    if (node.isTypeOnly || node.importClause?.isTypeOnly) return []
    return [node.moduleSpecifier.text]
  })
}

function visit(file, seen = new Set(), chain = []) {
  if (seen.has(file)) return
  seen.add(file)
  for (const specifier of imports(file)) {
    assert.ok(!forbidden.test(specifier), [...chain, file, specifier].join(' -> '))
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue
    const base = specifier.startsWith('@/')
      ? path.join(src, specifier.slice(2))
      : path.resolve(path.dirname(file), specifier)
    if (/\.(css|json)$/.test(base)) continue
    const target = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}/index.ts`,
      `${base}/index.tsx`,
    ].find((candidate) => existsSync(candidate) && /\.[cm]?[jt]sx?$/.test(candidate))
    assert.ok(target, `Unresolved local import ${specifier} from ${file}`)
    visit(target, seen, [...chain, file])
  }
  return seen
}

for (const entry of files(path.join(src, 'app')).filter(
  (file) => /(?:page|layout)\.tsx$/.test(file) && file !== path.join(src, 'app/page.tsx'),
)) {
  test(`${path.relative(src, entry)} has no eager 3D, model or smooth-scroll dependency`, () => {
    const reached = visit(entry)
    assert.ok(![...reached].some((file) => /(?:guide-panel|webllm-provider)\.tsx$/.test(file)))
  })
}

test('on-demand guide has no static 3D dependencies', () => {
  visit(path.join(src, 'components/features/guide/guide-panel.tsx'))
})

test('guide panel mounts only when open through a dynamic boundary', () => {
  const launcher = readFileSync(
    path.join(src, 'components/features/guide/guide-launcher.tsx'),
    'utf8',
  )
  assert.match(launcher, /dynamic\(/)
  assert.match(launcher, /import\('\.\/guide-panel'\)/)
  assert.match(launcher, /open && <LazyGuidePanel/)
})

test('initial story client islands do not import profile validation or guide knowledge', () => {
  for (const entry of [
    'components/layouts/header-client.tsx',
    'components/features/about/resume-link-client.tsx',
    'components/features/story/story-scroller.tsx',
    'components/features/guide/guide-launcher.tsx',
  ]) {
    const reached = visit(path.join(src, entry))
    for (const file of reached) {
      assert.ok(
        !/content\/(profile|portfolio|story-copy)\.ts$/.test(file),
        `${entry} reaches ${file}`,
      )
      assert.ok(!imports(file).includes('zod'), `${entry} imports Zod through ${file}`)
    }
  }
})
