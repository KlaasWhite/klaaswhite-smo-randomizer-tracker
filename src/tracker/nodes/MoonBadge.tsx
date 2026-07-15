import { useTrackerStore } from '../../store/useTrackerStore'
import { useUiStore } from '../../store/useUiStore'

export function MoonBadge({
  subAreaId,
  index,
  moonCount,
}: {
  subAreaId: string
  index: number
  moonCount: number
}) {
  const progress = useTrackerStore((s) => s.progress.moons[`${subAreaId}#${index}`])
  const toggleMoon = useTrackerStore((s) => s.toggleMoon)
  const openMoonMenu = useUiStore((s) => s.openMoonMenu)
  const editorMode = useUiStore((s) => s.editorMode)

  const collected = progress?.collected ?? false

  const title = [progress?.typeNote, progress?.note ? `Note: ${progress.note}` : '']
    .filter(Boolean)
    .join(' — ') || 'Right-click for options'

  return (
    <button
      type="button"
      className={`moon-badge${collected ? ' collected' : ''}`}
      title={title}
      onClick={(e) => {
        if (editorMode) return
        e.stopPropagation()
        toggleMoon(subAreaId, index)
      }}
      onContextMenu={(e) => {
        if (editorMode) return
        e.preventDefault()
        e.stopPropagation()
        openMoonMenu({
          x: e.clientX,
          y: e.clientY,
          subAreaId,
          index,
          moonCount,
        })
      }}
    >
      {index + 1}
    </button>
  )
}
