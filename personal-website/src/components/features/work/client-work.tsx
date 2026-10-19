import { profile } from '@/content/profile'

export function ClientWork() {
  return (
    <section className="site-section" aria-labelledby="client-heading">
      <p className="site-kicker">Through AI-First Consulting</p>
      <h2 id="client-heading">Client work</h2>
      <p className="site-lead">
        Published engagements, described here by sector. Each link opens the company&apos;s public
        work index.
      </p>
      <ul className="work-clients">
        {profile.clientWork.map((work) => (
          <li key={work.slug}>
            <a href={work.url} target="_blank" rel="noopener noreferrer">
              {work.title} <span aria-hidden="true">&#8599;</span>
            </a>
            <span className="site-kicker">
              {work.role === 'managed' ? 'Project lead' : 'Team contributor'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
