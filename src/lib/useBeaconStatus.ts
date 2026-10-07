import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export type BeaconStatus = {
  minor: number
  subject: string
  battery_mv: number
  level: "ok" | "warn" | "low"
  temp_c: number | null
  updated_at: string
}

export function useBeaconStatus() {
  const [bySubject, setBySubject] = useState<Record<string, BeaconStatus>>({})

  useEffect(() => {
    const put = (r: BeaconStatus) => setBySubject((m) => ({ ...m, [r.subject]: r }))

    supabase
      .from("beacon_status")
      .select("*")
      .then(({ data }) => data?.forEach(put))

    const channel = supabase
      .channel("beacon-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beacon_status" },
        (p) => p.eventType !== "DELETE" && put(p.new as BeaconStatus),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return bySubject
}
