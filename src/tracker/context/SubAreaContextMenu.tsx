import { useEffect, useRef } from 'react'
import { useTrackerStore } from '../../store/useTrackerStore'
import { useUiStore } from '../../store/useUiStore'

export function SubAreaContextMenu() {
  const menu = useUiStore((s) => s.subAreaMenu)
  const close = useUiStore((s) => s.closeSubAreaMenu)
  const toggleSubAreaHidden = useTrackerStore((s) => s.toggleSubAreaHidden)
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

  return (
    <div
      ref={ref}
      className="context-menu subarea-menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="menu-title">Sub-Area: {menu.subAreaName}</div>
      <button
        type="button"
        className="wizard-item"
        onClick={() => {
          toggleSubAreaHidden(menu.subAreaId)
          close()
        }}
      >
        {menu.hidden ? 'Show sub-area' : 'Hide sub-area'}
      </button>
      <div className="menu-id">id: {menu.subAreaId}</div>
    </div>
  )
}
