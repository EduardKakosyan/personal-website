'use client'

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowUp,
  ArrowUpRight,
  X,
  Cpu,
  LoaderCircle,
  Square,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { useGuide } from '@/components/providers/guide-provider'
import { useWebLLMContext, MODEL_TIERS } from '@/components/providers/webllm-provider'
import {
  directGuideAction,
  allowsGuideNavigation,
  guideActionSchema,
  guideDestination,
  guideOutputSchemaForQuery,
  parseGuideResponse,
  portfolioContext,
  portfolioWorks,
  projectCommands,
  projectCommandAction,
  type ProjectCommand,
  retrieveWork,
  guideSections,
  type GuideAction,
  type Work,
} from '@/content/portfolio'
import { FlyingAgent } from '@/components/features/flying-agent'
import { validateChatMessage } from '@/lib/validation'
import { sanitizeUserInput } from '@/lib/sanitizer'
import { validateUserInput } from '@/lib/guardrails'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: Work[]
  mode?: 'index' | 'model'
}
const welcome: Message = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi, I’m EK—01, Eduard’s portfolio guide. I can find project details or open a case study for you.',
}

export function PortfolioGuide() {
  const { open, mood, prompt, pointAt, clearPrompt, closeGuide, setMood } = useGuide()
  const {
    engine,
    isInitializing,
    isGenerating,
    isSupported,
    support,
    currentModel,
    downloadProgress,
    error,
    initialize,
    cancel,
    generateStructuredResponse,
    switchModel,
  } = useWebLLMContext()
  const [messages, setMessages] = useState<Message[]>([welcome])
  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [notice, setNotice] = useState('')
  const [destination, setDestination] = useState<{ path: string; id?: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const request = useRef(0)
  const sending = useRef(false)
  const usedPrompt = useRef<string | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const presentedTarget = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const currentProject = portfolioWorks.find((work) => pathname === `/projects/${work.slug}`)
  const commands = currentProject ? projectCommands[currentProject.slug] : []

  useEffect(() => {
    if (!open) return
    returnFocus.current =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : null
    inputRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        request.current += 1
        cancel()
        closeGuide()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : presentedTarget.current
      if (target?.isConnected) target.focus({ preventScroll: true })
      else
        document
          .querySelector<HTMLButtonElement>('.flying-agent-character')
          ?.focus({ preventScroll: true })
    }
  }, [open, closeGuide, cancel])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isGenerating])

  useEffect(() => {
    if (!destination || pathname !== destination.path) return
    let frame = 0
    let attempts = 0
    let highlightTimer: ReturnType<typeof setTimeout> | undefined
    let highlighted: HTMLElement | null = null
    const arrive = () => {
      const target = destination.id
        ? document.getElementById(destination.id)
        : document.querySelector<HTMLElement>('main h1')
      if (!target && attempts++ < 90) {
        frame = requestAnimationFrame(arrive)
        return
      }
      if (target) {
        target.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
          block: 'start',
        })
        target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
        presentedTarget.current = target
        pointAt(target)
        target.classList.add('guide-highlight')
        highlighted = target
        highlightTimer = setTimeout(() => target.classList.remove('guide-highlight'), 4000)
      } else setNotice('The page opened. That section is not available here.')
      setMood('presenting')
    }
    frame = requestAnimationFrame(arrive)
    return () => {
      cancelAnimationFrame(frame)
      if (highlightTimer) clearTimeout(highlightTimer)
      highlighted?.classList.remove('guide-highlight')
    }
  }, [destination, pathname, setMood, pointAt])

  const execute = useCallback(
    (action: GuideAction) => {
      const next = guideDestination(action)
      if (!next) {
        setMood('presenting')
        return
      }
      setMood('navigating')
      pointAt(null)
      setDestination(next)
      if (pathname !== next.path) router.push(next.path, { scroll: false })
    },
    [pathname, router, setMood, pointAt],
  )

  const send = useCallback(
    async (raw: string) => {
      if (sending.current || !raw.trim()) return
      const validation = validateChatMessage({ content: raw.trim() })
      if (!validation.success) {
        setNotice(validation.errors[0])
        return
      }
      const text = sanitizeUserInput(validation.data.content)
      const guardrail = validateUserInput(text)
      const token = ++request.current
      setInput('')
      setNotice('')
      setMessages((previous) =>
        [...previous, { id: crypto.randomUUID(), role: 'user' as const, text }].slice(-20),
      )
      if (!guardrail.allowed) {
        setMood('confused')
        setMessages((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: guardrail.suggestedResponse ?? 'Ask me about Eduard’s work.',
          },
        ])
        return
      }
      const sources = retrieveWork(currentProject ? `${text} ${currentProject.title}` : text)
      if (!sources.length && /\b(this|site|website|portfolio)\b/i.test(text)) {
        sources.push(...portfolioWorks.slice(0, 3))
      }
      const notesReply = sources.length
        ? sources
            .slice(0, 2)
            .map((work) => `${work.title}: ${work.summary}`)
            .join('\n\n')
        : /\b(eduard|background|skills|contact|experience|education)\b/i.test(text)
          ? 'Eduard builds local AI, autonomous systems and business tools at AI-First Consulting in Halifax. He is a Dalhousie CS graduate and also teaches AI courses and workshops. Reach him at eduard@ai-first.ca.'
          : 'I couldn’t find that in the project notes. Try asking about dgx-autonomy, HUGO, or Shoreline.'
      const direct = directGuideAction(text, currentProject?.slug)
      if (direct) {
        setMessages((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: direct.reply,
            sources,
            mode: 'index',
          },
        ])
        execute(direct)
        return
      }
      if (!engine) {
        setMessages((previous) => [
          ...previous,
          { id: crypto.randomUUID(), role: 'assistant', text: notesReply, sources, mode: 'index' },
        ])
        setMood('presenting')
        return
      }
      sending.current = true
      setMood('thinking')
      try {
        const output = await generateStructuredResponse(
          [
            {
              role: 'system',
              content: `${portfolioContext}\nThe visitor is viewing ${currentProject?.title ?? 'the portfolio homepage'}. Resolve questions like 'this project' in that context.\n${allowsGuideNavigation(text) ? `Return JSON with action, target and reply. Allowed project IDs: ${portfolioWorks.map((work) => work.slug).join(', ')}. Allowed section IDs: ${Object.keys(guideSections).join(', ')}. For an answer use target="".` : 'Answer the question about the current page. Return JSON with action="answer", target="", and your explanation in reply. Keep it to two or three sentences.'} Retrieve evidence only from these notes:\n${sources.map((work) => `${work.title} [${work.slug}]: ${work.summary} ${work.detail}`).join('\n') || 'No matching project found.'}`,
            },
            ...messages
              .slice(-4)
              .map((message) => ({ role: message.role, content: message.text.slice(0, 500) })),
            { role: 'user', content: text },
          ],
          guideOutputSchemaForQuery(text),
        )
        if (token !== request.current) return
        const action = parseGuideResponse(output, text)
        if (!action) {
          setMessages((previous) => [
            ...previous,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: notesReply,
              sources,
              mode: 'index',
            },
          ])
          setNotice('I couldn’t finish that reply. Here are the project notes.')
          setMood('presenting')
          return
        }
        setMessages((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: action.reply,
            sources,
            mode: 'model',
          },
        ])
        execute(action)
      } catch (cause) {
        if (token === request.current) {
          setMood('confused')
          setNotice(
            cause instanceof Error ? cause.message : 'That reply did not finish. Please retry.',
          )
        }
      } finally {
        sending.current = false
      }
    },
    [engine, execute, generateStructuredResponse, messages, setMood, currentProject],
  )

  useEffect(() => {
    if (!open || !prompt) {
      usedPrompt.current = null
      return
    }
    if (usedPrompt.current === prompt) return
    usedPrompt.current = prompt
    clearPrompt()
    void send(prompt)
  }, [open, prompt, clearPrompt, send])

  const stop = () => {
    request.current += 1
    cancel()
    setMood('ready')
    setNotice('Reply stopped. You can keep exploring.')
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }
  const enable = () => {
    setNotice('')
    setMood('thinking')
    void initialize()
      .then(() => setMood('ready'))
      .catch((cause: unknown) => {
        setMood('confused')
        setNotice(cause instanceof Error ? cause.message : 'Could not load local AI.')
      })
  }

  const runCommand = (command: ProjectCommand) => {
    if (!currentProject || isGenerating || sending.current) return
    const action = projectCommandAction(currentProject.slug, command.id)
    if (!action) return
    setNotice('')
    setInput('')
    setMessages((previous) =>
      [
        ...previous,
        { id: crypto.randomUUID(), role: 'user' as const, text: command.question },
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          text: action.reply,
          sources: [currentProject],
          mode: 'index' as const,
        },
      ].slice(-20),
    )
    execute(action)
  }

  if (!open) return <FlyingAgent />
  const latest = messages.filter((message) => message.role === 'assistant').at(-1) ?? welcome
  const pageWelcome =
    currentProject && latest.id === 'welcome'
      ? { ...welcome, text: `You’re looking at ${currentProject.title}. ${currentProject.summary}` }
      : latest
  const visibleMessages = showHistory ? messages : [pageWelcome]
  return (
    <FlyingAgent>
      <section className="agent-speech-content" aria-label="EK—01 portfolio agent" data-mood={mood}>
        <header className="guide-header">
          <div>
            <strong>EK—01</strong>
            <small>
              {isGenerating
                ? 'Reading the project notes…'
                : engine
                  ? 'AI running on your device'
                  : currentProject
                    ? `Exploring ${currentProject.title}`
                    : 'Your guide to the work'}
            </small>
          </div>
          <button
            onClick={() => {
              stop()
              closeGuide()
            }}
            aria-label="Close guide"
          >
            <X size={18} />
          </button>
        </header>
        <div
          className="guide-messages"
          ref={scrollRef}
          role="log"
          aria-label="Guide conversation"
          aria-live="polite"
        >
          {visibleMessages.map((message) => (
            <div className={`guide-message guide-message-${message.role}`} key={message.id}>
              {message.mode && (
                <small>{message.mode === 'model' ? 'LOCAL AI' : 'PROJECT NOTES'}</small>
              )}
              <p>{message.text}</p>
              {!!message.sources?.length && (
                <div className="guide-sources">
                  {message.sources.map((work) => (
                    <a key={work.slug} href={work.repo} target="_blank" rel="noopener noreferrer">
                      {work.title}
                      <ArrowUpRight size={12} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isGenerating && (
            <p className="guide-thinking">
              <LoaderCircle size={14} className="spin" /> Reading, then checking the action…
            </p>
          )}
        </div>
        <div className="guide-command-context">
          {currentProject ? `${currentProject.title} · Things to try` : 'Start here'}
        </div>
        <div
          className="guide-shortcuts"
          aria-label={currentProject ? `${currentProject.title} commands` : 'Portfolio shortcuts'}
        >
          {currentProject ? (
            commands.map((command) => (
              <button
                key={`${currentProject.slug}-${command.id}`}
                disabled={isGenerating}
                onClick={() => runCommand(command)}
              >
                {command.label} <ArrowUpRight size={12} />
              </button>
            ))
          ) : (
            <>
              <button disabled={isGenerating} onClick={() => void send('Show me HUGO')}>
                Meet HUGO <ArrowUpRight size={12} />
              </button>
              <button
                disabled={isGenerating}
                onClick={() => void send('Show me Eduard’s local AI work')}
              >
                Local AI work <ArrowUpRight size={12} />
              </button>
              <button
                disabled={isGenerating}
                onClick={() => void send('Show me the verification checks')}
              >
                How it verifies <ArrowUpRight size={12} />
              </button>
            </>
          )}
        </div>
        <div className="guide-model-control">
          {isInitializing ? (
            <div>
              <LoaderCircle size={13} className="spin" /> Loading model · {downloadProgress}%
              <progress value={downloadProgress} max="100" aria-label="Local model download" />
            </div>
          ) : engine ? (
            <label>
              <Cpu size={13} />
              <select
                aria-label="Local model"
                value={currentModel}
                disabled={isGenerating}
                onChange={(event) => {
                  void switchModel(event.target.value).catch((cause: unknown) =>
                    setNotice(cause instanceof Error ? cause.message : 'Model switch failed.'),
                  )
                }}
              >
                {MODEL_TIERS.map((model) => (
                  <option key={model.id} value={model.modelId}>
                    {model.label}
                  </option>
                ))}
              </select>
              <span>Browser only</span>
            </label>
          ) : (
            <>
              <span>
                <Cpu size={13} />{' '}
                {isSupported
                  ? 'A model downloads when enabled'
                  : support.status === 'checking'
                    ? 'Checking browser compatibility…'
                    : 'Local AI unavailable in this browser'}
              </span>
              <button
                onClick={enable}
                disabled={!isSupported}
                aria-describedby={!isSupported ? 'local-ai-support' : undefined}
              >
                <Sparkles size={12} />
                {error ? 'Retry local AI' : 'Enable local AI'}
              </button>
            </>
          )}
        </div>
        {support.status !== 'supported' && (
          <p id="local-ai-support" className="guide-notice" role="status">
            {support.status === 'checking'
              ? 'Checking whether this browser can run a model on your GPU.'
              : support.reason}
          </p>
        )}
        {(notice || error) && (
          <p className="guide-notice" role="status">
            {notice || error}
          </p>
        )}
        <form onSubmit={submit} className="guide-input">
          <label className="sr-only" htmlFor="guide-question">
            Ask about Eduard’s work
          </label>
          <input
            ref={inputRef}
            id="guide-question"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setMood(event.target.value ? 'listening' : 'ready')
            }}
            maxLength={1000}
            placeholder={
              currentProject ? `Ask about ${currentProject.title}…` : 'Ask about my work…'
            }
            autoComplete="off"
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button type="button" onClick={stop} aria-label="Stop reply">
              <Square size={14} />
            </button>
          ) : (
            <button type="submit" aria-label="Send question" disabled={!input.trim()}>
              <ArrowUp size={18} />
            </button>
          )}
        </form>
        <footer className="guide-footer">
          <button onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>
            {showHistory ? 'Back to the agent' : 'Conversation'}
          </button>
          <span>Stays on your device.</span>
          <button
            aria-label="Reset guide conversation"
            disabled={isGenerating}
            onClick={() => {
              request.current += 1
              setMessages([welcome])
              setMood('ready')
              setNotice('')
              setDestination(null)
              pointAt(null)
              setShowHistory(false)
            }}
          >
            <RotateCcw size={12} />
          </button>
        </footer>
      </section>
    </FlyingAgent>
  )
}
