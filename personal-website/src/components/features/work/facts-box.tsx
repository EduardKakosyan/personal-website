import type { Project } from '@/content/projects'

export function FactsBox({ project }: { project: Project }) {
  return (
    <aside className="work-facts" aria-label="Project facts">
      <dl>
        <div>
          <dt>My role</dt>
          <dd>{project.facts.role}</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{project.facts.when}</dd>
        </div>
        <div>
          <dt>Team</dt>
          <dd>{project.facts.team}</dd>
        </div>
        <div>
          <dt>Stack / system</dt>
          <dd>{project.facts.stack.join(' / ')}</dd>
        </div>
      </dl>
      {project.facts.links.map((link) => (
        <a
          className="work-link"
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label} &#8599;
        </a>
      ))}
      {project.visibility === 'described-only' && (
        <p className="site-muted">The code is private.</p>
      )}
    </aside>
  )
}
