import type { EventRow } from "./lib/supabase"

export type Core = {
  id: string
  name: string
  connected: boolean
  monitoring: boolean
  subject: string
}

export type Reward = { id: string; ts: string; label: string; area: string; points: number }

export type ShopItem = { id: string; brand: string; name: string; cost: number }

export type TabKey = "home" | "live" | "report" | "reward"

export type Person = {
  subject: string
  relation?: string
  core: Core
  last?: EventRow
  monitoring: boolean
  breach: boolean
}
