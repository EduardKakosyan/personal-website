import { metricsFor } from './profile'

export function storyCopy(text: string): string {
  return text.replace(/\{metric:([^}.]+)(\.detail)?\}/g, (_, id, detail) => {
    const metric = metricsFor('site').find((item) => item.id === id)
    const value = detail ? metric?.detail : metric?.value
    if (!value) throw new Error(`Invalid site metric: ${id}`)
    return value
  })
}
