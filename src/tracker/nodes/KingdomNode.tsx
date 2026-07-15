import { useMemo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  type KingdomRFNode,
  doorHandle,
  kingdomItselfHandle,
  useTrackerStore,
} from '../../store/useTrackerStore'
import { useUiStore } from '../../store/useUiStore'
import type { DoorConfig, SubAreaConfig } from '../../data/types'
import { findHandleOwner } from '../selection'

export function KingdomNode({ data }: NodeProps<KingdomRFNode>) {
  const editorMode = useUiStore((s) => s.editorMode)
  const toggleDetail = useTrackerStore((s) => s.toggleDetail)
  const openDoorMenu = useUiStore((s) => s.openDoorMenu)
  const openConnectMenu = useUiStore((s) => s.openConnectMenu)
  const openSubAreaMenu = useUiStore((s) => s.openSubAreaMenu)
  const showHidden = useUiStore((s) => s.showHidden)
  const doorNotes = useTrackerStore((s) => s.progress.doorNotes)
  const hidden = useTrackerStore((s) => s.progress.hiddenSubAreas)
  const edges = useTrackerStore((s) => s.edges)
  const config = useTrackerStore((s) => s.config)
  const selected = useTrackerStore((s) => s.selected)
  const kingdomColor = useTrackerStore((s) => s.kingdomColors[data.kingdomId])

  // Handles that should render red: they connect to a hidden sub-area.
  // Suppressed when the user chooses to reveal hidden sub-areas.
  const redHandles = useMemo(() => {
    const set = new Set<string>()
    if (showHidden) return set
    for (const e of edges) {
      const sOwner = findHandleOwner(config, e.sourceHandle)
      const tOwner = findHandleOwner(config, e.targetHandle)
      const sHidden = sOwner?.kind === 'subarea' && !!hidden[sOwner.id]
      const tHidden = tOwner?.kind === 'subarea' && !!hidden[tOwner.id]
      if (sHidden && e.targetHandle) set.add(e.targetHandle)
      if (tHidden && e.sourceHandle) set.add(e.sourceHandle)
    }
    return set
  }, [edges, hidden, config, showHidden])

  return (
    <div
      className={`kingdom-node${selected?.kind === 'kingdom' && selected.id === data.kingdomId ? ' selected' : ''}`}
      style={kingdomColor ? ({ '--kingdom-color': kingdomColor } as React.CSSProperties) : undefined}
      onClick={() => {
        if (editorMode) return
        toggleDetail({ kind: 'kingdom', id: data.kingdomId, label: data.name })
      }}
    >
      <div className="kingdom-title">{data.name}</div>

      <div className="kingdom-section">
        <div className="kingdom-section-label">Doors</div>
        <div className="kingdom-doors">
          <KingdomDoor
            id={kingdomItselfHandle(data.kingdomId)}
            label="Root"
            note={doorNotes[kingdomItselfHandle(data.kingdomId)]}
            red={redHandles.has(kingdomItselfHandle(data.kingdomId))}
            selected={selected?.kind === 'door' && selected.id === kingdomItselfHandle(data.kingdomId)}
            editorMode={editorMode}
            onSelect={() =>
              toggleDetail({ kind: 'door', id: kingdomItselfHandle(data.kingdomId), label: 'Root' })
            }
            onMenu={(e) =>
              openDoorMenu({
                x: e.clientX,
                y: e.clientY,
                doorId: kingdomItselfHandle(data.kingdomId),
                doorLabel: 'Root',
              })
            }
            onConnectClick={(e) =>
              openConnectMenu({
                x: e.clientX,
                y: e.clientY,
                sourceNodeId: data.kingdomId,
                sourceHandle: kingdomItselfHandle(data.kingdomId),
                sourceLabel: 'Root',
                bidirectional: false,
              })
            }
          />
          {data.doors.map((d: DoorConfig) => (
            <KingdomDoor
              key={d.id}
              id={doorHandle(d.id)}
              label={d.label}
              note={doorNotes[d.id]}
              red={redHandles.has(doorHandle(d.id))}
              selected={selected?.kind === 'door' && selected.id === d.id}
              editorMode={editorMode}
              onSelect={() => toggleDetail({ kind: 'door', id: d.id, label: d.label })}
              onMenu={(e) =>
                openDoorMenu({
                  x: e.clientX,
                  y: e.clientY,
                  doorId: d.id,
                  doorLabel: d.label,
                })
              }
              onConnectClick={(e) =>
                openConnectMenu({
                  x: e.clientX,
                  y: e.clientY,
                  sourceNodeId: data.kingdomId,
                  sourceHandle: doorHandle(d.id),
                  sourceLabel: d.label,
                  bidirectional: false,
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="kingdom-divider" />

      <div className="kingdom-section">
        <div className="kingdom-section-label">Sub-Areas</div>
        <div className="kingdom-subareas">
          {data.subAreas.map((sa: SubAreaConfig) => (
            <SubAreaBox
              key={sa.id}
              sa={sa}
              hidden={!!hidden[sa.id]}
              showHidden={showHidden}
              red={sa.doors.some((d) => redHandles.has(doorHandle(d.id)))}
              selected={selected?.kind === 'subarea' && selected.id === sa.id}
              editorMode={editorMode}
              onSelect={() => toggleDetail({ kind: 'subarea', id: sa.id, label: sa.name })}
              onMenu={(e) =>
                openSubAreaMenu({
                  x: e.clientX,
                  y: e.clientY,
                  subAreaId: sa.id,
                  subAreaName: sa.name,
                  hidden: !!hidden[sa.id],
                })
              }
              onDoorMenu={(e, doorId, doorLabel) =>
                openDoorMenu({ x: e.clientX, y: e.clientY, doorId, doorLabel })
              }
              onConnectClick={(e, doorId, doorLabel) =>
                openConnectMenu({
                  x: e.clientX,
                  y: e.clientY,
                  sourceNodeId: data.kingdomId,
                  sourceHandle: doorHandle(doorId),
                  sourceLabel: doorLabel,
                  bidirectional: false,
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function KingdomDoor({
  id,
  label,
  note,
  red,
  selected,
  editorMode,
  onSelect,
  onMenu,
  onConnectClick,
}: {
  id: string
  label: string
  note?: string
  red?: boolean
  selected?: boolean
  editorMode: boolean
  onSelect: () => void
  onMenu: (e: React.MouseEvent) => void
  onConnectClick: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className={`door-node${note ? ' has-note' : ''}${red ? ' red' : ''}${selected ? ' selected' : ''}`}
      onClick={(e) => {
        if (editorMode) return
        e.stopPropagation()
        onSelect()
      }}
      onContextMenu={(e) => {
        if (editorMode) return
        e.preventDefault()
        e.stopPropagation()
        onMenu(e)
      }}
    >
      <span className="door-node-label">{label}</span>
      {note && (
        <span className="door-note-dot" title={note}>
          ●
        </span>
      )}
      <Handle
        id={id}
        type="source"
        position={Position.Right}
        className="door-node-handle"
        isConnectableStart
        isConnectableEnd
        onClick={(e) => {
          if (editorMode) return
          e.stopPropagation()
          onConnectClick(e)
        }}
      />
    </div>
  )
}

function SubAreaBox({
  sa,
  hidden,
  showHidden,
  red,
  selected,
  editorMode,
  onSelect,
  onMenu,
  onDoorMenu,
  onConnectClick,
}: {
  sa: SubAreaConfig
  hidden: boolean
  showHidden: boolean
  red: boolean
  selected?: boolean
  editorMode: boolean
  onSelect: () => void
  onMenu: (e: React.MouseEvent) => void
  onDoorMenu: (e: React.MouseEvent, doorId: string, doorLabel: string) => void
  onConnectClick: (e: React.MouseEvent, doorId: string, doorLabel: string) => void
}) {
  const collected = useTrackerStore((s) => {
    let c = 0
    for (let i = 0; i < sa.moonCount; i++) {
      if (s.progress.moons[`${sa.id}#${i}`]?.collected) c++
    }
    return c
  })

  // When hidden (and not revealing), the sub-area is fully removed from the graph.
  if (hidden && !showHidden) {
    return null
  }

  return (
    <div
      className={`subarea-node${hidden ? ' revealed-hidden' : ''}${red ? ' red' : ''}${selected ? ' selected' : ''}`}
      onClick={(e) => {
        if (editorMode) return
        e.stopPropagation()
        onSelect()
      }}
      onContextMenu={(e) => {
        if (editorMode) return
        e.preventDefault()
        e.stopPropagation()
        onMenu(e)
      }}
    >
      <div className="subarea-header">
        <span className="subarea-name">{sa.name}</span>
        {hidden ? (
          <span className="subarea-hidden-badge">hidden</span>
        ) : (
          <span className="subarea-mooncount">
            {collected}/{sa.moonCount}
          </span>
        )}
      </div>
      {sa.doors.map((door) => (
        <div className="subarea-door-row" key={door.id}>
          <span
            className="subarea-door-label"
            onContextMenu={(e) => {
              if (editorMode) return
              e.preventDefault()
              e.stopPropagation()
              onDoorMenu(e, door.id, door.label)
            }}
          >
            {door.label}
          </span>
          <Handle
            id={doorHandle(door.id)}
            type="source"
            position={Position.Right}
            className="subarea-door-handle"
            isConnectableStart
            isConnectableEnd
            onClick={(e) => {
              if (editorMode) return
              e.stopPropagation()
              onConnectClick(e, door.id, door.label)
            }}
          />
        </div>
      ))}
    </div>
  )
}
