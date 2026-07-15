import { useEffect, useRef } from 'react'
import { useTrackerStore } from '../../store/useTrackerStore'
import { useUiStore } from '../../store/useUiStore'
import { moonSlotId } from '../../data/types'

export function MoonContextMenu() {
  const menu = useUiStore((s) => s.moonMenu)
  const close = useUiStore((s) => s.closeMoonMenu)
  const progress = useTrackerStore((s) =>
    menu.open ? s.progress.moons[moonSlotId(menu.subAreaId, menu.index)] : undefined,
  )
  const setMoonTypeNote = useTrackerStore((s) => s.setMoonTypeNote)
  const setMoonNote = useTrackerStore((s) => s.setMoonNote)
  const toggleMoon = useTrackerStore((s) => s.toggleMoon)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu.open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('contextmenu', onDown, true)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('contextmenu', onDown, true)
    }
  }, [menu.open, close])

  if (!menu.open) return null

  const id = moonSlotId(menu.subAreaId, menu.index)
  const current = progress ?? { collected: false, typeNote: '', note: '' }

  return (
    <div
      ref={ref}
      className="context-menu moon-menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="menu-title">
        Moon {menu.index + 1} / {menu.moonCount}
      </div>
      <label className="menu-row">
        <input
          type="checkbox"
          checked={current.collected}
          onChange={() => toggleMoon(menu.subAreaId, menu.index)}
        />
        Collected
      </label>
      <div className="menu-row column">
        <span className="menu-label">Type</span>
        <input
          value={current.typeNote}
          placeholder="e.g. collectable, multi-moon"
          onChange={(e) => setMoonTypeNote(menu.subAreaId, menu.index, e.target.value)}
        />
      </div>
      <div className="menu-row column">
        <span className="menu-label">Note (why not collected)</span>
        <textarea
          rows={3}
          value={current.note}
          placeholder="e.g. needs ground pound + 2 captures"
          onChange={(e) => setMoonNote(menu.subAreaId, menu.index, e.target.value)}
        />
      </div>
      <div className="menu-id">id: {id}</div>
    </div>
  )
}
