import { useTrackerStore, doorHandle, kingdomItselfHandle } from '../store/useTrackerStore'
import { moonSlotId } from '../data/types'
import { isHandleHidden } from './selection'

export function DetailPanel() {
  const selected = useTrackerStore((s) => s.selected)
  const config = useTrackerStore((s) => s.config)
  const edges = useTrackerStore((s) => s.edges)
  const progress = useTrackerStore((s) => s.progress)
  const selectDetail = useTrackerStore((s) => s.selectDetail)
  const toggleMoon = useTrackerStore((s) => s.toggleMoon)
  const setMoonTypeNote = useTrackerStore((s) => s.setMoonTypeNote)
  const setMoonNote = useTrackerStore((s) => s.setMoonNote)
  const setDoorNote = useTrackerStore((s) => s.setDoorNote)
  const removeEdge = useTrackerStore((s) => s.removeEdge)

  if (!selected || !config) return null

  // Resolve the door/subarea/kingdom object
  let doorId: string | null = null
  let subAreaId: string | null = null
  let kingdomId: string | null = null
  let moonCount = 0

  if (selected.kind === 'door') {
    doorId = selected.id
  } else if (selected.kind === 'subarea') {
    subAreaId = selected.id
    for (const k of config.kingdoms) {
      const sa = k.subAreas.find((s) => s.id === subAreaId)
      if (sa) {
        moonCount = sa.moonCount
        break
      }
    }
  } else {
    kingdomId = selected.id
  }

  // Connections involving this node
  const related = edges
    .filter(
      (e) =>
        !isHandleHidden(config, progress.hiddenSubAreas, e.sourceHandle) &&
        !isHandleHidden(config, progress.hiddenSubAreas, e.targetHandle),
    )
    .filter((e) => {
      if (selected.kind === 'door') {
        const h = doorHandle(doorId!)
        return e.sourceHandle === h || e.targetHandle === h
      }
      if (selected.kind === 'subarea') {
        const handles = new Set<string>()
        const k = config.kingdoms.find((kk) => kk.subAreas.some((s) => s.id === subAreaId))
        k?.subAreas.find((s) => s.id === subAreaId)?.doors.forEach((d) =>
          handles.add(doorHandle(d.id)),
        )
        return (
          e.source === subAreaId ||
          e.target === subAreaId ||
          handles.has(e.sourceHandle ?? '') ||
          handles.has(e.targetHandle ?? '')
        )
      }
      // kingdom: its root handle + its doors
      const rootHandle = kingdomItselfHandle(kingdomId!)
      const kDoors = new Set<string>()
      const k = config.kingdoms.find((kk) => kk.id === kingdomId)
      k?.doors.forEach((d) => kDoors.add(doorHandle(d.id)))
      return (
        e.sourceHandle === rootHandle ||
        e.targetHandle === rootHandle ||
        kDoors.has(e.sourceHandle ?? '') ||
        kDoors.has(e.targetHandle ?? '')
      )
    })

  const labelForHandle = (handle?: string | null): string => {
    if (!handle) return '?'
    if (handle.startsWith('ki::')) {
      const kid = handle.slice(4)
      return `${config.kingdoms.find((k) => k.id === kid)?.name ?? kid} (root)`
    }
    if (handle.startsWith('door::')) {
      const did = handle.slice(6)
      for (const k of config.kingdoms) {
        const d = k.doors.find((dd) => dd.id === did)
        if (d) return `${d.label} (${k.name})`
        for (const sa of k.subAreas) {
          const sd = sa.doors.find((dd) => dd.id === did)
          if (sd) return `${sd.label} (${sa.name})`
        }
      }
    }
    return handle
  }

  return (
    <aside className="detail-panel">
      <div className="detail-head">
        <span className="detail-kind">{selected.kind}</span>
        <strong>{selected.label}</strong>
        <button className="icon-btn" onClick={() => selectDetail(null)}>
          ✕
        </button>
      </div>

      {selected.kind === 'door' && (
        <div className="detail-section">
          <label className="menu-label">Note (why not reachable)</label>
          <textarea
            rows={2}
            value={progress.doorNotes[doorId!] ?? ''}
            placeholder="e.g. locked until post-game"
            onChange={(e) => setDoorNote(doorId!, e.target.value)}
          />
        </div>
      )}

      {selected.kind === 'subarea' && (
        <div className="detail-section">
          <div className="menu-label">Moons ({moonCount})</div>
          <div className="moon-list">
            {Array.from({ length: moonCount }).map((_, i) => {
              const id = moonSlotId(subAreaId!, i)
              const m = progress.moons[id]
              return (
                <div key={i} className="moon-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={m?.collected ?? false}
                      onChange={() => toggleMoon(subAreaId!, i)}
                    />
                    Moon {i + 1}
                  </label>
                  <input
                    className="moon-type-input"
                    placeholder="type"
                    value={m?.typeNote ?? ''}
                    onChange={(e) => setMoonTypeNote(subAreaId!, i, e.target.value)}
                  />
                  <input
                    className="moon-note-input"
                    placeholder="why not collected"
                    value={m?.note ?? ''}
                    onChange={(e) => setMoonNote(subAreaId!, i, e.target.value)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="detail-section">
        <div className="menu-label">Connections</div>
        {related.length === 0 && <div className="detail-empty">No connections yet</div>}
        <ul className="conn-list">
          {related.map((e) => {
            const outgoing = e.source === subAreaId || e.sourceHandle === doorId
            const isBi = e.data?.bidirectional
            return (
              <li key={e.id} className={isBi ? 'bi' : 'oneway'}>
                <span className="conn-dir">
                  {isBi ? '⇄' : outgoing ? '→' : '←'}
                </span>
                <span className="conn-text">
                  {labelForHandle(e.sourceHandle)} → {labelForHandle(e.targetHandle)}
                </span>
                <button
                  type="button"
                  className="conn-remove"
                  title="Remove connection"
                  onClick={() => removeEdge(e.id)}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
