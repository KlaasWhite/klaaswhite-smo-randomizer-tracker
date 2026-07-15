import { useEffect, useRef } from 'react'
import { useTrackerStore, doorHandle } from '../../store/useTrackerStore'
import { useUiStore } from '../../store/useUiStore'

export function DoorContextMenu() {
  const menu = useUiStore((s) => s.doorMenu)
  const close = useUiStore((s) => s.closeDoorMenu)
  const openConnectMenu = useUiStore((s) => s.openConnectMenu)
  const config = useTrackerStore((s) => s.config)
  const note = useTrackerStore((s) => (menu.open ? s.progress.doorNotes[menu.doorId] : undefined))
  const setDoorNote = useTrackerStore((s) => s.setDoorNote)
  const ref = useRef<HTMLDivElement>(null)

  // Resolve the kingdom node that owns this door (doors live inside kingdom nodes)
  const sourceNodeId = (() => {
    if (!config) return ''
    for (const k of config.kingdoms) {
      if (k.doors.some((d) => d.id === menu.doorId)) return k.id
      for (const sa of k.subAreas) {
        if (sa.doors.some((d) => d.id === menu.doorId)) return k.id
      }
    }
    return ''
  })()

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

  return (
    <div
      ref={ref}
      className="context-menu door-menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="menu-title">Door: {menu.doorLabel}</div>
      <button
        type="button"
        className="wizard-item"
        onClick={() =>
          openConnectMenu({
            x: menu.x,
            y: menu.y + 40,
            sourceNodeId,
            sourceHandle: doorHandle(menu.doorId),
            sourceLabel: menu.doorLabel,
            bidirectional: false,
          })
        }
      >
        Connect to… →
      </button>
      <div className="menu-row column">
        <span className="menu-label">Note (why not reachable)</span>
        <textarea
          rows={3}
          value={note ?? ''}
          placeholder="e.g. locked until post-game"
          onChange={(e) => setDoorNote(menu.doorId, e.target.value)}
        />
      </div>
      <div className="menu-id">id: {menu.doorId}</div>
    </div>
  )
}
