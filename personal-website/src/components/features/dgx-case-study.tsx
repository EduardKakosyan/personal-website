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
            MY ROLE <b>Build controller & tests</b>
          </span>
          <span>
            HARDWARE <b>One DGX Spark</b>
          </span>
          <span>
            BUILDER <b>Qwen3.8-Flash-Next</b>
          </span>
          <a className="text-link" href={work.repo} target="_blank" rel="noopener noreferrer">
            Source code
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
              text: 'The controller checks that the tests run, then locks the brief and tests before the build starts. It checks them again before evaluation so the agent can’t change how its work is graded.',
            },
            {
              icon: ShieldCheck,
              title: 'Test a fixed code snapshot',
              text: 'The controller saves a specific version of the code and tests that version in a separate container. If the code changes during evaluation, the result is rejected.',
            },
            {
              icon: GitBranch,
              title: 'Save progress between sessions',
              text: 'A new conversation starts with the brief, previous decisions, test results, and review feedback. The controller checks the handoff before letting the next session pick up the work.',
            },
            {
              icon: Timer,
              title: 'Limit access and run time',
              text: 'The builder runs without elevated privileges or access to the host, local network, or Docker controls. Time limits and recovery checks keep interrupted runs from hanging indefinitely.',
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
          More on the setup
          <ArrowUpRight size={14} />
        </a>
      </section>
      <section id="dgx-inference" className="case-block case-inference">
        <span className="eyebrow">03 / THE INFERENCE TRADEOFF</span>
        <h2>Choosing a model and inference server</h2>
        <p>
          For these app builds, I used Qwen3.8-Flash-Next through SGLang with NVFP4 weights and
          multi-token prediction. I switched from llama.cpp because it slowed down as the
          conversations grew longer.
        </p>
        <p>
          Before using a model, the setup checks tool calls, recall in long conversations, memory
          use, and a real build on the machine. It also supports a smaller Qwen3.6-35B-A3B model as
          a fallback.
        </p>
        <a
          href={`${work.repo}/blob/main/config/models.yaml`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          Model settings and test records
          <ArrowUpRight size={14} />
        </a>
      </section>
      <section id="dgx-results" className="case-block" aria-labelledby="results-heading">
        <span className="eyebrow">04 / WHAT IT BUILT</span>
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
          These results come from the public build records. I supplied briefs and reviewed the apps
          with help from a supervising Claude session. Later Yahtzee game-management controls were
          added separately through CodeLayer.
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
