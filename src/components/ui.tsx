import type { BeaconStatus } from "../lib/useBeaconStatus"
import type { Core } from "../types"

function BatteryBar({ level }: { level: number }) {
  const color =
    level >= 70 ? "bg-mint" : level >= 30 ? "bg-[#F2BE55]" : "bg-coral"
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3.5 w-7 rounded-[3px] border-[1.5px] border-gray-500/60">
        <div
          className={`absolute inset-[1.5px] rounded-[1px] ${color} transition-all`}
          style={{ width: `calc(${Math.max(6, level)}% - 3px)` }}
        />
        <div className="absolute -right-0.75 top-1/2 h-1.5 w-0.5 -translate-y-1/2 rounded-r bg-gray-500/60" />
      </div>
    </div>
  )
}

const BATTERY_CURVE = [[3000, 100], [2900, 75], [2800, 45], [2700, 20], [2600, 10], [2500, 5], [2000, 0]]

function batteryPercent(mv: number) {
  if (mv >= 3000) return 100
  const i = BATTERY_CURVE.findIndex(([v]) => mv >= v)
  if (i < 0) return 0
  const [v0, p0] = BATTERY_CURVE[i - 1]
  const [v1, p1] = BATTERY_CURVE[i]
  return Math.round((p1 + ((mv - v1) / (v0 - v1)) * (p0 - p1)) / 10) * 10
}

export function BatteryBadge({
  core,
  beacons,
  onDark,
}: {
  core: Core
  beacons: Record<string, BeaconStatus>
  onDark?: boolean
}) {
  const s = beacons[core.subject]
  if (!s)
    return (
      <span className={`text-xs ${onDark ? "opacity-80" : "text-gray-400"}`}>
        배터리 확인 중
      </span>
    )
  const bar = <BatteryBar level={batteryPercent(s.battery_mv)} />
  return onDark ? <div className="rounded-lg bg-white/90 px-2 py-1">{bar}</div> : bar
}

export function SignalBars({ rssi }: { rssi: number | null | undefined }) {
  const level = rssi == null ? 0 : rssi >= -65 ? 3 : rssi >= -80 ? 2 : 1
  return (
    <span className="inline-flex items-end gap-2">
      <span className="flex items-end gap-0.5" aria-hidden>
        {[8, 14, 20].map((h, i) => (
          <span
            key={h}
            className={`w-1.5 rounded-sm bg-current ${i < level ? "" : "opacity-20"}`}
            style={{ height: h }}
          />
        ))}
      </span>
      <span className="text-sm font-bold">
        {["신호 없음", "약함", "보통", "강함"][level]}
      </span>
    </span>
  )
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-[15px] font-extrabold tracking-tight text-navy">
        {title}
      </h2>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-mint" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          checked ? "left-5.5" : "left-0.5"
        }`}
      />
    </button>
  )
}
