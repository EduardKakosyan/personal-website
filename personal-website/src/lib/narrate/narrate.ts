import { validateUserInput } from '../guardrails'
import { profile } from '../../content/profile'
import { guideDestination, parseGuideResponse, type GuideAction } from '../../content/portfolio'
import { narrateInputSchema, type NarrateInput } from './input-schema'
import { buildPrompt, type ChatMessage } from './prompt'

export interface ModelRequest {
  messages: ChatMessage[]
  schema: string
  maxTokens: number
}
export type CallModel = (request: ModelRequest) => Promise<string>
// A validated action plus a same-site link the browser can follow without re-validating.
export type NarrateResult = (GuideAction & { href?: string }) | null

const MAX_BRIDGE_CHARS = 320

export function parseNarrateInput(raw: unknown): NarrateInput | null {
  const parsed = narrateInputSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

// Client names never go in the repo; on the server they can come from HIDDEN_TERMS.
function hiddenTerms(env: Record<string, string | undefined>) {
  return [...profile.hidden, ...(env.HIDDEN_TERMS ?? '').split(',')]
    .map((term) => term.trim())
    .filter(Boolean)
}
export function mentionsHiddenTerm(text: string, terms: string[]) {
  return terms.some((term) => {
    const escaped = term
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .split(/\s+/)
      .join('\\s+')
    const acronym = /[A-Z]/.test(term) && term === term.toUpperCase()
    return new RegExp(`(^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, acronym ? '' : 'i').test(text)
  })
}

// Every number in the reply must appear in what the model was given: no invented metrics.
export function numbersGrounded(reply: string, grounding: string) {
  const known = new Set(grounding.match(/\d+(?:[.,]\d+)*/g) ?? [])
  return (reply.match(/\d+(?:[.,]\d+)*/g) ?? []).every((value) => known.has(value))
}

/**
 * Validate the request, ask the model, validate the answer. Any failure returns null, and the
 * site keeps its authored line (or hands the question to the on-page guide).
 */
export async function narrate(
  raw: unknown,
  deps: { callModel: CallModel; env?: Record<string, string | undefined> },
): Promise<NarrateResult> {
  const input = parseNarrateInput(raw)
  if (!input) return null
  if (input.kind === 'question' && !validateUserInput(input.text).allowed) return null
  const prompt = buildPrompt(input)
  let output: string
  try {
    output = await deps.callModel(prompt)
  } catch {
    return null
  }
  const action = parseGuideResponse(output, input.kind === 'question' ? input.text : '')
  if (!action) return null
  if (input.kind === 'bridge' && action.reply.length > MAX_BRIDGE_CHARS) return null
  if (mentionsHiddenTerm(action.reply, hiddenTerms(deps.env ?? {}))) return null
  if (!numbersGrounded(action.reply, prompt.grounding)) return null
  const destination = guideDestination(action)
  if (!destination) return action
  return {
    ...action,
    href: destination.id ? `${destination.path}#${destination.id}` : destination.path,
  }
}
