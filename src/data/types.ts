// Static configuration (committed JSON, edited via /editor or by hand)
export interface DoorConfig {
  id: string
  label: string
}

export interface SubAreaConfig {
  id: string
  name: string
  moonCount: number
  doors: DoorConfig[]
}

export interface KingdomConfig {
  id: string
  name: string
  doors: DoorConfig[]
  subAreas: SubAreaConfig[]
}

export interface TrackerConfig {
  id: string
  name: string
  kingdoms: KingdomConfig[]
}

// Per-session progress (persisted to localStorage)
export interface MoonProgress {
  collected: boolean
  typeNote: string
  note: string
}

export interface Progress {
  moons: Record<string, MoonProgress>
  doorNotes: Record<string, string>
  hiddenSubAreas: Record<string, boolean>
}

// Derived helpers
export interface MoonSlot {
  id: string // `${subAreaId}#${index}`
  subAreaId: string
  index: number
}

export function moonSlotId(subAreaId: string, index: number): string {
  return `${subAreaId}#${index}`
}
