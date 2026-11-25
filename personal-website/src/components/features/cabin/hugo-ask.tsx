'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { WebLLMProvider, useWebLLMContext } from '@/components/providers/webllm-provider'
import { validateChatMessage } from '@/lib/validation'
import { sanitizeUserInput } from '@/lib/sanitizer'
import { validateUserInput } from '@/lib/guardrails'
import { namedWork } from '@/content/portfolio'
import { projects } from '@/content/projects'
import {
  ASK_MAX_LENGTH,
  HUGO_ASK_LINES,
  HUGO_QUESTIONS,
  PICK_NONE,
  checkHugoReply,
  hugoPickPrompt,
  hugoPickSchema,
  hugoPicks,
  matchPrewritten,
  parsePick,
  projectAnswer,
  questionById,
  shortlist,
  type HugoLink,
  type HugoQuestion,
} from './hugo-questions'
import type { HugoStop } from './hugo-stops'
import cabin from './cabin.module.css'
import styles from './hugo-ask.module.css'

const CHARS_PER_SECOND = 38
const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2 }
const NONE: HugoQuestion[] = []
const PICKS = hugoPicks(projects)

type Answer = { text: string; links?: HugoLink[]; id?: string }

/** What HUGO says for what the model picked (only ever approved words). */
function answerFor(pick: string | null): Answer {
  if (pick === null) return { text: HUGO_ASK_LINES.lost }
  if (pick === PICK_NONE) return { text: HUGO_ASK_LINES.unsure }
  let answer: Answer = { text: HUGO_ASK_LINES.unsure }
  if (pick.startsWith('q:')) {
    const q = questionById(pick.slice(2))
    if (q) answer = { text: q.a, links: q.links, id: q.id }
  } else if (pick.startsWith('p:')) {
    const p = projects.find((x) => x.slug === pick.slice(2))
    if (p) answer = projectAnswer(p)
  }
  return checkHugoReply(answer.text).ok ? answer : { text: HUGO_ASK_LINES.unsure }
}

/**
 * Without the model (a phone with no WebGPU, or it failed to load): the
 * approved answer that shares the most with the question, or the line that
 * says he can't think here.
 */
function answerWithoutModel(q: string): Answer {
  const best = shortlist(q, PICKS)[0]
  const answer = best ? answerFor(best.id) : null
  return answer && answer.text !== HUGO_ASK_LINES.unsure
    ? answer
    : { text: HUGO_ASK_LINES.unavailable }
}

/** What HUGO is saying on the card: the guest's question and his answer (or that he's on it). */
type Said = {
  key: number
  stop: HugoStop
  q: string
  /** The question's id, when it's one of the suggested ones. */
  id?: string
  text: string
  links?: HugoLink[]
  /** Waiting for the model to load, or for its reply. */
  waiting?: boolean
}

/**
 * What HUGO is saying right now, for the speech bubble over his head in the
 * scene (his answers aren't written on the card: Eduard, "put the stuff he is
 * saying above him instead of into a chatbot so its more realistic").
 */
export type HugoSaying = {
  /** Changes with every new answer (the bubble types it out afresh). */
  key: number
  text: string
  links?: HugoLink[]
  /** In place of the answer while he's waking the model up or thinking. */
  status: string | null
}

type Props = {
  stop: HugoStop
  open: boolean
  /** A phone: no keycaps. */
  touch: boolean
  onClose: () => void
  /** HUGO is answering (his antennas go in the scene). */
  onTalking: (talking: boolean) => void
  /** What he's saying (or null: nothing), for the bubble over him. */
  onSay: (saying: HugoSaying | null) => void
}

/**
 * HUGO's card (A48): tap HUGO (or Q) and he offers two or three questions
 * about the stop the guest is at, each with an answer written in advance,
 * plus a box to ask anything. The card only holds the questions; what HUGO
 * says back goes in a speech bubble over him in the scene (`onSay`). Typed questions go through the input
 * checks (lib/validation, lib/sanitizer, lib/guardrails) and, only once the
 * guest types, a small on-device model (webllm-provider). Stays
 * mounted once opened, so the model isn't loaded twice.
 */
export function HugoAsk(props: Props) {
  return (
    <WebLLMProvider>
      <Card {...props} />
    </WebLLMProvider>
  )
}

