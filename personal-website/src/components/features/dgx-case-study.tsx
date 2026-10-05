import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  LockKeyhole,
  GitBranch,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { portfolioWorks } from '@/content/portfolio'
import { RunReplay } from './run-replay'

const work = portfolioWorks[0]
export function DgxCaseStudy() {
  return (
    <article className="dgx-case lab-section">
      <Link href="/projects" className="case-back">
        <ArrowLeft size={14} /> All work
      </Link>
      <header className="case-heading">
        <span className="eyebrow">LOCAL AI / AUTONOMOUS SYSTEMS / 2026</span>
        <h1>
          Running a local
          <br />
          <span>coding agent.</span>
        </h1>
        <p>
          I built dgx-autonomy to run a coding agent on my DGX Spark. It saves progress between
          conversations, recovers from interrupted runs, and tests the code in a separate container.
        </p>
        <div className="case-meta">
          <span>
            MY ROLE <b>Environment & orchestration</b>
          </span>
          <span>
            HARDWARE <b>One DGX Spark</b>
          </span>
          <span>
            BUILDER <b>Qwen3.8-Flash-Next</b>
          </span>
          <a className="text-link" href={work.repo} target="_blank" rel="noopener noreferrer">
            Read the repository
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>
      <section id="dgx-workflow" className="case-block" aria-labelledby="workflow-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / THE LOOP</span>
            <h2 id="workflow-heading">How Camp Yahtzee was built</h2>
          </div>
          <span className="case-side-note">CAMP YAHTZEE / ORIGINAL RELEASE</span>
        </div>
        <RunReplay />
      </section>
      <section id="dgx-verification" className="case-block" aria-labelledby="verification-heading">
        <span className="eyebrow">02 / THE ENGINEERING</span>
        <h2 id="verification-heading">Testing, memory, and isolation</h2>
        <p className="case-intro">
          OpenHands runs the coding agent. I built the controller around it to manage saved state,
          restrict access to tools, run tests independently, and pause for product review.
        </p>
        <div className="case-principles">
          {[
            {
              icon: LockKeyhole,
              title: 'Protect the acceptance tests',
              text: 'Dry-run the acceptance checks, freeze the brief and tests, and verify their digest before evaluation. The builder cannot rewrite its own grading criteria.',
            },
            {
              icon: ShieldCheck,
              title: 'Test a fixed code snapshot',
              text: 'Pin the project in the controller’s git store, serve that exact snapshot, and run each check in a disposable evaluator. Reject any change during the evaluation.',
            },
            {
              icon: GitBranch,
              title: 'Save progress between sessions',
              text: 'Validate handoffs and label builder statements as claims. Start fresh conversations with the brief, evidence, previous decisions and operator feedback.',
            },
            {
              icon: Timer,
              title: 'Limit access and run time',
              text: 'An unprivileged builder has no Docker socket or access to the host and LAN. Deadlines, response limits, watchdogs and recovery constrain the work.',
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon size={21} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <a
          href={`${work.repo}/blob/main/README.md`}
          className="text-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Inspect the documented architecture
          <ArrowUpRight size={14} />
        </a>
      </section>
      <section id="dgx-inference" className="case-block case-inference">
        <span className="eyebrow">03 / THE INFERENCE TRADEOFF</span>
        <h2>Choosing a model and inference server</h2>
        <p>
          The documented app builds use Qwen3.8-Flash-Next through SGLang with NVFP4 weights and
          multi-token prediction. An earlier llama.cpp backend slowed as context grew; sustained
          long-context performance motivated the switch.
        </p>
        <p>
          The system qualifies a model on the actual machine with tool calls, long-context recall, a
          real build and memory measurements. A smaller Qwen3.6-35B-A3B fallback is also supported.
        </p>
        <a
          href={`${work.repo}/blob/main/config/models.yaml`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          Model configuration & qualification records
          <ArrowUpRight size={14} />
        </a>
      </section>
      <section id="dgx-results" className="case-block" aria-labelledby="results-heading">
        <span className="eyebrow">04 / THE EVIDENCE</span>
        <h2 id="results-heading">Apps built with dgx-autonomy</h2>
        <div className="case-results">
          <div>
            <span className="result-index">01 / SHORELINE</span>
            <h3>Shoreline</h3>
            <p>
              Beach and fishing verdicts, tides, sea state and weather. Built across three runs,
              September 24–28, 2026.
            </p>
            <strong>
              19 / 19 <small>final-run acceptance checks passed</small>
            </strong>
            <div>
              <a
                href="https://eduardkakosyan.github.io/shoreline/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try Shoreline
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://github.com/EduardKakosyan/shoreline/tree/main/loop/runs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Build records
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
          <div>
            <span className="result-index">02 / CAMP YAHTZEE</span>
            <h3>Camp Yahtzee</h3>
            <p>
              An offline game for the camp table. Its original release crossed four conversations
              and two product reviews.
            </p>
            <strong>
              24 / 24 <small>original-release acceptance tests passed</small>
            </strong>
            <div>
              <a
                href="https://eduardkakosyan.github.io/yahtzee/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Play Yahtzee
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://github.com/EduardKakosyan/yahtzee/tree/main/loop"
                target="_blank"
                rel="noopener noreferrer"
              >
                Build records
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
        <p className="case-caveat">
          Results are reported in the public repositories. The 40-hour limit is a maximum run
          budget. Briefs and product reviews came from the operator and a supervising Claude
          session. Later Yahtzee game-management controls were added separately through CodeLayer.
        </p>
      </section>
      <section className="case-takeaway">
        <span className="eyebrow">MY CONTRIBUTION</span>
        <h2>What I built around the agent</h2>
        <p>
          The model wrote the app code. My work was the controller: saving progress, recovering from
          failures, isolating the tests, and deciding when a run should stop for review.
        </p>
        <Link href="/projects/hugo" className="text-link">
          Next project: HUGO
          <ArrowRight size={16} />
        </Link>
      </section>
    </article>
  )
}
