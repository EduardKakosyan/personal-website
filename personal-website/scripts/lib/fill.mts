import type { Metric, Surface } from '../../src/content/profile.ts'

// Copy never contains a literal count. It names a defined metric instead:
//   {metric:projects}         → the metric's value, e.g. '39'
//   {metric:learners.detail}  → the metric's qualifier, e.g. '88% completion'
// An unknown id, a missing detail or a metric not cleared for the surface throws,
// so a number can only reach an artifact if profile.ts defines it for that artifact.

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'metric'; text: string; id: string; field: 'value' | 'detail' }

const placeholder = /\{metric:([A-Za-z]+)(?:\.(detail))?\}/g

export function fillSegments(copy: string, metrics: Metric[], surface: Surface): Segment[] {
  const segments: Segment[] = []
  let cursor = 0
  for (const match of copy.matchAll(placeholder)) {
    const [token, id, field] = match
    const metric = metrics.find((candidate) => candidate.id === id)
    if (!metric) throw new Error(`Unknown metric "${id}" in: ${copy}`)
    if (!metric.surfaces.includes(surface)) {
      throw new Error(`Metric "${id}" is not cleared for the ${surface} surface`)
    }
    const text = field === 'detail' ? metric.detail : metric.value
    if (!text) throw new Error(`Metric "${id}" has no ${field ?? 'value'}`)
    if (match.index > cursor) segments.push({ kind: 'text', text: copy.slice(cursor, match.index) })
    segments.push({ kind: 'metric', text, id, field: field === 'detail' ? 'detail' : 'value' })
    cursor = match.index + token.length
  }
  if (cursor < copy.length) segments.push({ kind: 'text', text: copy.slice(cursor) })
  if (segments.some((segment) => segment.kind === 'text' && segment.text.includes('{metric:'))) {
    throw new Error(`Malformed metric placeholder in: ${copy}`)
  }
  return segments
}

export function fill(copy: string, metrics: Metric[], surface: Surface): string {
  return fillSegments(copy, metrics, surface)
    .map((segment) => segment.text)
    .join('')
}
