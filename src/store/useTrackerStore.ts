import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import {
  type DoorConfig,
  type Progress,
  type SubAreaConfig,
  type TrackerConfig,
  moonSlotId,
} from '../data/types'
import { isEdgeRelated } from '../tracker/selection'

export interface KingdomNodeData {
  name: string
  kingdomId: string
  doors: DoorConfig[]
  subAreas: SubAreaConfig[]
  [key: string]: unknown
}
export interface SubAreaNodeData {
  name: string
  moonCount: number
  doors: DoorConfig[]
  subAreaId: string
  [key: string]: unknown
}

export type KingdomRFNode = Node<KingdomNodeData, 'kingdom'>
export type SubAreaRFNode = Node<SubAreaNodeData, 'subarea'>

export interface DoorNodeData {
  label: string
  doorId: string
  [key: string]: unknown
}
export type DoorRFNode = Node<DoorNodeData, 'door'>

// Handle id conventions — ONE handle per door (single connectable point, works both ways)
export const doorHandle = (doorId: string) => `door::${doorId}`
// "Kingdom itself" pseudo-door id (leads to the kingdom as a whole)
export const KINGDOM_ITSELF = 'kingdom-itself'
export const kingdomItselfHandle = (kingdomId: string) => `ki::${kingdomId}`

