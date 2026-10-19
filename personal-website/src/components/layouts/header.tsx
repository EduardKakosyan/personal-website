import { identity, resumePdfPath } from '@/content/profile'
import { HeaderClient } from './header-client'

export function Header() {
  return (
    <HeaderClient
      identity={{ name: identity.name, title: identity.title, company: identity.company }}
      resumePdfPath={resumePdfPath}
    />
  )
}
