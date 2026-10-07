import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export type ActionKind = "acknowledged" | "resolved" | "false_alarm"

type AlertAction = { id: number; event_id: number; action: ActionKind; ts: string }

export async function recordAction(eventId: number, action: ActionKind) {
  const { error } = await supabase.from("alert_actions").insert({ event_id: eventId, action })
  if (error) console.error("alert action failed:", error.message)
}

export function useAlertActions() {
  const [byEvent, setByEvent] = useState<Record<number, ActionKind>>({})

  useEffect(() => {
    const put = (r: AlertAction) => setByEvent((m) => ({ ...m, [r.event_id]: r.action }))

    supabase
      .from("alert_actions")
      .select("*")
      .order("id")
      .then(({ data }) => data?.forEach(put))

    const channel = supabase
      .channel("alert-actions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alert_actions" },
        (p) => put(p.new as AlertAction),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return byEvent
}
