import { resumePdfPath } from '@/content/profile'
import { ResumeLinkClient } from './resume-link-client'

export function ResumeLink() {
  return <ResumeLinkClient resumePdfPath={resumePdfPath} />
}
