import Link from 'next/link'
import { archiveProjects } from '@/content/projects'

export function ArchiveTable() {
  return (
    <section className="site-section" aria-labelledby="archive-heading">
      <h2 id="archive-heading">The archive</h2>
      <p className="site-lead">
        Earlier builds, experiments and collaborations. Kept with their original links and build
        notes.
      </p>
      <div className="work-table-scroll" role="region" aria-label="Project archive" tabIndex={0}>
        <table className="work-table">
          <caption className="sr-only">Archive projects, dates, contributions and links</caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Project</th>
              <th scope="col">What it does</th>
              <th scope="col">My role</th>
              <th scope="col">Links</th>
            </tr>
          </thead>
          <tbody>
            {archiveProjects.map((project) => (
              <tr key={project.slug}>
                <td>{project.facts.when.match(/\d{4}/)?.[0]}</td>
                <th scope="row">
                  <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                </th>
                <td>{project.description}</td>
                <td>{project.facts.role}</td>
                <td>
                  {project.facts.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.title}: ${link.label}`}
                    >
                      {link.label} &#8599;
                    </a>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
