import { profile } from '@/content/profile'

export function ClientWork() {
  return (
    <section className="site-section" aria-labelledby="client-heading">
      <p className="site-kicker">Through {profile.identity.company}</p>
      <h2 id="client-heading">Client work</h2>
      <p className="site-lead">
        I led some of these projects and contributed to others. The links open AI-First&apos;s
        published case studies; I describe the clients by sector here.
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
