import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Client names must never be committed, not even as a deny-list. They come from:
//   - hidden-terms.local.txt (gitignored, one term per line, # for comments), and/or
//   - HIDDEN_TERMS (comma-separated; e.g. a GitHub Actions secret, so CI runs the guard too).
export const localHiddenTermsFile = fileURLToPath(
  new URL('../../hidden-terms.local.txt', import.meta.url),
)

export function localHiddenTerms(env: NodeJS.ProcessEnv = process.env): string[] {
  const fromFile = existsSync(localHiddenTermsFile)
    ? readFileSync(localHiddenTermsFile, 'utf8').split('\n')
    : []
  const fromEnv = (env.HIDDEN_TERMS ?? '').split(',')
  const terms = [...fromFile, ...fromEnv]
    .map((term) => term.trim())
    .filter((term) => term && !term.startsWith('#'))
  return [...new Set(terms)]
}

/**
 * Whole-word match. All-caps acronyms match case-sensitively (so an acronym doesn't flag the same
 * letters in lowercase code); names match in any case. Spaces match any whitespace run.
 */
export function hiddenTermPattern(term: string): RegExp {
  const escaped = term
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .split(/\s+/)
    .join('\\s+')
  const acronym = /[A-Z]/.test(term) && term === term.toUpperCase()
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, acronym ? '' : 'i')
}

/** The hidden terms found in `text`. */
export function findHiddenTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => hiddenTermPattern(term).test(text))
}
