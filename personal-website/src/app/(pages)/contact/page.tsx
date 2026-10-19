import type { Metadata } from 'next'
import { identity } from '@/content/profile'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Email, LinkedIn and GitHub for Eduard Kakosyan.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="site-page site-width">
      <header className="site-intro">
        <p className="site-kicker">Contact / {identity.location}</p>
        <h1>
          Get in <em>touch.</em>
        </h1>
        <p className="site-lead">
          Hiring, a project, or a question about something here? Email is best.
        </p>
      </header>
      <section className="site-section" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Where to find me</h2>
        <div className="site-grid">
          <article className="site-card">
            <h3>Email</h3>
            <a href={`mailto:${identity.email}`}>{identity.email}</a>
            <p>The best way to reach me.</p>
          </article>
          <article className="site-card">
            <h3>LinkedIn</h3>
            <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
            <p>For roles and introductions.</p>
          </article>
          <article className="site-card">
            <h3>GitHub</h3>
            <a href={identity.github} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <p>Public code and build records.</p>
          </article>
          <article className="site-card site-stage">
            <h3>Based in {identity.location}</h3>
            <p>
              {identity.title} at {identity.company}.
            </p>
            <p>Client-facing AI engineering, systems integration and local-model deployment.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
