import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ArrowRight } from 'lucide-react'
import { getProjectBySlug } from '@/content/projects'
import { SecureContent } from '@/components/ui/secure-content'
import { FactsBox } from './work/facts-box'
import { RunReplay } from './run-replay'

const work = getProjectBySlug('dgx-autonomy')!

/** The written case study (dgx-autonomy.md), then the build replay and the apps it built. */
export function DgxCaseStudy({ body }: { body: string }) {
  return (
    <article className="site-page work-dgx">
      <Link href="/projects" className="site-back">
        <ArrowLeft size={14} aria-hidden="true" /> All work
      </Link>
      <header className="site-sheet site-intro">
        <span className="site-kicker">LOCAL AI / AUTONOMOUS SYSTEMS / 2026</span>
        <h1>
          A local model
          <br />
          <span>that builds on its own.</span>
        </h1>
        <p className="site-lead">{work.description}</p>
        <FactsBox project={work} />
      </header>
      {/* The guide's "verification" and "model" shortcuts both land on the write-up. */}
      <section id="dgx-verification" className="site-sheet site-section">
        <span id="dgx-inference" />
        <SecureContent content={body} className="work-prose" />
      </section>
      <section
        id="dgx-workflow"
        className="site-sheet site-section"
        aria-labelledby="workflow-heading"
      >
        <div className="work-section-heading">
          <div>
            <span className="site-kicker">REPLAY</span>
            <h2 id="workflow-heading">How Camp Yahtzee was built</h2>
          </div>
          <span className="site-kicker">CAMP YAHTZEE / ORIGINAL RELEASE</span>
        </div>
        <RunReplay />
      </section>
      <section
        id="dgx-results"
        className="site-sheet site-section"
        aria-labelledby="results-heading"
      >
        <span className="site-kicker">WHAT IT BUILT</span>
        <h2 id="results-heading">Apps built with dgx-autonomy</h2>
        <div className="work-results">
          <div>
            <span className="site-kicker">01 / SHORELINE</span>
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
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <a
                href="https://github.com/EduardKakosyan/shoreline/tree/main/loop/runs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Build records
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div>
            <span className="site-kicker">02 / CAMP YAHTZEE</span>
            <h3>Camp Yahtzee</h3>
            <p>
              An offline game for the camp table. Its original release crossed four conversations
              and two rounds of product feedback.
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
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <a
                href="https://github.com/EduardKakosyan/yahtzee/tree/main/loop"
                target="_blank"
                rel="noopener noreferrer"
              >
                Build records
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <p className="site-lead site-muted">
          These results come from the public build records. I set the direction and accepted the
          results; a supervising Claude session wrote the briefs and checks and reviewed each build
          as product lead. Later Yahtzee game controls were added separately through CodeLayer.
        </p>
      </section>
      <nav className="work-next" aria-label="Next case study">
        <Link href="/projects/personal-website" className="site-button">
          Next case study: This website
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
    </article>
  )
}
