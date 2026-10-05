'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  FileCheck2,
  LockKeyhole,
  Code2,
  GitBranch,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'
import { useReducedMotion } from 'motion/react'

const stages = [
  {
    title: 'Freeze the agreement',
    icon: LockKeyhole,
    label: '01 / BEFORE THE BUILD',
    text: 'A product brief and acceptance tests define “done.” The builder can read them, but cannot change them.',
    lines: ['product brief → frozen', 'acceptance checks → frozen', 'agreement digest → recorded'],
    source: 'brief.md',
    state: 'AGREEMENT FROZEN',
  },
  {
    title: 'Let the builder work',
    icon: Code2,
    label: '02 / LOCAL BUILD',
    text: 'Qwen3.8-Flash-Next works through OpenHands in a sandbox: planning, coding, running its own tests and serving a demo.',
    lines: [
      'model → Qwen3.8-Flash-Next',
      'backend → SGLang / NVFP4',
      'tools → terminal · editor · demo',
    ],
    source: 'dgx-autonomy / README',
    state: 'BUILD IN PROGRESS',
  },
  {
    title: 'Carry the work forward',
    icon: GitBranch,
    label: '03 / CONTEXT HANDOFF',
    text: 'When a conversation fills up, a validated handoff carries decisions, evidence and next steps into a fresh conversation.',
    lines: [
      'handoff → decisions + next steps',
      'completed work → evidence required',
      'next conversation → frozen brief + handoff',
    ],
    source: 'dgx-autonomy / README',
    state: 'CONTEXT CONTINUED',
  },
  {
    title: 'Check the claim',
    icon: ShieldCheck,
    label: '04 / INDEPENDENT EVALUATION',
    text: '“Finish” is a claim. The controller pins the app snapshot and runs the frozen checks in separate evaluator containers.',
    lines: [
      'snapshot → pinned by controller',
      'tests → independent containers',
      'mutation during checks → rejected',
    ],
    source: 'loop / checks',
    state: 'CHECKS VERIFIED',
  },
  {
    title: 'Review the product',
    icon: MessageSquare,
    label: '05 / HUMAN JUDGMENT',
    text: 'Passing tests is not the end of product quality. Two feedback rounds refined real-dice input and keypad readability.',
    lines: [
      'review 1 → make real-dice input easier',
      'review 2 → keep every pip visible',
      'builder → revise, then re-evaluate',
    ],
    source: 'operator-messages.md',
    state: 'PRODUCT REVIEW',
  },
  {
    title: 'An app for the camp table',
    icon: FileCheck2,
    label: '06 / ORIGINAL RELEASE ACCEPTED',
    text: 'Camp Yahtzee’s original release passed 24/24 frozen tests, across four conversations over about 24 hours of wall-clock time.',
    lines: [
      'frozen acceptance tests → 24 / 24',
      'rules oracle → 7,776 possible rolls',
      'operator → accepted',
    ],
    source: 'yahtzee / README',
    state: 'PRODUCT ACCEPTED',
  },
]

export function RunReplay() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const reducedMotion = useReducedMotion()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!playing) return
    timer.current = setTimeout(() => {
      if (step === stages.length - 1) {
        setPlaying(false)
        return
      }
      setStep((current) => current + 1)
    }, 4800)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [playing, step])
  const stage = stages[step]
  const Icon = stage.icon
  return (
    <div className="run-replay">
      <header className="replay-header">
        <span>
          <span className="status-dot" /> RECORDED RUN / CAMP YAHTZEE
        </span>
        <small>28–29 SEP 2026</small>
      </header>
      <div className="replay-main">
        <div className="replay-copy">
          <span className="eyebrow">{stage.label}</span>
          <h3>
            <Icon size={24} />
            {stage.title}
          </h3>
          <p>{stage.text}</p>
          <span className="replay-state">
            <Check size={13} /> {stage.state}
          </span>
        </div>
        <div className="replay-terminal" aria-live="polite" aria-atomic="true">
          <div>
            <i />
            <i />
            <i />
            <span>run / evidence</span>
          </div>
          <ol key={step} className={reducedMotion ? '' : 'replay-lines'}>
            {stage.lines.map((line, index) => (
              <li key={line} style={{ animationDelay: `${index * 100}ms` }}>
                <span>0{index + 1}</span>
                {line}
              </li>
            ))}
          </ol>
          <footer>
            <span>Source: {stage.source}</span>
            <a
              href={
                step === 4
                  ? 'https://github.com/EduardKakosyan/yahtzee/blob/main/loop/operator-messages.md'
                  : step === 0
                    ? 'https://github.com/EduardKakosyan/yahtzee/blob/main/loop/brief.md'
                    : step === 3
                      ? 'https://github.com/EduardKakosyan/yahtzee/tree/main/loop/checks'
                      : step === 5
                        ? 'https://github.com/EduardKakosyan/yahtzee'
                        : 'https://github.com/EduardKakosyan/dgx-autonomy'
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Read this stage’s source"
            >
              <ArrowRight size={15} />
            </a>
          </footer>
        </div>
      </div>
      <div className="replay-timeline" aria-label="Run stages">
        {stages.map((item, index) => (
          <button
            key={item.title}
            className={index === step ? 'active' : index < step ? 'complete' : ''}
            aria-current={index === step ? 'step' : undefined}
            onClick={() => {
              setPlaying(false)
              setStep(index)
            }}
            aria-label={`Stage ${index + 1}: ${item.title}`}
          >
            <span>{index < step ? <Check size={12} /> : `0${index + 1}`}</span>
            <small>{['Brief', 'Build', 'Handoff', 'Verify', 'Review', 'Accept'][index]}</small>
          </button>
        ))}
      </div>
      <footer className="replay-controls">
        <p>
          A narrated reconstruction from public build records.
          <br />
          No build is running on your device.
        </p>
        <div>
          <button
            aria-label="Reset run replay"
            onClick={() => {
              setStep(0)
              setPlaying(false)
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="lab-button lab-button-dark"
            onClick={() => {
              if (step === stages.length - 1) setStep(0)
              setPlaying(!playing)
            }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pause' : 'Play the run'}
          </button>
        </div>
      </footer>
    </div>
  )
}
