import { useEffect, useRef, useState } from 'react'
import {
  useTrackerStore,
  doorHandle,
  kingdomItselfHandle,
} from '../../store/useTrackerStore'
import { useUiStore } from '../../store/useUiStore'

export function ConnectWizardMenu() {
  const menu = useUiStore((s) => s.connectMenu)
  const close = useUiStore((s) => s.closeConnectMenu)
  const config = useTrackerStore((s) => s.config)

  if (!menu.open || !config) return null

  // Keyed by open state so the wizard remounts (resetting its steps) each time it opens
  return (
    <ConnectWizardInner
      key={menu.open ? 'open' : 'closed'}
      menu={menu}
      config={config}
      close={close}
    />
  )
}

function ConnectWizardInner({
  menu,
  config,
  close,
}: {
  menu: ReturnType<typeof useUiStore.getState>['connectMenu']
  config: NonNullable<ReturnType<typeof useTrackerStore.getState>['config']>
  close: () => void
}) {
  const createConnection = useTrackerStore((s) => s.createConnection)
  const ref = useRef<HTMLDivElement>(null)

  const [kingdomId, setKingdomId] = useState<string | null>(null)
  const [subAreaId, setSubAreaId] = useState<string | null>(null)
  const [bidirectional, setBidirectional] = useState(menu.bidirectional)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('contextmenu', onDown, true)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('contextmenu', onDown, true)
    }
  }, [close])

  const doCreate = (targetNodeId: string, targetHandle: string) => {
    createConnection(
      {
        source: menu.sourceNodeId,
        sourceHandle: menu.sourceHandle,
        target: targetNodeId,
        targetHandle,
      },
      bidirectional,
    )
    close()
  }

  const selectedKingdom = config.kingdoms.find((k) => k.id === kingdomId) ?? null
  const selectedSubArea =
    selectedKingdom?.subAreas.find((s) => s.id === subAreaId) ?? null

  return (
    <div
      ref={ref}
      className="context-menu connect-wizard"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="menu-title">Connect from: {menu.sourceLabel}</div>

      <div className="menu-row direction-row">
        <span className="menu-label">Direction</span>
        <label className="dir-option">
          <input
            type="radio"
            name="dir"
            checked={!bidirectional}
            onChange={() => setBidirectional(false)}
          />
          One way
        </label>
        <label className="dir-option">
          <input
            type="radio"
            name="dir"
            checked={bidirectional}
            onChange={() => setBidirectional(true)}
          />
          Two way
        </label>
      </div>

      {!kingdomId && (
        <>
          <div className="menu-label">1. Choose a kingdom</div>
          <div className="wizard-list">
            {config.kingdoms.map((k) => (
              <button
                key={k.id}
                type="button"
                className="wizard-item"
                onClick={() => setKingdomId(k.id)}
              >
                {k.name}
              </button>
            ))}
          </div>
        </>
      )}

      {kingdomId && selectedKingdom && !subAreaId && (
        <>
          <div className="menu-label">
            2. Choose a door or sub-area in {selectedKingdom.name}
          </div>
          <div className="wizard-list">
            <button
              type="button"
              className="wizard-item"
              onClick={() =>
                doCreate(
                  selectedKingdom.id,
                  kingdomItselfHandle(selectedKingdom.id),
                )
              }
            >
              {selectedKingdom.name} (root)
            </button>
            {selectedKingdom.doors.map((d) => (
              <button
                key={d.id}
                type="button"
                className="wizard-item"
                onClick={() => doCreate(selectedKingdom.id, doorHandle(d.id))}
              >
                Door: {d.label}
              </button>
            ))}
            {selectedKingdom.subAreas.map((sa) => (
              <button
                key={sa.id}
                type="button"
                className="wizard-item"
                onClick={() => setSubAreaId(sa.id)}
              >
                Sub-Area: {sa.name} →
              </button>
            ))}
          </div>
          <button type="button" className="wizard-back" onClick={() => setKingdomId(null)}>
            ← Back
          </button>
        </>
      )}

      {kingdomId && selectedKingdom && subAreaId && selectedSubArea && (
        <>
          <div className="menu-label">3. Choose a door in {selectedSubArea.name}</div>
          <div className="wizard-list">
            {selectedSubArea.doors.map((d) => (
              <button
                key={d.id}
                type="button"
                className="wizard-item"
                onClick={() => doCreate(selectedKingdom.id, doorHandle(d.id))}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button type="button" className="wizard-back" onClick={() => setSubAreaId(null)}>
            ← Back
          </button>
        </>
      )}
    </div>
  )
}
