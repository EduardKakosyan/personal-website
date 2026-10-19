import { ArrowUpRight } from 'lucide-react'
import { identity } from '@/content/profile'

export function Footer() {
  return (
    <footer className="lab-footer">
      <div className="lab-footer-inner">
        <div className="lab-footer-top">
          <div>
            <strong>{identity.name}</strong>
            <p>
              {identity.title} at {identity.company}.
            </p>
          </div>
          <div className="lab-footer-links">
            <a href={identity.github} target="_blank" rel="noopener noreferrer">
              GitHub
              <ArrowUpRight size={12} />
            </a>
            <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
              <ArrowUpRight size={12} />
            </a>
            <a href={`mailto:${identity.email}`}>
              Email
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
        <div className="lab-footer-bottom">
          <span>
            © {new Date().getFullYear()} {identity.name.toUpperCase()}
          </span>
          <span>{identity.location.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  )
}
