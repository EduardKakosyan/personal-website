import { identity, metricsFor, profile } from '@/content/profile'
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
        AI for revenue.
        <br />
        <em>Systems for people.</em>
      </h1>
      <p className="site-lead">{profile.headline}</p>
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
              <span>Definition and scope</span>
            </summary>
            <p>{metric.definition}</p>
          </details>
        ))}
      </div>
    </header>
  )
}