function isTyping() {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

/** Types a line out a letter at a time, like the speech bubbles. */
function useTyped(text: string, key: number) {
  const [state, setState] = useState({ key, shown: 0 })
  useEffect(() => {
    if (!text) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let count = reduce ? text.length - 1 : 0
    const id = window.setInterval(() => {
      count += 1
      setState({ key, shown: count })
      if (count >= text.length) window.clearInterval(id)
    }, 1000 / CHARS_PER_SECOND)
    return () => window.clearInterval(id)
  }, [text, key])
  return state.key === key ? state.shown : 0
}

function Card({ stop, open, touch, onClose, onTalking, onSay }: Props) {
  const llm = useWebLLMContext()
  const { initialize, cancel, generateStructuredResponse, engine, isInitializing, isGenerating } =
    llm
  const here = HUGO_QUESTIONS[stop]
  const questions = here?.questions ?? NONE
  const [said, setSaid] = useState<Said | null>(null)
  const [input, setInput] = useState('')
  /** The guest has typed something: load the model (once, if the device can run it). */
  const [wanted, setWanted] = useState(false)
  const [failed, setFailed] = useState(false)
  const keyRef = useRef(0)
  const request = useRef(0)
  /** A typed question waiting for the model to finish loading. */
  const pending = useRef<{ key: number; text: string } | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  /** There's more of the card below what's showing (a phone's card is short). */
  const [more, setMore] = useState(false)
  const checkMore = useCallback(() => {
    const el = body.current
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 12)
  }, [])
  useEffect(() => {
    const el = body.current
    if (!el) return
    // (whatever changes on the card: an answer, its links, the card's size)
    const changed = new MutationObserver(checkMore)
    changed.observe(el, { childList: true, subtree: true })
    const resized = new ResizeObserver(checkMore)
    resized.observe(el)
    return () => {
      changed.disconnect()
      resized.disconnect()
    }
  }, [checkMore])

  // The answer belongs to the stop it was asked at.
  const shownSaid = said && said.stop === stop ? said : null
  const shown = useTyped(shownSaid?.waiting ? '' : (shownSaid?.text ?? ''), shownSaid?.key ?? 0)
  const typing = open && shownSaid !== null && !shownSaid.waiting && shown < shownSaid.text.length
  useEffect(() => {
    onTalking(typing)
  }, [typing, onTalking])
  // a new answer starts at the top (a phone shows only part of the card)
  const saidKey = shownSaid?.key
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0
  }, [saidKey])

  const say = useCallback(
    (q: string, text: string, extra: Partial<Pick<Said, 'id' | 'links' | 'waiting'>> = {}) => {
      keyRef.current += 1
      const next: Said = { key: keyRef.current, stop, q, text, ...extra }
      setSaid(next)
      return next.key
    },
    [stop],
  )

  // Load the model only once the guest types (and only where it can run).
  const support = llm.support.status
  const modelGone = failed || support === 'unsupported'
  useEffect(() => {
    if (!wanted || support !== 'supported' || engine || isInitializing || failed) return
    initialize().catch(() => setFailed(true))
  }, [wanted, support, engine, isInitializing, failed, initialize])

  /**
   * Ask the model which of HUGO's approved answers fits the question (it
   * never writes the answer itself; see `hugoPickPrompt`).
   */
  const generate = useCallback(
    async (key: number, q: string) => {
      const token = ++request.current
      let answer: Answer = { text: HUGO_ASK_LINES.lost }
      const short = shortlist(q, PICKS)
      try {
        const output = await generateStructuredResponse(
          [
            { role: 'system', content: hugoPickPrompt(stop, short) },
            { role: 'user', content: q },
          ],
          hugoPickSchema(short),
        )
        const pick = parsePick(output, short)
        answer = answerFor(pick)
        // (in development: what the shortlist offered and what the model picked)
        if (process.env.NODE_ENV !== 'production')
          Object.assign(window, {
            __hugoLastPick: { q, offered: short.map((p) => p.id), output, pick },
          })
      } catch {
        // (the model fell over: the closest approved answer instead)
        answer = short.length ? answerFor(short[0].id) : { text: HUGO_ASK_LINES.lost }
      }
      if (token !== request.current) return
      setSaid((s) => (s && s.key === key ? { ...s, ...answer, waiting: false } : s))
    },
    [generateStructuredResponse, stop],
  )

  // A question that waited for the model: ask it once loaded, or say he can't.
  useEffect(() => {
    const p = pending.current
    if (!p) return
    if (engine && !isGenerating) {
      pending.current = null
      void generate(p.key, p.text)
    } else if (modelGone || (llm.error && !isInitializing)) {
      pending.current = null
      const id = window.setTimeout(
        () =>
          setSaid((s) =>
            s && s.key === p.key ? { ...s, ...answerWithoutModel(p.text), waiting: false } : s,
          ),
        0,
      )
      return () => window.clearTimeout(id)
    }
  }, [engine, isGenerating, llm.error, isInitializing, modelGone, generate])

  const pick = useCallback(
    (q: HugoQuestion) => {
      request.current += 1
      pending.current = null
      say(q.q, q.a, { id: q.id, links: q.links })
    },
    [say],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const raw = input.trim()
    if (!raw || shownSaid?.waiting) return
    const valid = validateChatMessage({ content: raw })
    if (!valid.success || raw.length > ASK_MAX_LENGTH) {
      say(raw.slice(0, 80), HUGO_ASK_LINES.tooLong)
      return
    }
    const q = sanitizeUserInput(valid.data.content)
    setInput('')
    request.current += 1
    pending.current = null
    // one of the suggested questions, typed: the answer written for it
    const pre = matchPrewritten(q, stop)
    if (pre) {
      say(q, pre.a, { id: pre.id, links: pre.links })
      return
    }
    const guard = validateUserInput(q, { page: `${here?.name ?? 'the cabin'} at Eduard’s place` })
    if (!guard.allowed) {
      say(
        q,
        guard.reason === 'Off-topic question' ? HUGO_ASK_LINES.offTopic : HUGO_ASK_LINES.refuse,
      )
      return
    }
    // a project named by its title: its own line, no model needed
    const named = namedWork(q)
    const project = named && projects.find((p) => p.slug === named.slug)
    if (project) {
      const a = projectAnswer(project)
      if (checkHugoReply(a.text).ok) {
        say(q, a.text, { links: a.links })
        return
      }
    }
    if (modelGone) {
      const a = answerWithoutModel(q)
      say(q, a.text, { id: a.id, links: a.links })
      return
    }
    // nothing HUGO knows comes close: no need to ask the model
    if (!shortlist(q, PICKS).length) {
      say(q, HUGO_ASK_LINES.unsure)
      if (process.env.NODE_ENV !== 'production')
        Object.assign(window, { __hugoLastPick: { q, offered: [], output: null, pick: null } })
      return
    }
    const key = say(q, '', { waiting: true })
    if (engine && !isGenerating) void generate(key, q)
    else {
      setWanted(true)
      pending.current = { key, text: q }
    }
  }

  // Closing the card drops whatever HUGO was still working on.
  useEffect(() => {
    if (open) {
      root.current?.focus({ preventScroll: true })
      return
    }
    request.current += 1
    pending.current = null
    cancel()
  }, [open, cancel])

  // Keys while the card is up (capture phase, so the scene never sees them):
  // Esc closes it; 1–3 pick a question. Typing in the box is left alone.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.code === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        onClose()
        return
      }
      if (isTyping()) return
      const n = DIGITS[e.code]
      if (n !== undefined && questions[n]) {
        e.stopPropagation()
        e.preventDefault()
        pick(questions[n])
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose, pick, questions])

  // What he's saying goes up to the scene, for the bubble over his head.
  const status = shownSaid?.waiting
    ? isInitializing || (!engine && support !== 'unsupported')
      ? `${HUGO_ASK_LINES.waking}… ${llm.downloadProgress}%`
      : HUGO_ASK_LINES.thinking
    : null
  const sayingKey = open && shownSaid ? shownSaid.key : null
  const sayingText = shownSaid?.text ?? ''
  const sayingLinks = shownSaid?.links
  useEffect(() => {
    onSay(
      sayingKey === null ? null : { key: sayingKey, text: sayingText, links: sayingLinks, status },
    )
  }, [sayingKey, sayingText, sayingLinks, status, onSay])
  useEffect(() => () => onSay(null), [onSay])

  if (!open) return null

  return (
    <div
      ref={root}
      className={`${styles.askCard} ${cabin.pixel}`}
      role="dialog"
      aria-modal="false"
      aria-label={`Ask HUGO: ${here?.name ?? 'here'}`}
      tabIndex={-1}
    >
      <div className={`${cabin.card} ${styles.paper}`}>
        <div className={styles.head}>
          <div className={styles.title}>
            <span className={styles.label}>Ask HUGO</span>
            <h2>{here?.name ?? 'Here'}</h2>
          </div>
          <button type="button" className={cabin.paperClose} onClick={onClose}>
            {!touch && <kbd className={`${cabin.promptKey} ${styles.closeKey}`}>Esc</kbd>}
            Close
          </button>
        </div>
        <div ref={body} className={styles.body} onScroll={checkMore}>
          {shownSaid && (
            <div className={styles.answer} aria-live="polite">
              <p className={styles.you}>
                <span>You asked</span> {shownSaid.q}
              </p>
            </div>
          )}
          <ol className={styles.questions} aria-label="Questions for HUGO">
            {questions.map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  className={styles.question}
                  aria-current={shownSaid?.id === q.id ? 'true' : undefined}
                  onClick={() => pick(q)}
                >
                  {!touch && <kbd className={cabin.promptKey}>{i + 1}</kbd>}
                  <span>{q.q}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        {more && (
          <button
            type="button"
            className={styles.more}
            aria-label="More below"
            onClick={() => body.current?.scrollBy({ top: body.current.clientHeight * 0.8 })}
          >
            ▼ more
          </button>
        )}
        <form className={styles.form} onSubmit={submit}>
          <label className="sr-only" htmlFor="hugo-ask-input">
            Ask HUGO anything about Eduard
          </label>
          <input
            id="hugo-ask-input"
            className={styles.input}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (e.target.value.trim()) setWanted(true)
            }}
            // (the scene's keys never see what's typed here)
            onKeyDown={(e) => {
              if (e.key !== 'Escape') e.stopPropagation()
            }}
            maxLength={ASK_MAX_LENGTH}
            placeholder={HUGO_ASK_LINES.placeholder}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button
            type="submit"
            className={`${cabin.panelButton} ${styles.askButton}`}
            disabled={!input.trim() || Boolean(shownSaid?.waiting)}
          >
            Ask
          </button>
        </form>
        <p className={styles.foot}>
          {wanted && isInitializing && !shownSaid?.waiting
            ? `${HUGO_ASK_LINES.waking}… ${llm.downloadProgress}%`
            : HUGO_ASK_LINES.privacy}
        </p>
      </div>
    </div>
  )
}
