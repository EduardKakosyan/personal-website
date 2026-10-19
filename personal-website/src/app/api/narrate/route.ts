import { narrate, parseNarrateInput } from '@/lib/narrate/narrate'
import { dgxModel } from '@/lib/narrate/dgx-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_CHARS = 2000

export async function POST(request: Request) {
  const started = Date.now()
  const text = await request.text().catch(() => '')
  let body: unknown = null
  if (text.length <= MAX_BODY_CHARS) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }
  const result = await narrate(body, { callModel: dgxModel(), env: process.env })
  // One line per request. Only validated fields, and no IP, user agent or headers.
  const input = parseNarrateInput(body)
  console.info(
    JSON.stringify({
      evt: 'narrate',
      kind: input?.kind ?? 'invalid',
      persona: input?.persona,
      chapter: input?.chapter,
      q: input?.kind === 'question' ? input.text.slice(0, 200) : undefined,
      source: result ? 'dgx' : 'script',
      ms: Date.now() - started,
    }),
  )
  return Response.json(result, { headers: { 'cache-control': 'no-store' } })
}
