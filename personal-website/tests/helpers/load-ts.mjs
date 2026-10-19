import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Load a TypeScript module the way the browser bundle sees it, without a bundler:
// transpile to CommonJS and resolve relative imports (`./profile`) to sibling .ts files.
const cache = new Map()

export function loadTs(source) {
  const file = source instanceof URL ? fileURLToPath(source) : source
  const cached = cache.get(file)
  if (cached) return cached.exports
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText
  const loaded = { exports: {} }
  cache.set(file, loaded)
  const packageRequire = createRequire(file)
  const localRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const base = resolve(dirname(file), specifier)
      const match = [base, `${base}.ts`, `${base}.tsx`].find(
        (candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate),
      )
      if (match) return loadTs(match)
    }
    return packageRequire(specifier)
  }
  new Function('require', 'module', 'exports', compiled)(localRequire, loaded, loaded.exports)
  return loaded.exports
}
