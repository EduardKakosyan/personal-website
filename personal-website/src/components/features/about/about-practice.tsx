import Link from 'next/link'
import { principles, toolsLine, workflow } from '@/content/practice'
import { getProjectBySlug } from '@/content/projects'

/** How I work: where AI fits, then how a piece of work moves from a problem to merged code. */
export function AboutPractice() {
  return (
    <>
      <section className="site-sheet site-section" aria-labelledby="ai-heading">
        <h2 id="ai-heading">What I build, and where AI fits</h2>
        <p className="site-lead">
          I start with the problem. I build what I can, and a model goes only where it does the job
          better than plain code.
        </p>
        <div className="site-grid">
          {principles.map((principle) => {
            const project = getProjectBySlug(principle.example)
            return (
              <article className="site-card" key={principle.id}>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
                {project && (
                  <Link href={`/projects/${project.slug}`}>
                    See it in {project.title === 'This website' ? 'this website' : project.title}{' '}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      </section>
      <section className="site-sheet site-section" aria-labelledby="workflow-heading">
        <h2 id="workflow-heading">How I work with coding agents</h2>
        <p className="site-lead">
          Agents do most of the typing. The decisions stay with me, and each stage ends with
          something a person can check.
        </p>
        <ol className="site-experience">
          {workflow.map((stage) => (
            <li key={stage.id}>
              <p className="site-dates">{stage.name}</p>
              <div>
                <p>{stage.what}</p>
                <p className="site-muted">Mine to decide: {stage.mine}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="site-summary">{toolsLine}</p>
      </section>
    </>
  )
}
