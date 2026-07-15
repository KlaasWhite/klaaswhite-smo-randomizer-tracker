import type { Edge } from '@xyflow/react'
import type { TrackerConfig } from '../data/types'
import { doorHandle, kingdomItselfHandle, type DetailSelection } from '../store/useTrackerStore'

export type HandleOwnerKind = 'kingdom' | 'subarea' | 'door'

export interface HandleOwner {
  kind: HandleOwnerKind
  id: string
}

/** Resolve which kingdom/sub-area/door a given handle id belongs to. */
export function findHandleOwner(
  config: TrackerConfig | null,
  handle?: string | null,
): HandleOwner | null {
  if (!config || !handle) return null
  if (handle.startsWith('ki::')) {
    return { kind: 'kingdom', id: handle.slice(4) }
  }
  if (handle.startsWith('door::')) {
    const doorId = handle.slice(6)
    for (const k of config.kingdoms) {
      if (k.doors.some((d) => d.id === doorId)) return { kind: 'door', id: doorId }
      for (const sa of k.subAreas) {
        if (sa.doors.some((d) => d.id === doorId)) return { kind: 'subarea', id: sa.id }
      }
    }
  }
  return null
}

/** A handle is hidden if it belongs to a hidden sub-area. */
export function isHandleHidden(
  config: TrackerConfig | null,
  hidden: Record<string, boolean>,
  handle?: string | null,
): boolean {
  const owner = findHandleOwner(config, handle)
  return owner?.kind === 'subarea' && !!hidden[owner.id]
}

/** Returns true if the given edge is related to the current detail selection. */
export function isEdgeRelated(
  e: Edge,
  selected: DetailSelection | null,
  config: TrackerConfig | null,
): boolean {
  if (!selected || !config) return false

  if (selected.kind === 'door') {
    const h = doorHandle(selected.id)
    return e.sourceHandle === h || e.targetHandle === h
  }

  if (selected.kind === 'subarea') {
    const handles = new Set<string>()
    for (const k of config.kingdoms) {
      const sa = k.subAreas.find((s) => s.id === selected.id)
      if (sa) sa.doors.forEach((d) => handles.add(doorHandle(d.id)))
    }
    return handles.has(e.sourceHandle ?? '') || handles.has(e.targetHandle ?? '')
  }

  // kingdom: its root handle + its own doors
  const rootHandle = kingdomItselfHandle(selected.id)
  const handles = new Set<string>()
  const k = config.kingdoms.find((kk) => kk.id === selected.id)
  k?.doors.forEach((d) => handles.add(doorHandle(d.id)))
  return (
    e.sourceHandle === rootHandle ||
    e.targetHandle === rootHandle ||
    handles.has(e.sourceHandle ?? '') ||
    handles.has(e.targetHandle ?? '')
  )
}
