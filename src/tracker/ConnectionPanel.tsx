import { useState } from 'react'
import { useTrackerStore, doorHandle, kingdomItselfHandle } from '../store/useTrackerStore'
import type { DoorConfig, SubAreaConfig } from '../data/types'

interface Endpoint {
  nodeId: string
  handle: string
  label: string
}

export function ConnectionPanel() {
  const config = useTrackerStore((s) => s.config)
  const createConnection = useTrackerStore((s) => s.createConnection)

  const [startKingdom, setStartKingdom] = useState<string | null>(null)
  const [startSubArea, setStartSubArea] = useState<string | null>(null)
  const [startDoor, setStartDoor] = useState<string | null>(null)

  const [endKingdom, setEndKingdom] = useState<string | null>(null)
  const [endSubArea, setEndSubArea] = useState<string | null>(null)
  const [endDoor, setEndDoor] = useState<string | null>(null)

  const [bidirectional, setBidirectional] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  if (!config) return null

  const startKingdomObj = config.kingdoms.find((k) => k.id === startKingdom) ?? null
  const startSubAreaObj =
    startKingdomObj?.subAreas.find((s) => s.id === startSubArea) ?? null
  const endKingdomObj = config.kingdoms.find((k) => k.id === endKingdom) ?? null
  const endSubAreaObj = endKingdomObj?.subAreas.find((s) => s.id === endSubArea) ?? null

  const startEndpoint: Endpoint | null = (() => {
    if (!startKingdomObj) return null
    if (startSubAreaObj) {
      const d = startSubAreaObj.doors.find((dd) => dd.id === startDoor)
      if (!d) return null
      return { nodeId: startKingdomObj.id, handle: doorHandle(d.id), label: `${d.label} (${startSubAreaObj.name})` }
    }
    if (startDoor === '__root') {
      return { nodeId: startKingdomObj.id, handle: kingdomItselfHandle(startKingdomObj.id), label: `${startKingdomObj.name} (root)` }
    }
    const d = startKingdomObj.doors.find((dd) => dd.id === startDoor)
    if (!d) return null
    return { nodeId: startKingdomObj.id, handle: doorHandle(d.id), label: `${d.label} (${startKingdomObj.name})` }
  })()

  const endEndpoint: Endpoint | null = (() => {
    if (!endKingdomObj) return null
    if (endSubAreaObj) {
      const d = endSubAreaObj.doors.find((dd) => dd.id === endDoor)
      if (!d) return null
      return { nodeId: endKingdomObj.id, handle: doorHandle(d.id), label: `${d.label} (${endSubAreaObj.name})` }
    }
    if (endDoor === '__root') {
      return { nodeId: endKingdomObj.id, handle: kingdomItselfHandle(endKingdomObj.id), label: `${endKingdomObj.name} (root)` }
    }
    const d = endKingdomObj.doors.find((dd) => dd.id === endDoor)
    if (!d) return null
    return { nodeId: endKingdomObj.id, handle: doorHandle(d.id), label: `${d.label} (${endKingdomObj.name})` }
  })()

  const canCreate = !!startEndpoint && !!endEndpoint && startEndpoint.handle !== endEndpoint.handle

  const resetStart = () => {
    setStartKingdom(null)
    setStartSubArea(null)
    setStartDoor(null)
  }
  const resetEnd = () => {
    setEndKingdom(null)
    setEndSubArea(null)
    setEndDoor(null)
  }

  const create = () => {
    if (!startEndpoint || !endEndpoint) return
    createConnection(
      {
        source: startEndpoint.nodeId,
        sourceHandle: startEndpoint.handle,
        target: endEndpoint.nodeId,
        targetHandle: endEndpoint.handle,
      },
      bidirectional,
    )
    resetStart()
    resetEnd()
  }

  if (collapsed) {
    return (
      <aside className="connection-panel collapsed">
        <button
          type="button"
          className="panel-btn conn-toggle"
          onClick={() => setCollapsed(false)}
          title="Show add-connection panel"
        >
          + Add connection
        </button>
      </aside>
    )
  }

  return (
    <aside className="connection-panel">
      <div className="conn-panel-head">
        <h3 className="conn-panel-title">Add connection</h3>
        <button
          type="button"
          className="conn-collapse"
          onClick={() => setCollapsed(true)}
          title="Hide panel"
        >
          ✕
        </button>
      </div>

      <div className="conn-panel-section">
        <div className="menu-label">Direction</div>
        <div className="menu-row direction-row">
          <label className="dir-option">
            <input type="radio" name="cp-dir" checked={!bidirectional} onChange={() => setBidirectional(false)} />
            One way
          </label>
          <label className="dir-option">
            <input type="radio" name="cp-dir" checked={bidirectional} onChange={() => setBidirectional(true)} />
            Two way
          </label>
        </div>
      </div>

      <EndpointPicker
        title="Start"
        kingdoms={config.kingdoms}
        kingdomId={startKingdom}
        subAreaId={startSubArea}
        doorId={startDoor}
        onKingdom={(id) => {
          setStartKingdom(id)
          setStartSubArea(null)
          setStartDoor(null)
        }}
        onSubArea={(id) => {
          setStartSubArea(id)
          setStartDoor(null)
        }}
        onDoor={setStartDoor}
        onReset={resetStart}
      />

      <EndpointPicker
        title="End"
        kingdoms={config.kingdoms}
        kingdomId={endKingdom}
        subAreaId={endSubArea}
        doorId={endDoor}
        onKingdom={(id) => {
          setEndKingdom(id)
          setEndSubArea(null)
          setEndDoor(null)
        }}
        onSubArea={(id) => {
          setEndSubArea(id)
          setEndDoor(null)
        }}
        onDoor={setEndDoor}
        onReset={resetEnd}
      />

      <button type="button" className="panel-btn conn-create" disabled={!canCreate} onClick={create}>
        Create connection
      </button>
    </aside>
  )
}

