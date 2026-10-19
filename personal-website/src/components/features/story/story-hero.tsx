import { identity, metricsFor } from '@/content/profile'
import { ResumeLink } from '@/components/features/about/resume-link'

export function StoryHero() {
  return (
    <header className="story-hero site-width">
      <p className="site-kicker">
        {identity.name} / {identity.location}
      </p>
      <p className="site-role">
        {identity.title} at {identity.company}
      </p>
      <h1>
        I build AI tools that sales and operations teams <em>actually use.</em>
      </h1>
      <p className="site-lead">
        I connect the tools to the team&apos;s own data and stay until people use them.
      </p>
      <div className="story-actions">
        <a className="site-button" href="#selected-work">
          See the work
        </a>
        <ResumeLink />
      </div>
      <div className="story-proof">
        {metricsFor('site').map((metric) => (
          <details key={metric.id}>
            <summary>
              <strong>{metric.value}</strong> {metric.label}
              <span>How this is counted</span>
            </summary>
            <p>{metric.definition}</p>
          </details>
        ))}
      </div>
    </header>
  )
}
