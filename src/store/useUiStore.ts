import { create } from 'zustand'

export interface MoonMenuState {
  open: boolean
  x: number
  y: number
  subAreaId: string
  index: number
  moonCount: number
}

export interface DoorMenuState {
  open: boolean
  x: number
  y: number
  doorId: string
  doorLabel: string
}

export interface ConnectMenuState {
  open: boolean
  x: number
  y: number
  sourceNodeId: string
  sourceHandle: string
  sourceLabel: string
  bidirectional: boolean
}

export interface SubAreaMenuState {
  open: boolean
  x: number
  y: number
  subAreaId: string
  subAreaName: string
  hidden: boolean
}

interface UiState {
  moonMenu: MoonMenuState
  doorMenu: DoorMenuState
  connectMenu: ConnectMenuState
  subAreaMenu: SubAreaMenuState
  editorMode: boolean
  showHidden: boolean
  openMoonMenu: (s: Omit<MoonMenuState, 'open'>) => void
  closeMoonMenu: () => void
  openDoorMenu: (s: Omit<DoorMenuState, 'open'>) => void
  closeDoorMenu: () => void
  openConnectMenu: (s: Omit<ConnectMenuState, 'open'>) => void
  closeConnectMenu: () => void
  openSubAreaMenu: (s: Omit<SubAreaMenuState, 'open'>) => void
  closeSubAreaMenu: () => void
  setEditorMode: (v: boolean) => void
  setShowHidden: (v: boolean) => void
}

const SHOW_HIDDEN_KEY = 'smo-show-hidden'

function loadShowHidden(): boolean {
  try {
    return localStorage.getItem(SHOW_HIDDEN_KEY) === 'true'
  } catch {
    return false
  }
}

function saveShowHidden(v: boolean) {
  try {
    localStorage.setItem(SHOW_HIDDEN_KEY, v ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

const closedMoon: MoonMenuState = {
  open: false,
  x: 0,
  y: 0,
  subAreaId: '',
  index: 0,
  moonCount: 0,
}
const closedDoor: DoorMenuState = {
  open: false,
  x: 0,
  y: 0,
  doorId: '',
  doorLabel: '',
}
const closedConnect: ConnectMenuState = {
  open: false,
  x: 0,
  y: 0,
  sourceNodeId: '',
  sourceHandle: '',
  sourceLabel: '',
  bidirectional: false,
}
const closedSubArea: SubAreaMenuState = {
  open: false,
  x: 0,
  y: 0,
  subAreaId: '',
  subAreaName: '',
  hidden: false,
}

export const useUiStore = create<UiState>((set) => ({
  moonMenu: closedMoon,
  doorMenu: closedDoor,
  connectMenu: closedConnect,
  subAreaMenu: closedSubArea,
  editorMode: false,
  showHidden: loadShowHidden(),
  openMoonMenu: (s) =>
    set({
      moonMenu: { ...s, open: true },
      doorMenu: closedDoor,
      connectMenu: closedConnect,
      subAreaMenu: closedSubArea,
    }),
  closeMoonMenu: () => set({ moonMenu: closedMoon }),
  openDoorMenu: (s) =>
    set({
      doorMenu: { ...s, open: true },
      moonMenu: closedMoon,
      connectMenu: closedConnect,
      subAreaMenu: closedSubArea,
    }),
  closeDoorMenu: () => set({ doorMenu: closedDoor }),
  openConnectMenu: (s) =>
    set({
      connectMenu: { ...s, open: true },
      moonMenu: closedMoon,
      doorMenu: closedDoor,
      subAreaMenu: closedSubArea,
    }),
  closeConnectMenu: () => set({ connectMenu: closedConnect }),
  openSubAreaMenu: (s) =>
    set({
      subAreaMenu: { ...s, open: true },
      moonMenu: closedMoon,
      doorMenu: closedDoor,
      connectMenu: closedConnect,
    }),
  closeSubAreaMenu: () => set({ subAreaMenu: closedSubArea }),
  setEditorMode: (v) => set({ editorMode: v }),
  setShowHidden: (v) => {
    saveShowHidden(v)
    set({ showHidden: v })
  },
}))
