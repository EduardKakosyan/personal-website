import { ArrowUpRight } from 'lucide-react'
import { identity } from '@/content/portfolio'

export function Footer() {
  return (
    <footer className="lab-footer">
      <div className="lab-footer-inner">
        <div className="lab-footer-top">
          <div>
            <strong>Eduard Kakosyan</strong>
            <p>AI developer and educator.</p>
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
          <span>© {new Date().getFullYear()} EDUARD KAKOSYAN</span>
          <span>HALIFAX, NOVA SCOTIA</span>
        </div>
      </div>
    </footer>
  )
}
