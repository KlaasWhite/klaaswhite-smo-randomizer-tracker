import { useTrackerStore } from '../store/useTrackerStore'

export function HiddenSubAreasPanel() {
  const config = useTrackerStore((s) => s.config)
  const hidden = useTrackerStore((s) => s.progress.hiddenSubAreas)
  const toggleSubAreaHidden = useTrackerStore((s) => s.toggleSubAreaHidden)

  if (!config) return null

  const items: { subAreaId: string; subAreaName: string; kingdomName: string }[] = []
  for (const k of config.kingdoms) {
    for (const sa of k.subAreas) {
      if (hidden[sa.id]) {
        items.push({ subAreaId: sa.id, subAreaName: sa.name, kingdomName: k.name })
      }
    }
  }

  if (items.length === 0) return null

  return (
    <div className="hidden-subareas-panel">
      <div className="hsa-head">
        <span className="hsa-title">Hidden sub-areas ({items.length})</span>
      </div>
      <ul className="hsa-list">
        {items.map((it) => (
          <li key={it.subAreaId} className="hsa-item">
            <span className="hsa-name">
              {it.subAreaName}
              <span className="hsa-kingdom">{it.kingdomName}</span>
            </span>
            <button
              type="button"
              className="hsa-unhide"
              onClick={() => toggleSubAreaHidden(it.subAreaId)}
            >
              Unhide
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
