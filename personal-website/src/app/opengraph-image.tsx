import { ImageResponse } from 'next/og'
import { identity, profile } from '@/content/profile'

export const alt = `${identity.name} - ${identity.title}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        background: '#f4f2eb',
        color: '#21382f',
      }}
    >
      <div style={{ fontSize: 28 }}>{`${identity.name} / ${identity.title}`}</div>
      <div style={{ fontSize: 48, lineHeight: 1.2 }}>{profile.headline}</div>
      <div style={{ fontSize: 24, color: '#93482e' }}>
        {`${identity.company} / ${identity.location}`}
      </div>
    </div>,
    size,
  )
}
