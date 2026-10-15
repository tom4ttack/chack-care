import { useEffect, useState } from "react"

export type MissingAlert = {
  age: string
  sex: string
  target: string
  place: string
  dress: string
  date: string
}

// 경찰청 실종경보를 /api/missing-alerts(서버)에서 받는다. 키가 없거나 로컬 개발이면 null → 화면은 예시 문구.
export function useMissingAlert(enabled: boolean) {
  const [alert, setAlert] = useState<MissingAlert | null>(null)

  useEffect(() => {
    if (!enabled) return
    let live = true
    fetch("/api/missing-alerts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setAlert(d?.items?.[0] ?? null))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [enabled])

  return alert
}
