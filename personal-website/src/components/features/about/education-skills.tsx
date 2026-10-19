import { profile } from '@/content/profile'
import { formatMonth } from '@/components/features/about/experience-list'

export function EducationSkills() {
  return (
    <>
      <section className="site-section" aria-labelledby="skills-heading">
        <h2 id="skills-heading">Skills</h2>
        <div className="site-grid">
          {profile.skills.map((group) => (
            <article className="site-card" key={group.label}>
              <h3>{group.label}</h3>
              <ul className="site-skill-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="site-section" aria-labelledby="education-heading">
        <h2 id="education-heading">Education & certificates</h2>
        {profile.education.map((entry) => (
          <article className="site-card" key={entry.school}>
            <h3>{entry.degree}</h3>
            <p>
              {entry.school} / {entry.location} /{' '}
              <time dateTime={entry.end}>{formatMonth(entry.end)}</time>
            </p>
            {entry.gpa && <p>GPA: {entry.gpa}</p>}
            <ul>
              {entry.awards.map((award) => (
                <li key={award}>{award}</li>
              ))}
            </ul>
          </article>
        ))}
        <ul className="site-certificates">
          {profile.certificates.map((certificate) => (
            <li key={certificate}>{certificate}</li>
          ))}
        </ul>
      </section>
    </>
  )
}