// Stable, pleasant random colour per kingdom (HSL with good saturation/lightness)
function randomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue} 70% 60%)`
}

function buildGraph(config: TrackerConfig): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  config.kingdoms.forEach((kingdom, ki) => {
    nodes.push({
      id: kingdom.id,
      type: 'kingdom',
      position: { x: ki * 520, y: 0 },
      data: {
        name: kingdom.name,
        kingdomId: kingdom.id,
        doors: kingdom.doors,
        subAreas: kingdom.subAreas,
      },
    } as KingdomRFNode)
  })

  return { nodes, edges }
}

const progressKey = (configId: string) => `smo-progress::${configId}`
const edgesKey = (configId: string) => `smo-edges::${configId}`

function loadProgress(configId: string): Progress {
  try {
    const raw = localStorage.getItem(progressKey(configId))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>
      return {
        moons: parsed.moons ?? {},
        doorNotes: parsed.doorNotes ?? {},
        hiddenSubAreas: parsed.hiddenSubAreas ?? {},
      }
    }
  } catch {
    /* ignore */
  }
  return { moons: {}, doorNotes: {}, hiddenSubAreas: {} }
}

function saveProgress(configId: string, progress: Progress) {
  try {
    localStorage.setItem(progressKey(configId), JSON.stringify(progress))
  } catch {
    /* ignore */
  }
}

function loadEdges(configId: string): Edge[] | null {
  try {
    const raw = localStorage.getItem(edgesKey(configId))
    if (raw) return JSON.parse(raw) as Edge[]
  } catch {
    /* ignore */
  }
  return null
}

function saveEdges(configId: string, edges: Edge[]) {
  try {
    localStorage.setItem(edgesKey(configId), JSON.stringify(edges))
  } catch {
    /* ignore */
  }
}

export interface DetailSelection {
  kind: 'door' | 'subarea' | 'kingdom'
  id: string
  label: string
}

interface TrackerState {
  config: TrackerConfig | null
  configUrl: string
  nodes: Node[]
  edges: Edge[]
  progress: Progress
  loaded: boolean
  selected: DetailSelection | null
  kingdomColors: Record<string, string>
  loadConfig: (url: string) => Promise<void>
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  selectDetail: (sel: DetailSelection | null) => void
  toggleDetail: (sel: DetailSelection) => void
  toggleMoon: (subAreaId: string, index: number) => void
  setMoonTypeNote: (subAreaId: string, index: number, typeNote: string) => void
  setMoonNote: (subAreaId: string, index: number, note: string) => void
  setDoorNote: (doorId: string, note: string) => void
  createConnection: (connection: Connection, bidirectional: boolean) => void
  removeEdge: (edgeId: string) => void
  toggleSubAreaHidden: (subAreaId: string) => void
  resetProgress: () => void
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  config: null,
  configUrl: import.meta.env.BASE_URL + 'config/smo-config.json',
  nodes: [],
  edges: [],
  progress: { moons: {}, doorNotes: {}, hiddenSubAreas: {} },
  loaded: false,
  selected: null,
  kingdomColors: {},

  loadConfig: async (url) => {
    const res = await fetch(url)
    const config = (await res.json()) as TrackerConfig
    const { nodes } = buildGraph(config)
    const progress = loadProgress(config.id)
    // Restore previously drawn connections (survives refresh, not cleared by reset)
    const edges = loadEdges(config.id) ?? []
    const kingdomColors: Record<string, string> = {}
    config.kingdoms.forEach((k) => {
      kingdomColors[k.id] = randomColor()
    })
    set({ config, nodes, edges, progress, loaded: true, configUrl: url, kingdomColors })
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    const edges = applyEdgeChanges(changes, get().edges)
    if (get().config) saveEdges(get().config!.id, edges)
    set({ edges })
  },

  onConnect: (connection) => {
    get().createConnection(connection, false)
  },

  createConnection: (connection, bidirectional) => {
    const { source, sourceHandle, target, targetHandle } = connection
    if (!source || !target) return
    const edges = get().edges
    // Detect bidirectional: an edge already exists in the opposite direction
    const reverseExists = edges.some(
      (e) =>
        e.source === target &&
        e.sourceHandle === targetHandle &&
        e.target === source &&
        e.targetHandle === sourceHandle,
    )
    const isBi = bidirectional || reverseExists
    const baseId = `e-${sourceHandle}-${targetHandle}`
    const newEdge: Edge = {
      id: isBi ? `${baseId}-bi` : baseId,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      markerEnd: { type: 'arrowclosed' },
      // bidirectional edges get a double arrow marker
      markerStart: isBi ? { type: 'arrowclosed' } : undefined,
      className: isBi ? 'edge-bidirectional' : 'edge-oneway',
    }
    const next = addEdge(newEdge, edges)
    if (get().config) saveEdges(get().config!.id, next)
    set({ edges: next })
  },

  removeEdge: (edgeId) => {
    const edges = get().edges.filter((e) => e.id !== edgeId)
    if (get().config) saveEdges(get().config!.id, edges)
    set({ edges })
  },

  toggleSubAreaHidden: (subAreaId) => {
    const progress = { ...get().progress }
    const hidden = { ...(progress.hiddenSubAreas ?? {}) }
    hidden[subAreaId] = !hidden[subAreaId]
    if (!hidden[subAreaId]) delete hidden[subAreaId]
    progress.hiddenSubAreas = hidden
    saveProgress(get().config!.id, progress)
    set({ progress })
  },

  selectDetail: (sel) => {
    const { edges, config } = get()
    const next = edges.map((e) => ({
      ...e,
      data: { ...(e.data ?? {}), related: isEdgeRelated(e, sel, config) },
    }))
    set({ selected: sel, edges: next })
  },

  toggleDetail: (sel) => {
    const cur = get().selected
    const same =
      cur && cur.kind === sel.kind && cur.id === sel.id
    get().selectDetail(same ? null : sel)
  },

  toggleMoon: (subAreaId, index) => {
    const id = moonSlotId(subAreaId, index)
    const progress = { ...get().progress }
    const prev = progress.moons[id] ?? {
      collected: false,
      typeNote: '',
      note: '',
    }
    progress.moons[id] = { ...prev, collected: !prev.collected }
    saveProgress(get().config!.id, progress)
    set({ progress })
  },

  setMoonTypeNote: (subAreaId, index, typeNote) => {
    const id = moonSlotId(subAreaId, index)
    const progress = { ...get().progress }
    const prev = progress.moons[id] ?? {
      collected: false,
      typeNote: '',
      note: '',
    }
    progress.moons[id] = { ...prev, typeNote }
    saveProgress(get().config!.id, progress)
    set({ progress })
  },

  setMoonNote: (subAreaId, index, note) => {
    const id = moonSlotId(subAreaId, index)
    const progress = { ...get().progress }
    const prev = progress.moons[id] ?? {
      collected: false,
      typeNote: '',
      note: '',
    }
    progress.moons[id] = { ...prev, note }
    saveProgress(get().config!.id, progress)
    set({ progress })
  },

  setDoorNote: (doorId, note) => {
    const progress = { ...get().progress }
    progress.doorNotes[doorId] = note
    saveProgress(get().config!.id, progress)
    set({ progress })
  },

  resetProgress: () => {
    const progress: Progress = { moons: {}, doorNotes: {}, hiddenSubAreas: {} }
    saveProgress(get().config!.id, progress)
    // Reset clears moons/notes/hidden sub-areas AND drawn connections.
    // (Connections still survive a plain refresh via the persisted edges key.)
    if (get().config) {
      saveEdges(get().config!.id, [])
    }
    set({ progress, edges: [] })
  },
}))
