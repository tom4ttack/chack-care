import { createClient } from "@supabase/supabase-js"

export type EventRow = {
  id: number
  subject: string
  status: "exit" | "present"
  receiver: string | null
  rssi: number | null
  ts: string
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
