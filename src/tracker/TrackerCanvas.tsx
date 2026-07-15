import { useEffect, useRef } from 'react'
import {
  Background,
  ConnectionMode,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import { useTrackerStore } from '../store/useTrackerStore'
import { useUiStore } from '../store/useUiStore'
import { KingdomNode } from './nodes/KingdomNode'
import { DetailPanel } from './DetailPanel'
import { ConnectionPanel } from './ConnectionPanel'
import { MoonContextMenu } from './context/MoonContextMenu'
import { DoorContextMenu } from './context/DoorContextMenu'
import { SubAreaContextMenu } from './context/SubAreaContextMenu'
import { ConnectWizardMenu } from './context/ConnectWizardMenu'
import { HiddenSubAreasPanel } from './HiddenSubAreasPanel'
import { isHandleHidden } from './selection'

const nodeTypes = { kingdom: KingdomNode }

function CanvasInner() {
  const {
    loadConfig,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    resetProgress,
    config,
    selectDetail,
    selected,
    progress,
  } = useTrackerStore()
  const showHidden = useUiStore((s) => s.showHidden)

  const styledEdges = edges
    .filter(
      (e) =>
        showHidden ||
        (!isHandleHidden(config, progress.hiddenSubAreas, e.sourceHandle) &&
          !isHandleHidden(config, progress.hiddenSubAreas, e.targetHandle)),
    )
    .map((e) => {
      const related = !!e.data?.related
      const dim = selected != null && !related
      const base = e.className ?? ''
      const cls = [base, related ? 'edge-related' : '', dim ? 'edge-dim' : '']
        .filter(Boolean)
        .join(' ')
      return { ...e, className: cls }
    })
  const { fitView } = useReactFlow()
  const didFit = useRef(false)

  useEffect(() => {
    loadConfig(import.meta.env.BASE_URL + 'config/smo-config.json')
  }, [loadConfig])

  useEffect(() => {
    if (!didFit.current && nodes.length) {
      didFit.current = true
      requestAnimationFrame(() => fitView({ padding: 0.2 }))
    }
  }, [nodes, fitView])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectDetail])

  return (
    <div className="tracker-layout">
      <ConnectionPanel />
      <div className="canvas-wrap">
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={() => selectDetail(null)}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.1}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Panel position="top-right">
            <label className="panel-toggle">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => useUiStore.getState().setShowHidden(e.target.checked)}
              />
              Show hidden
            </label>
            <button type="button" className="panel-btn" onClick={resetProgress}>
              Reset progress
            </button>
          </Panel>
          <Panel position="top-left">
            <span className="panel-title">{config?.name ?? 'Loading…'}</span>
          </Panel>
          <Panel position="bottom-left">
            <HiddenSubAreasPanel />
          </Panel>
        </ReactFlow>
        <DetailPanel />
      </div>
      <MoonContextMenu />
      <DoorContextMenu />
      <SubAreaContextMenu />
      <ConnectWizardMenu />
    </div>
  )
}

export function TrackerCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
