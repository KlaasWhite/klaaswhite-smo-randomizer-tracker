import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import {
  type DoorConfig,
  type KingdomConfig,
  type SubAreaConfig,
  type TrackerConfig,
} from '../data/types'
import { copyConfig, downloadConfig, serializeConfig } from './exportConfig'

function EditorInner() {
  const [config, setConfig] = useState<TrackerConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Load the config from the JSON file on mount
  useEffect(() => {
    let cancelled = false
    fetch(import.meta.env.BASE_URL + 'config/smo-config.json')
      .then((r) => r.json())
      .then((c: TrackerConfig) => {
        if (!cancelled) setConfig(c)
      })
      .catch(() => {
        if (!cancelled)
          setConfig({ id: 'smo-rando-v1', name: 'SMO Randomizer Tracker', kingdoms: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const saveConfig = useCallback(async () => {
    if (!config) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serializeConfig(config),
      })
      const data = await res.json()
      setSaveMsg(data.ok ? 'Saved to smo-config.json' : `Save failed: ${data.error}`)
    } catch (e) {
      setSaveMsg(`Save failed: ${String(e)}`)
    } finally {
      setSaving(false)
    }
  }, [config])

  // Guard against null config (before the JSON has loaded)
  const update = useCallback((fn: (c: TrackerConfig) => TrackerConfig) => {
    setConfig((c) => (c ? fn(c) : c))
  }, [])

  const addKingdom = useCallback(() => {
    const id = `k-${nanoid(6)}`
    const next: KingdomConfig = { id, name: 'New Kingdom', doors: [], subAreas: [] }
    update((c) => ({ ...c, kingdoms: [...c.kingdoms, next] }))
  }, [update])

  const addSubArea = useCallback(
    (kingdomId: string) => {
      const id = `sa-${nanoid(6)}`
      const sa: SubAreaConfig = { id, name: 'New Sub-Area', moonCount: 1, doors: [] }
      update((c) => ({
        ...c,
        kingdoms: c.kingdoms.map((k) =>
          k.id === kingdomId ? { ...k, subAreas: [...k.subAreas, sa] } : k,
        ),
      }))
    },
    [update],
  )

  const addDoor = useCallback((subAreaId: string) => {
    const id = `d-${nanoid(6)}`
    const door: DoorConfig = { id, label: `Door ${nanoid(3)}` }
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => ({
        ...k,
        subAreas: k.subAreas.map((sa) =>
          sa.id === subAreaId ? { ...sa, doors: [...sa.doors, door] } : sa,
        ),
      })),
    }))
  }, [update])

  const addKingdomDoor = useCallback((kingdomId: string) => {
    const id = `kd-${nanoid(6)}`
    const door: DoorConfig = { id, label: `Door ${nanoid(3)}` }
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) =>
        k.id === kingdomId ? { ...k, doors: [...k.doors, door] } : k,
      ),
    }))
  }, [update])

  const removeKingdomDoor = (kingdomId: string, doorId: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) =>
        k.id === kingdomId
          ? { ...k, doors: k.doors.filter((d) => d.id !== doorId) }
          : k,
      ),
    }))

  const renameKingdom = (id: string, name: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => (k.id === id ? { ...k, name } : k)),
    }))
  const renameSubArea = (id: string, name: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => ({
        ...k,
        subAreas: k.subAreas.map((sa) => (sa.id === id ? { ...sa, name } : sa)),
      })),
    }))
  const renameDoor = (subAreaId: string, doorId: string, label: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => ({
        ...k,
        subAreas: k.subAreas.map((sa) =>
          sa.id === subAreaId
            ? { ...sa, doors: sa.doors.map((d) => (d.id === doorId ? { ...d, label } : d)) }
            : sa,
        ),
      })),
    }))
  const renameKingdomDoor = (kingdomId: string, doorId: string, label: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) =>
        k.id === kingdomId
          ? { ...k, doors: k.doors.map((d) => (d.id === doorId ? { ...d, label } : d)) }
          : k,
      ),
    }))
  const setMoonCount = (id: string, moonCount: number) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => ({
        ...k,
        subAreas: k.subAreas.map((sa) =>
          sa.id === id ? { ...sa, moonCount: Math.max(0, moonCount) } : sa,
        ),
      })),
    }))
  const removeKingdom = (id: string) =>
    update((c) => ({ ...c, kingdoms: c.kingdoms.filter((k) => k.id !== id) }))
  const removeSubArea = (id: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => ({
        ...k,
        subAreas: k.subAreas.filter((sa) => sa.id !== id),
      })),
    }))
  const removeDoor = (subAreaId: string, doorId: string) =>
    update((c) => ({
      ...c,
      kingdoms: c.kingdoms.map((k) => ({
        ...k,
        subAreas: k.subAreas.map((sa) =>
          sa.id === subAreaId
            ? { ...sa, doors: sa.doors.filter((d) => d.id !== doorId) }
            : sa,
        ),
      })),
    }))

  if (!config) return null

  return (
    <div className="editor-wrap">
      <header className="editor-header">
        <span className="panel-title">Editor — {config.name}</span>
        <div className="editor-actions">
          <button
            type="button"
            className="panel-btn"
            onClick={saveConfig}
            disabled={saving || !config}
          >
            {saving ? 'Saving…' : 'Save JSON'}
          </button>
          <button type="button" className="panel-btn" onClick={() => downloadConfig(config)}>
            Download JSON
          </button>
          <button
            type="button"
            className="panel-btn"
            onClick={() => {
              copyConfig(config)
              alert('Config copied to clipboard')
            }}
          >
            Copy JSON
          </button>
          {saveMsg && <span className="save-msg">{saveMsg}</span>}
        </div>
      </header>

      <div className="editor-body">
        <button type="button" className="panel-btn" onClick={addKingdom}>
          + Add Kingdom
        </button>
        <div className="editor-list">
          {config.kingdoms.map((k) => (
            <div key={k.id} className="editor-kingdom">
              <div className="editor-kingdom-head">
                <input
                  className="editor-input"
                  value={k.name}
                  onChange={(e) => renameKingdom(k.id, e.target.value)}
                />
                <button type="button" className="icon-btn" onClick={() => removeKingdom(k.id)}>
                  ✕
                </button>
              </div>
              <button type="button" className="panel-btn small" onClick={() => addKingdomDoor(k.id)}>
                + Kingdom Door
              </button>
              <div className="editor-doors">
                {k.doors.map((d) => (
                  <div key={d.id} className="editor-door">
                    <input
                      className="editor-input"
                      value={d.label}
                      onChange={(e) => renameKingdomDoor(k.id, d.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeKingdomDoor(k.id, d.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="panel-btn small" onClick={() => addSubArea(k.id)}>
                + Sub-area
              </button>
              <div className="editor-subareas">
                {k.subAreas.map((sa) => (
                  <div key={sa.id} className="editor-subarea">
                    <div className="editor-row">
                      <input
                        className="editor-input"
                        value={sa.name}
                        onChange={(e) => renameSubArea(sa.id, e.target.value)}
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeSubArea(sa.id)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="editor-row">
                      <label className="editor-label">Moons</label>
                      <input
                        type="number"
                        min={0}
                        className="editor-num"
                        value={sa.moonCount}
                        onChange={(e) => setMoonCount(sa.id, Number(e.target.value))}
                      />
                      <button
                        type="button"
                        className="panel-btn small"
                        onClick={() => addDoor(sa.id)}
                      >
                        + Door
                      </button>
                    </div>
                    <div className="editor-doors">
                      {sa.doors.map((d) => (
                        <div key={d.id} className="editor-door">
                          <input
                            className="editor-input"
                            value={d.label}
                            onChange={(e) => renameDoor(sa.id, d.id, e.target.value)}
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => removeDoor(sa.id, d.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EditorCanvas() {
  return <EditorInner />
}
