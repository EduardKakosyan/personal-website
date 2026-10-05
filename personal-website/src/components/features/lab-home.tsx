'use client'

import { useState, type FormEvent } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown, ArrowUpRight, ArrowRight, Github, Radio } from 'lucide-react'
import { identity } from '@/content/portfolio'
import { useGuide } from '@/components/providers/guide-provider'
import { useWebLLMContext } from '@/components/providers/webllm-provider'

const WorkshopScene = dynamic(
  () => import('./workshop-scene').then((module) => module.WorkshopScene),
  {
    ssr: false,
    loading: () => (
      <div className="workshop-loading">
        <span />
        Loading the 3D scene
      </div>
    ),
  },
)

export function LabHome() {
  const { openGuide, mood, pointAt } = useGuide()
  const { isGenerating, engine, isInitializing } = useWebLLMContext()
  const [question, setQuestion] = useState('')
  const status = isInitializing
    ? 'Loading local model'
    : mood === 'thinking'
      ? 'Reading project notes'
      : mood === 'navigating'
        ? 'Opening the project'
        : mood === 'presenting'
          ? 'Answer ready'
          : engine
            ? 'Local model ready'
            : 'Project guide ready'
  const ask = (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim() || isGenerating) return
    openGuide(question.trim())
    setQuestion('')
  }
  return (
    <div className="lab-home studio-home">
      <section className="studio-hero" data-section="hero" aria-labelledby="hero-title">
        <div className="studio-hero-inner">
          <div className="studio-topline">
            <span>
              <i className="studio-live-dot" /> AI DEVELOPMENT & EDUCATION
            </span>
            <span>BASED IN HALIFAX, CANADA</span>
          </div>
          <div className="studio-hero-main">
            <div className="studio-hero-copy">
              <span className="workshop-eyebrow">HELLO, I’M EDUARD.</span>
              <h1 id="hero-title">
                I build with
                <br />
                <em>local AI.</em>
              </h1>
              <p>
                I’m a developer in Halifax. Lately, I’ve been working on coding agents and a little
                robot I can talk to, with the models running on my own hardware.
              </p>
              <div className="hero-actions">
                <a className="workshop-primary" href="#selected-work" onClick={() => pointAt(null)}>
                  See what I’ve been building <ArrowDown size={17} />
                </a>
                <button
                  className="workshop-secondary"
                  onClick={() => openGuide('What has Eduard built with local AI?')}
                >
                  Meet the guide <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="hero-signature">
                <span>CODING AGENTS</span>
                <i />
                <span>ROBOTS & SIDE PROJECTS</span>
              </div>
            </div>
            <div className="workshop-exhibit" aria-label="Interactive 3D local AI workshop">
              <div className="workshop-halo" aria-hidden="true" />
              <div className="workshop-orbit" aria-hidden="true" />
              <div className="workshop-scene">
                <WorkshopScene />
              </div>
              <span className="workshop-coordinate">LOCAL AI / DGX SPARK</span>
              <button className="workshop-agent-tag" onClick={() => openGuide()}>
                <span className="studio-live-dot" /> Ask EK—01 <ArrowUpRight size={14} />
              </button>
              <div className="workshop-hardware-tag">
                <span>01 / MY HARDWARE</span>
                <strong>DGX Spark</strong>
                <span>WHERE I RUN MY MODELS</span>
              </div>
            </div>
          </div>
          <div className="studio-agent-console">
            <div className="studio-console-intro">
              <Radio size={20} />
              <div>
                <strong>Ask about a project.</strong>
                <span>Find project details and links to the code.</span>
              </div>
            </div>
            <form onSubmit={ask} className="studio-question-form">
              <label className="sr-only" htmlFor="hero-question">
                Ask the portfolio agent about Eduard’s work
              </label>
              <input
                id="hero-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={1000}
                placeholder="What have you built with local AI?"
                autoComplete="off"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!question.trim() || isGenerating}
                aria-label="Ask the portfolio agent"
              >
                <ArrowUpRight size={22} />
              </button>
            </form>
            <div className="studio-console-meta">
              <span>
                <i className="studio-live-dot" /> {status}
              </span>
              <span>OPTIONAL AI RUNS ON YOUR DEVICE</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="studio-work studio-width"
        id="selected-work"
        data-section="expertise"
        aria-labelledby="selected-heading"
      >
        <div className="studio-section-heading">
          <span className="studio-section-kicker">01 / SELECTED WORK</span>
          <h2 id="selected-heading">
            A few recent
            <br />
            <em>projects.</em>
          </h2>
          <Link href="/projects">
            All projects <ArrowUpRight size={18} />
          </Link>
        </div>
        <Link
          href="/projects/dgx-autonomy"
          className="studio-lead-project"
          id="project-dgx-autonomy"
        >
          <div className="studio-loop-exhibit" aria-hidden="true">
            <div className="loop-grid" />
            <span className="exhibit-stamp">DGX-AUTONOMY / HOW A BUILD RUNS</span>
            <div className="exhibit-loop">
              <div className="exhibit-loop-ring" />
              <div className="exhibit-loop-center">
                <span>dgx</span>
                <span>
                  autonomy<span className="exhibit-cursor">_</span>
                </span>
              </div>
              <span className="exhibit-node node-brief">01 / BRIEF</span>
              <span className="exhibit-node node-build">02 / BUILD</span>
              <span className="exhibit-node node-verify">
                03 / VERIFY <span>✓</span>
              </span>
              <span className="exhibit-node node-review">04 / REVIEW</span>
            </div>
            <div className="exhibit-bottom">
              <span>QWEN3.8 · OPENHANDS · SGLANG</span>
              <span>
                RUNS LOCALLY <span>●</span>
              </span>
            </div>
          </div>
          <div className="studio-project-copy">
            <span className="studio-project-category">
              01 / AUTONOMOUS SYSTEMS <ArrowUpRight size={23} />
            </span>
            <h3>dgx-autonomy</h3>
            <p>
              This is how I run a coding agent on my own hardware. It can pick up where it left off,
              keep working across conversations, and submit its code to a separate set of tests.
            </p>
            <div className="studio-project-stats">
              <div>
                <strong>19/19</strong>
                <span>Shoreline checks</span>
              </div>
              <div>
                <strong>24/24</strong>
                <span>Original Yahtzee checks</span>
              </div>
            </div>
            <span className="studio-project-cta">
              How it works <ArrowRight size={18} />
            </span>
          </div>
        </Link>
        <div className="studio-project-pair">
          <Link href="/projects/hugo" className="studio-project-small" id="project-hugo">
            <div className="studio-hugo-exhibit" aria-hidden="true">
              <span>HUGO / REACHY MINI</span>
              <div className="hugo-profile">
                <div className="hugo-ear" />
                <div className="hugo-mask">
                  <i />
                  <i />
                </div>
                <div className="hugo-neck" />
                <div className="hugo-foot" />
              </div>
              <div className="hugo-audio">
                {Array.from({ length: 29 }, (_, i) => (
                  <i
                    key={i}
                    style={{ height: `${Math.round(10 + Math.sin(i * 0.75) ** 2 * 42)}px` }}
                  />
                ))}
              </div>
              <span>VOICE → REASONING → ACTION</span>
            </div>
            <div className="studio-project-small-copy">
              <span>
                02 / EMBODIED AI <ArrowUpRight size={20} />
              </span>
              <h3>
                HUGO
                <br />A robot I can talk to.
              </h3>
              <p>
                A voice assistant for my Reachy Mini. It listens, runs tools, and speaks, with the
                models running locally on my DGX Spark.
              </p>
              <span className="studio-project-cta">
                Meet HUGO <ArrowRight size={17} />
              </span>
            </div>
          </Link>
          <Link href="/projects/shoreline" className="studio-project-small" id="project-shoreline">
            <div className="studio-shoreline-exhibit">
              <span>SHORELINE / WEATHER & TIDES</span>
              <Image
                src="/images/shoreline.png"
                alt="Shoreline beach companion showing sea conditions and forecast"
                width={1280}
                height={1500}
              />
              <div className="shoreline-check">
                19/19 <span>FROZEN CHECKS PASSED</span>
              </div>
            </div>
            <div className="studio-project-small-copy">
              <span>
                03 / AGENT-BUILT SOFTWARE <ArrowUpRight size={20} />
              </span>
              <h3>
                Shoreline
                <br />
                Weather, tides & fishing.
              </h3>
              <p>
                An app for checking the weather and tides before a day at the water. My local coding
                agent built it over three runs, with briefs and review feedback along the way.
              </p>
              <span className="studio-project-cta">
                See Shoreline <ArrowRight size={17} />
              </span>
            </div>
          </Link>
        </div>
        <div className="studio-work-note">
          <span>SOURCE CODE AND BUILD RECORDS ON GITHUB</span>
          <button
            disabled={isGenerating}
            onClick={() => openGuide('Show me the verification checks')}
          >
            Ask about the tests <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      <section className="studio-about" id="about" aria-labelledby="about-heading">
        <div className="studio-about-inner studio-width">
          <div className="studio-portrait">
            <Image src="/images/profile.jpeg" alt="Eduard Kakosyan" width={540} height={620} />
            <span>OUT HIKING</span>
          </div>
          <div className="studio-about-copy">
            <span className="studio-section-kicker">02 / ABOUT</span>
            <h2 id="about-heading">
              A bit about
              <br />
              <em>me.</em>
            </h2>
            <p>
              I work at AI-First Consulting, where I lead AI development and teach courses and
              workshops. Outside that work, I’ve been spending time with local models, coding tools,
              and my Reachy Mini robot.
            </p>
            <p>I also like hiking, camping, and taking photos.</p>
            <div className="studio-about-links">
              <a href={identity.github} target="_blank" rel="noopener noreferrer">
                <Github size={17} /> GitHub <ArrowUpRight size={15} />
              </a>
              <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="studio-contact studio-width" data-section="cta">
        <span className="studio-section-kicker">03 / CONTACT</span>
        <Link href="/contact">
          <h2>
            Get in
            <br />
            <em>touch.</em>
          </h2>
          <span className="studio-contact-arrow">
            <ArrowUpRight />
          </span>
        </Link>
        <p>
          Have a question about something here, or an idea to work on together? I’d like to hear it.
        </p>
      </section>
    </div>
  )
}
