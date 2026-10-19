import { identity, metricsFor, profile } from '@/content/profile'
import { ResumeLink } from '@/components/features/about/resume-link'

export function AboutIntro() {
  return (
    <header className="site-intro">
      <p className="site-kicker">About / {identity.location}</p>
      <h1>{identity.name}</h1>
      <p className="site-role">
        {identity.title} at {identity.company}
      </p>
      <p className="site-muted">{profile.roles[0].scope}</p>
      <p className="site-lead">{profile.headline}</p>
      <ResumeLink />
      <div className="site-metrics">
        {metricsFor('site').map((metric) => (
          <article className="site-card" key={metric.id}>
            <p className="site-metric-value">{metric.value}</p>
            <h2>{metric.label}</h2>
            <p>{metric.detail}</p>
            <details>
              <summary>How this is counted</summary>
              <p>{metric.definition}</p>
            </details>
          </article>
        ))}
      </div>
    </header>
  )
}
