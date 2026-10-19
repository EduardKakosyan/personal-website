import type { Metric, Surface } from '../../src/content/profile.ts'
import { fillSegments } from './fill.mts'

// Plain copy → LaTeX for pdfLaTeX with the default OT1 fonts. Anything that is not mapped here
// throws instead of rendering as a wrong glyph.
const replacements: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '#': '\\#',
  '%': '\\%',
  _: '\\_',
  '^': '\\textasciicircum{}',
  '~': '\\textasciitilde{}',
  '<': '\\textless{}',
  '>': '\\textgreater{}',
  '|': '$|$',
  '—': '---',
  '–': '--',
  '→': '$\\rightarrow$',
  '·': '$\\cdot$',
  '’': "'",
  '‘': '`',
  '“': '``',
  '”': "''",
  '…': '\\ldots{}',
  é: "\\'e",
}

export function tex(text: string): string {
  let out = ''
  for (const char of text) {
    const mapped = replacements[char]
    if (mapped !== undefined) out += mapped
    else if (char === '"') throw new Error(`Use typographic quotes instead of '"' in: ${text}`)
    else if (/[\x20-\x7e]/.test(char)) out += char
    else throw new Error(`No LaTeX mapping for ${JSON.stringify(char)} in: ${text}`)
  }
  return out
}

/** Copy with `{metric:id}` placeholders → LaTeX, with each filled number (not its detail) in bold. */
export function texCopy(copy: string, metrics: Metric[], surface: Surface): string {
  return fillSegments(copy, metrics, surface)
    .map((segment) =>
      segment.kind === 'metric' && segment.field === 'value'
        ? `\\textbf{${tex(segment.text)}}`
        : tex(segment.text),
    )
    .join('')
}

/** URLs are passed to \href verbatim, so only allow characters that need no escaping. */
export function texUrl(url: string): string {
  if (!/^(https:\/\/|mailto:)[A-Za-z0-9:/.@-]+$/.test(url)) {
    throw new Error(`URL needs escaping before it can go in \\href: ${url}`)
  }
  return url
}