function EndpointPicker({
  title,
  kingdoms,
  kingdomId,
  subAreaId,
  doorId,
  onKingdom,
  onSubArea,
  onDoor,
  onReset,
}: {
  title: string
  kingdoms: { id: string; name: string; doors: DoorConfig[]; subAreas: SubAreaConfig[] }[]
  kingdomId: string | null
  subAreaId: string | null
  doorId: string | null
  onKingdom: (id: string) => void
  onSubArea: (id: string) => void
  onDoor: (id: string) => void
  onReset: () => void
}) {
  const kingdom = kingdoms.find((k) => k.id === kingdomId) ?? null
  const subArea = kingdom?.subAreas.find((s) => s.id === subAreaId) ?? null

  return (
    <div className="conn-panel-section">
      <div className="menu-label">{title}</div>
      <select className="editor-input" value={kingdomId ?? ''} onChange={(e) => onKingdom(e.target.value)}>
        <option value="">— kingdom —</option>
        {kingdoms.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </select>

      {kingdom && (
        <select className="editor-input" value={subAreaId ?? '__root'} onChange={(e) => onSubArea(e.target.value === '__root' ? '' : e.target.value)}>
          <option value="__root">{kingdom.name} (root)</option>
          {kingdom.subAreas.map((sa) => (
            <option key={sa.id} value={sa.id}>
              {sa.name}
            </option>
          ))}
        </select>
      )}

      {kingdom && (
        <select className="editor-input" value={doorId ?? ''} onChange={(e) => onDoor(e.target.value)}>
          <option value="">— door —</option>
          {!subArea &&
            kingdom.doors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          {subArea &&
            subArea.doors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
        </select>
      )}

      {(kingdomId || subAreaId || doorId) && (
        <button type="button" className="wizard-back" onClick={onReset}>
          clear
        </button>
      )}
    </div>
  )
}
