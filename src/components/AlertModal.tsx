import { useEffect, useState } from "react"
import type { EventRow } from "../lib/supabase"
import { Icon } from "./Icon"
import { SignalBars } from "./ui"

export function AlertSheet({
  icon,
  title,
  sub,
  vibrate,
  confirm,
  dismissLabel = "해제",
  onClose,
  onConfirm,
  children,
}: {
  icon: string
  title: string
  sub: string
  vibrate: number[]
  confirm: string
  dismissLabel?: string
  onClose: () => void
  onConfirm: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    try {
      navigator.vibrate?.(vibrate)
    } catch {}
  }, [])

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-navy/60 backdrop-blur-sm">
      <div className="animate-slide-up w-full overflow-hidden rounded-t-3xl bg-white">
        <div className="animate-siren px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Icon name={icon} className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-tight">{title}</p>
              <p className="text-sm opacity-90">{sub}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-8 pt-5">
          {children}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-bold text-gray-700 transition active:scale-[.98]"
            >
              {dismissLabel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-2xl bg-coral py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/30 transition active:scale-[.98]"
            >
              {confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AlertModal({
  event,
  radius,
  onClose,
  onViewLocation,
}: {
  event: EventRow
  radius: number
  onClose: () => void
  onViewLocation: () => void
}) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <AlertSheet
      icon="alert"
      title="안전반경 이탈 감지"
      sub={`${event.subject} · ${event.receiver ?? "수신기"}`}
      vibrate={[400, 200, 400, 200, 600]}
      confirm="확인"
      dismissLabel="이상 없음"
      onClose={onClose}
      onConfirm={onViewLocation}
    >
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { k: "수신 신호", v: <SignalBars rssi={event.rssi} />, hot: true },
          { k: "안전반경", v: `${radius}m`, hot: false },
          { k: "경과", v: `${seconds}s`, hot: false },
        ].map((s) => (
          <div
            key={s.k}
            className={`rounded-2xl py-3 ${s.hot ? "bg-coral-light" : "bg-gray-100"}`}
          >
            <p
              className={`text-[11px] font-semibold ${s.hot ? "text-coral-dark" : "text-gray-500"}`}
            >
              {s.k}
            </p>
            <p
              className={`text-xl font-extrabold tabular-nums ${s.hot ? "text-coral-dark" : "text-navy"}`}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>
      <p className="rounded-2xl bg-mint-light px-4 py-3 text-[13px] leading-relaxed text-mint-dark">
        안전반경을 벗어났습니다. 주변을 즉시 확인해 주세요.
      </p>
    </AlertSheet>
  )
}
