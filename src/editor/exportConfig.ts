import type { TrackerConfig } from '../data/types'

export function serializeConfig(config: TrackerConfig): string {
  // Pretty-printed, readable JSON (structural only — no runtime positions)
  return JSON.stringify(config, null, 2)
}

export function downloadConfig(config: TrackerConfig) {
  const json = serializeConfig(config)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'smo-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function copyConfig(config: TrackerConfig) {
  const json = serializeConfig(config)
  if (navigator.clipboard) navigator.clipboard.writeText(json)
  return json
}
