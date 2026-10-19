import type { Metadata } from 'next'
import { identity } from '@/content/profile'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk with Eduard about AI systems, GTM engineering, and the work on this site.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="site-page site-width">
      <header className="site-intro">
        <p className="site-kicker">Contact / {identity.location}</p>
        <h1>
          Let's talk <em>about the work.</em>
        </h1>
        <p className="site-lead">
          Have a revenue or operations workflow to improve, a role to discuss, or a question about a
          project? Send me a note.
        </p>
      </header>
      <section className="site-section" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Where to find me</h2>
        <div className="site-grid">
          <article className="site-card">
            <h3>Email</h3>
            <a href={`mailto:${identity.email}`}>{identity.email}</a>
            <p>A direct way to start a conversation.</p>
          </article>
          <article className="site-card">
            <h3>LinkedIn</h3>
            <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">
              Connect with {identity.name} ↗
            </a>
            <p>Roles, collaborations and professional updates.</p>
          </article>
          <article className="site-card">
            <h3>GitHub</h3>
            <a href={identity.github} target="_blank" rel="noopener noreferrer">
              Explore the code ↗
            </a>
            <p>For project questions, issues and contributions.</p>
          </article>
          <article className="site-card site-stage">
            <h3>Based in {identity.location}</h3>
            <p>
              {identity.title} at {identity.company}.
            </p>
            <p>AI systems, private and local models, and the adoption that makes them useful.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
