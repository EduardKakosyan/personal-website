import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('header accessible name includes both visible identity lines', () => {
  const header = readFileSync(
    new URL('../src/components/layouts/header-client.tsx', import.meta.url),
    'utf8',
  )
  assert.ok(
    header.includes(
      'aria-label={`${identity.name}, ${identity.title} at ${identity.company}, home`}',
    ),
  )
})

test('web analytics is opt-in until its Vercel endpoint is enabled', () => {
  const layout = readFileSync(new URL('../src/app/layout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true' && <Analytics \/>/)
})
