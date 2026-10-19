import { profile } from '@/content/profile'

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}-01T00:00:00Z`))
}

export function ExperienceList() {
  return (
    <section className="site-section" aria-labelledby="experience-heading">
      <p className="site-kicker">The work behind the title</p>
      <h2 id="experience-heading">Experience</h2>
      <ol className="site-experience">
        {profile.roles.map((role) => (
          <li key={role.id}>
            <p className="site-dates">
              <time dateTime={role.start}>{formatMonth(role.start)}</time> -{' '}
              {role.end ? <time dateTime={role.end}>{formatMonth(role.end)}</time> : 'Present'}
            </p>
            <div>
              <h3>{role.title}</h3>
              <p>
                {role.org} / {role.location}
              </p>
              {role.scope && <p className="site-muted">{role.scope}</p>}
              <p className="site-summary">{role.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
