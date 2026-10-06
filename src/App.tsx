import { useEffect, useState } from "react"
import { supabase, type EventRow } from "./lib/supabase"

/* ============================================================
   착케어 (ChakCare) — 실종·분실 방지 스마트 앱
   ============================================================ */

type Core = {
  id: string
  name: string
  battery: number
  connected: boolean
  monitoring: boolean
}

type Reward = { id: string; ts: string; label: string; area: string; points: number }

type ShopItem = { id: string; brand: string; name: string; cost: number }

type TabKey = "home" | "live" | "report" | "reward"

const PROTECTED = { name: "김서준", relation: "아들 · 만 8세" }

const reward = (id: string, ts: string, area: string): Reward => ({
  id,
  ts,
  area,
  label: "실종자 찾기 제보",
  points: 500,
})

const SHOP_ITEMS: ShopItem[] = [
  { id: "s1", brand: "카페", name: "아메리카노 Tall", cost: 4500 },
  { id: "s2", brand: "편의점", name: "5,000원 금액권", cost: 5000 },
  { id: "s3", brand: "베이커리", name: "조각케이크 교환권", cost: 6500 },
  { id: "s4", brand: "치킨", name: "후라이드 한 마리", cost: 20000 },
]

/* ---------- 라인 아이콘 ---------- */

const ICONS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  signal: '<path d="M12 20h.01"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5.5 13a10 10 0 0 1 13 0"/><path d="M2.5 9.5a15 15 0 0 1 19 0"/>',
  map: '<path d="M9 3 3 5.5v15.5l6-2.5 6 2.5 6-2.5V3l-6 2.5L9 3Z"/><path d="M9 3v15.5"/><path d="M15 5.5V21"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path d="M16 14.5h.01"/>',
  person: '<circle cx="12" cy="8" r="3.2"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  link: '<path d="M9.5 14.5l5-5"/><path d="M11.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1"/><path d="M12.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1"/>',
  alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
  megaphone: '<path d="M4 10v4h4l7 4V6l-7 4H4Z"/><path d="M18 9a3 3 0 0 1 0 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  broadcast: '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.6 5.6 0 0 0 0 8"/><path d="M16 8a5.6 5.6 0 0 1 0 8"/><path d="M5 5a10 10 0 0 0 0 14"/><path d="M19 5a10 10 0 0 1 0 14"/>',
  gift: '<path d="M4 11.5h16V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5Z"/><path d="M3 8h18v3.5H3V8Z"/><path d="M12 8v13"/><path d="M12 8S10.5 3.5 8 4.5 9.5 8 12 8Zm0 0s1.5-4.5 4-3.5S14.5 8 12 8Z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  walk: '<circle cx="13" cy="4.5" r="1.6"/><path d="M11 21l1.5-5-2.5-2.5 1-5 3 2 2 2"/><path d="M11 13l-2 3-2 3"/>',
  pause: '<path d="M9 6v12"/><path d="M15 6v12"/>',
  chart: '<path d="M3 21h18"/><path d="M6.5 21v-6"/><path d="M12 21V8"/><path d="M17.5 21v-9"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16"/>',
  home2: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  store: '<path d="M4 9h16l-1-4H5L4 9Z"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 20v-5h4v5"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
}

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

/* ---------- 공통 컴포넌트 ---------- */

function BatteryBar({ level }: { level: number }) {
  const color =
    level > 50 ? "bg-mint" : level > 20 ? "bg-[#F2BE55]" : "bg-coral"
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3.5 w-7 rounded-[3px] border-[1.5px] border-gray-500/60">
        <div
          className={`absolute inset-[1.5px] rounded-[1px] ${color} transition-all`}
          style={{ width: `calc(${Math.max(6, level)}% - 3px)` }}
        />
        <div className="absolute -right-0.75 top-1/2 h-1.5 w-0.5 -translate-y-1/2 rounded-r bg-gray-500/60" />
      </div>
      <span className="text-xs font-semibold tabular-nums text-gray-700">
        {level}%
      </span>
    </div>
  )
}

function SignalBars({ rssi }: { rssi: number | null | undefined }) {
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

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-[15px] font-extrabold tracking-tight text-navy">
        {title}
      </h2>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

function Toggle({
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

function MapSvg({
  stroke,
  width,
  children,
}: {
  stroke: string
  width: number
  children: React.ReactNode
}) {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
      <rect width="400" height="400" fill="#EEF7F6" />
      {[70, 150, 230, 310].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke={stroke} strokeWidth={width} />
      ))}
      {[60, 150, 250, 340].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="400" stroke={stroke} strokeWidth={width} />
      ))}
      {children}
    </svg>
  )
}

/* ---------- 모달 ---------- */

function AlertSheet({
  icon,
  title,
  sub,
  vibrate,
  confirm,
  onClose,
  onConfirm,
  children,
}: {
  icon: string
  title: string
  sub: string
  vibrate: number[]
  confirm: string
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
              해제
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

function AlertModal({
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

/* ---------- 0) 홈 화면 ---------- */

function HomeScreen({
  cores,
  radius,
  points,
  relayOn,
  onGo,
}: {
  cores: Core[]
  radius: number
  points: number
  relayOn: boolean
  onGo: (t: TabKey) => void
}) {
  const connected = cores.filter((c) => c.connected).length
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-mint p-6 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute right-6 top-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl border-2 border-white/60 bg-gray-200" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white">
              <span className="block h-2 w-2 rounded-full bg-mint" />
            </span>
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">
              김서준 · 아들 · 만 8세
            </p>
            <p className="text-2xl font-extrabold tracking-tight">
              안심 · 반경 내
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            { k: "연결 코어", v: `${connected}/${cores.length}` },
            { k: "안전반경", v: `${radius}m` },
            { k: "안심 스캔", v: relayOn ? "ON" : "OFF" },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl bg-white/15 py-2.5">
              <p className="text-[11px] opacity-80">{s.k}</p>
              <p className="text-base font-extrabold">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { t: "라이브 지도", i: "map", tab: "live" as TabKey },
          { t: "활동 리포트", i: "chart", tab: "report" as TabKey },
          { t: "안심 리워드", i: "wallet", tab: "reward" as TabKey },
        ].map((q) => (
          <button
            key={q.t}
            onClick={() => onGo(q.tab)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-gray-100 transition active:scale-95"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-light text-mint-dark">
              <Icon name={q.i} className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-semibold text-gray-700">
              {q.t}
            </span>
          </button>
        ))}
      </div>

      <div>
        <SectionTitle title="내 착코어" sub={`${cores.length}개 연결`} />
        <div className="space-y-2.5">
          {cores.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-light text-mint-dark">
                  <Icon name="pin" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.connected ? "연결됨" : "연결 끊김"}
                  </p>
                </div>
              </div>
              <BatteryBar level={c.battery} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onGo("reward")}
        className="flex w-full items-center gap-3 rounded-2xl bg-navy p-4 text-left text-white transition active:scale-[.99]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <Icon name="wallet" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-xs opacity-80">보유 안심 포인트</p>
          <p className="text-lg font-extrabold tabular-nums">
            {points.toLocaleString()} P
          </p>
        </div>
        <span className="text-sm opacity-70">지갑 보기 ›</span>
      </button>
    </div>
  )
}

/* ---------- 1) 지오펜스 라이브 지도 ---------- */

function LiveMapScreen({
  radius,
  setRadius,
  cores,
  setCores,
  latest,
  relayOn,
  setRelayOn,
}: {
  radius: number
  setRadius: (r: number) => void
  cores: Core[]
  setCores: React.Dispatch<React.SetStateAction<Core[]>>
  latest?: EventRow
  relayOn: boolean
  setRelayOn: (v: boolean) => void
}) {
  const monitored = cores.filter((c) => c.connected && c.monitoring)
  const monitoringOn = monitored.length > 0
  const active = monitored[0] ?? cores.find((c) => c.connected) ?? cores[0]

  const inside = latest?.status !== "exit"
  const safe = monitoringOn && inside
  const breach = monitoringOn && !inside
  const pct = monitoringOn ? (inside ? 0.15 : 1) : 0

  const bannerBg = breach ? "bg-coral" : safe ? "bg-mint" : "bg-gray-400"
  const markColor = breach ? "bg-coral" : safe ? "bg-mint" : "bg-gray-300"

  function toggleCore(id: string) {
    setCores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monitoring: !c.monitoring } : c)),
    )
  }

  return (
    <div className="space-y-5">
      <div
        className={`flex items-center gap-3 rounded-3xl p-4 text-white transition-colors ${bannerBg}`}
      >
        <div className="h-12 w-12 rounded-2xl border-2 border-white/60 bg-gray-200" />
        <div className="flex-1">
          <p className="text-xs opacity-90">
            {PROTECTED.name} · {PROTECTED.relation}
          </p>
          <p className="text-lg font-extrabold">
            {breach ? "이탈 감지" : safe ? "안심 · 반경 내" : "모니터링 꺼짐"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] opacity-80">디바이스</p>
          <BatteryBar level={active.battery} />
        </div>
      </div>

      <SectionTitle
        title="라이브 지도"
        sub={monitoringOn ? (inside ? "반경 내" : "이탈") : "꺼짐"}
      />

      {relayOn && (
        <div className="animate-siren rounded-2xl px-4 py-3 text-white">
          <div className="flex items-start gap-2.5">
            <Icon name="megaphone" className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-extrabold">
                [실종경보] 성동구 실종아동 발생
              </p>
              <p className="text-xs opacity-90">
                7세 남아 · 파란 점퍼 · 성수동 인근 · 15:42 최종 확인
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative aspect-square overflow-hidden rounded-3xl ring-1 ring-gray-200">
        <MapSvg stroke="#D9ECEA" width={9}>
          <circle
            cx="200"
            cy="210"
            r={radius === 15 ? 78 : 118}
            fill={breach ? "#F0706016" : "#2A9D8F14"}
            stroke={breach ? "#F07060" : "#2A9D8F"}
            strokeWidth="2"
            strokeDasharray="7 6"
          />
        </MapSvg>

        <div
          className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy shadow-md"
          style={{
            left: "50%",
            top: "52.5%",
            transform: "translate(-50%,-50%)",
          }}
        >
          <Icon name="phone" className="h-5 w-5" />
          {monitoringOn && (
            <span
              className={`animate-pulse-ring absolute h-full w-full rounded-full ${
                breach ? "bg-coral/40" : "bg-mint/40"
              }`}
            />
          )}
        </div>

        <div
          className="absolute transition-all duration-700 ease-out"
          style={{
            left: "50%",
            top: "52.5%",
            transform: `translate(calc(-50% + ${pct * 110}px), calc(-50% - ${pct * 70}px))`,
          }}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ${markColor}`}
          >
            <Icon name="person" className="h-5 w-5" />
          </div>
        </div>

        {relayOn &&
          [
            { l: "26%", t: "30%" },
            { l: "72%", t: "40%" },
            { l: "64%", t: "74%" },
            { l: "33%", t: "70%" },
          ].map((p, i) => (
            <div
              key={i}
              className="animate-scan absolute h-3 w-3 rounded-full bg-coral ring-4 ring-coral/25"
              style={{ left: p.l, top: p.t, animationDelay: `${i * 0.35}s` }}
            />
          ))}

        <div className="absolute bottom-3 left-3 rounded-2xl bg-white/85 px-3 py-2 backdrop-blur">
          <p className="text-[11px] font-semibold text-gray-500">
            수신 신호
          </p>
          <p
            className={`mt-1 ${breach ? "text-coral-dark" : "text-navy"}`}
          >
            <SignalBars rssi={monitoringOn ? latest?.rssi : null} />
          </p>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 backdrop-blur">
          <Icon name="signal" className="h-4 w-4 text-mint-dark" />
          <span className="text-xs font-bold text-gray-500">
            {latest?.receiver ?? "신호 대기"}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 space-y-1 rounded-2xl bg-white/85 px-3 py-2 text-[10px] backdrop-blur">
          <p className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mint" /> 내 비콘
          </p>
          {relayOn && (
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-coral" /> 주변 실종 비콘
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            relayOn
              ? "bg-coral-light text-coral-dark"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon name="broadcast" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-navy">주변 안심 스캔</p>
          <p className="text-xs text-gray-500">
            {relayOn
              ? "주변 실종 비콘까지 함께 감지하고 있어요"
              : "내 비콘만 표시 중 · 켜면 주변도 함께 감지"}
          </p>
        </div>
        <Toggle checked={relayOn} onChange={() => setRelayOn(!relayOn)} />
      </div>

      <div>
        <SectionTitle title="안전반경 설정" />
        <div className="grid grid-cols-2 gap-3">
          {[15, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`rounded-2xl border-2 py-4 text-center transition active:scale-[.98] ${
                radius === r
                  ? "border-mint bg-mint-light"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p
                className={`text-2xl font-extrabold ${
                  radius === r ? "text-mint-dark" : "text-navy"
                }`}
              >
                {r}m
              </p>
              <p className="text-[11px] text-gray-500">
                {r === 15 ? "실내 · 혼잡 지역" : "야외 · 공원"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="이탈 알림 코어" sub="켜진 코어만 감지" />
        <div className="space-y-2.5">
          {cores.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    c.connected && c.monitoring
                      ? "bg-mint-light text-mint-dark"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon name="link" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {!c.connected
                      ? "연결 끊김"
                      : c.monitoring
                        ? "이탈 알림 켜짐"
                        : "이탈 알림 꺼짐"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BatteryBar level={c.battery} />
                <Toggle
                  checked={c.connected && c.monitoring}
                  onChange={() => c.connected && toggleCore(c.id)}
                  disabled={!c.connected}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ---------- 2) 활동 리포트 ---------- */

const PLACES = [
  { name: "집", desc: "매일 · 하루 평균 14시간", freq: 100, icon: "home2" },
  { name: "유치원", desc: "평일 · 9–14시", freq: 74, icon: "pin" },
  { name: "영어학원", desc: "주 4회 · 15-17시", freq: 58, icon: "pin" },
  { name: "놀이터", desc: "주 2회 · 14-15시", freq: 34, icon: "pin" },
]

const TIER = {
  core: { fill: ["#2A9D8F33", "#2A9D8F55"], dot: "h-2 w-2 bg-mint/70", pin: "bg-mint" },
  peripheral: { fill: ["#F2BE5522", "#F2BE5540"], dot: "h-1.5 w-1.5 bg-[#F2BE55]/80", pin: "bg-[#F2BE55]" },
  rare: { fill: ["#F0706026", "#F0706048"], dot: "h-1.5 w-1.5 bg-coral/75", pin: "bg-coral" },
}
type Tier = keyof typeof TIER

const ACTIVITY_CLUSTERS: { x: number; y: number; r: number; tier: Tier }[] = [
  { x: 200, y: 205, r: 42, tier: "core" },
  { x: 300, y: 150, r: 30, tier: "core" },
  { x: 120, y: 120, r: 26, tier: "peripheral" },
  { x: 150, y: 300, r: 22, tier: "peripheral" },
  { x: 358, y: 318, r: 18, tier: "rare" },
  { x: 52, y: 326, r: 16, tier: "rare" },
]

const ACTIVITY_DOTS: Record<Tier, number[][]> = {
  core: [[48, 50], [52, 46], [45, 54], [55, 52], [50, 48], [53, 55], [72, 36], [76, 40], [68, 39], [74, 33], [70, 38], [73, 42]],
  peripheral: [[28, 28], [32, 32], [26, 33], [30, 26], [36, 74], [40, 78], [33, 72], [38, 76], [60, 40], [42, 62], [58, 62], [50, 66]],
  rare: [[88, 79], [91, 82], [86, 76], [89, 84], [12, 80], [15, 83], [10, 77], [13, 85]],
}

const DAY_PATTERN = {
  weekday: [
    { label: "집", from: 0, to: 9, out: false },
    { label: "유치원", from: 9, to: 11, out: true },
    { label: "집", from: 11, to: 14, out: false },
    { label: "영어학원", from: 14, to: 17, out: true },
    { label: "집", from: 17, to: 24, out: false },
  ],
  weekend: [
    { label: "집", from: 0, to: 10, out: false },
    { label: "놀이터", from: 10, to: 13, out: true },
    { label: "집", from: 13, to: 24, out: false },
  ],
}

function ReportScreen({ onPreviewAlert }: { onPreviewAlert: () => void }) {
  const [day, setDay] = useState<"weekday" | "weekend">("weekday")
  const segments = DAY_PATTERN[day]
  const nowHour = 15.3

  return (
    <div className="space-y-5">
      <SectionTitle title="활동 리포트" sub="최근 14일 분석" />

      <div className="relative overflow-hidden rounded-3xl bg-mint p-6 text-white">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Icon name="chart" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm opacity-90">오늘의 생활 패턴</p>
            <p className="text-xl font-extrabold">평소와 비슷해요</p>
          </div>
        </div>
        <p className="relative mt-4 text-[13px] leading-relaxed opacity-90">
          김서준님은 평소 생활 리듬을 안정적으로 유지하고 있어요. 자주 가는 곳과
          이동 경로를 학습해 이상 징후를 미리 살펴봐요.
        </p>
      </div>

      <div>
        <SectionTitle title="행동반경 지도" sub="최근 14일 방문 기록" />
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="relative aspect-square">
            <MapSvg stroke="#DCEEEC" width={8}>
              <circle
                cx="200"
                cy="205"
                r="150"
                fill="#2A9D8F10"
                stroke="#2A9D8F"
                strokeWidth="2"
                strokeDasharray="7 6"
              />
              {ACTIVITY_CLUSTERS.map((c, i) => (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r={c.r} fill={TIER[c.tier].fill[0]} />
                  <circle cx={c.x} cy={c.y} r={c.r * 0.55} fill={TIER[c.tier].fill[1]} />
                </g>
              ))}
            </MapSvg>

            {(Object.keys(ACTIVITY_DOTS) as Tier[]).flatMap((tier) =>
              ACTIVITY_DOTS[tier].map(([x, y], i) => (
                <span
                  key={`${tier}${i}`}
                  className={`absolute rounded-full ${TIER[tier].dot}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              )),
            )}

            {ACTIVITY_CLUSTERS.map((c, i) => (
              <div
                key={i}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${(c.x / 400) * 100}%`, top: `${(c.y / 400) * 100}%` }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md ${TIER[c.tier].pin}`}
                >
                  <Icon name={c.tier === "core" ? "home2" : "pin"} className="h-4 w-4" />
                </span>
              </div>
            ))}

            <div className="absolute left-3 top-3 rounded-2xl bg-white/85 px-3 py-2 backdrop-blur">
              <p className="text-[11px] font-semibold text-gray-500">
                평소 행동반경
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-navy">
                1.2<span className="text-sm">km</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-[11px]">
            {[
              ["bg-mint", "생활 거점"],
              ["bg-[#F2BE55]", "반경 근처"],
              ["bg-coral", "반경 밖"],
            ].map(([c, t]) => (
              <span key={t} className="flex items-center gap-1.5 text-gray-500">
                <span className={`h-2.5 w-2.5 rounded-full ${c}`} /> {t}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-gray-400">
          주변 기기 신호를 안전하게 수집해 자주 지나는 위치를 지도에 기록하고,
          이를 바탕으로 평소 생활 반경을 그려요.
        </p>
      </div>

      <div>
        <SectionTitle title="자주 머무는 곳" sub="자동 분석" />
        <div className="space-y-2.5">
          {PLACES.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-light text-mint-dark">
                  <Icon name={p.icon} className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-navy">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
                <span className="text-xs font-bold tabular-nums text-mint-dark">
                  {p.freq}%
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-mint transition-all"
                  style={{ width: `${p.freq}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="시간대별 안전 구역" sub="자동 설정" />
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
            {(["weekday", "weekend"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  day === d
                    ? "bg-white text-mint-dark shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {d === "weekday" ? "평일" : "주말"}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="flex h-9 w-full overflow-hidden rounded-lg">
              {segments.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center text-[10px] font-bold ${
                    s.out
                      ? "bg-coral-light text-coral-dark"
                      : "bg-mint-light text-mint-dark"
                  }`}
                  style={{ width: `${((s.to - s.from) / 24) * 100}%` }}
                >
                  {s.to - s.from >= 3 ? s.label : ""}
                </div>
              ))}
            </div>
            <div
              className="absolute -top-1 bottom-0 w-0.5 bg-navy"
              style={{ left: `${(nowHour / 24) * 100}%` }}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-navy" />
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
            {[0, 6, 12, 18, 24].map((h) => (
              <span key={h}>{h}시</span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-mint-light px-3 py-2.5 text-mint-dark">
            <Icon name="signal" className="h-4 w-4 shrink-0" />
            <p className="text-xs font-semibold">
              지금 시간대 평소 활동 반경: 약 350m 이내
            </p>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle title="평소 경로 이탈 경보" sub="선제 알림" />
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-light text-coral-dark">
              <Icon name="route" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-navy">
                평소와 다른 이동을 미리 알려드려요
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                평소 가지 않던 방향이나 이례적인 시간대로 이동하면, 재난문자보다
                먼저 보호자에게 선제적으로 알림을 보냅니다.
              </p>
            </div>
          </div>
          <button
            onClick={onPreviewAlert}
            className="mt-3 w-full rounded-xl bg-navy py-2.5 text-sm font-bold text-white transition active:scale-[.98]"
          >
            선제 경보 미리보기
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- 3) 안심 리워드 ---------- */

function RewardScreen({
  points,
  rewards,
  relayOn,
  setRelayOn,
  onScan,
  onRedeem,
}: {
  points: number
  rewards: Reward[]
  relayOn: boolean
  setRelayOn: (v: boolean) => void
  onScan: () => void
  onRedeem: (item: ShopItem) => void
}) {
  const [purchased, setPurchased] = useState<ShopItem | null>(null)

  function buy(item: ShopItem) {
    if (points < item.cost) return
    onRedeem(item)
    setPurchased(item)
    setTimeout(() => setPurchased(null), 2200)
  }

  return (
    <div className="space-y-5">
      {purchased && (
        <div className="animate-fade-in sticky top-0 z-10 flex items-center gap-3 rounded-2xl bg-mint p-3.5 text-white shadow-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">교환 완료!</p>
            <p className="text-xs opacity-90">
              {purchased.name} 기프티콘이 발급되었어요
            </p>
          </div>
        </div>
      )}

      <SectionTitle title="안심 리워드 지갑" sub="함께 찾기 기여" />

      <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
        <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-mint/20" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-coral/20" />
        <p className="relative text-sm opacity-80">보유 안심 포인트</p>
        <p className="relative mt-1 text-4xl font-extrabold tracking-tight tabular-nums">
          {points.toLocaleString()}
          <span className="ml-1 text-lg font-bold text-mint">P</span>
        </p>
        <p className="relative mt-3 text-xs opacity-70">
          누적 제보 {rewards.length}건 · 지역 안전망에 기여하고 있어요
        </p>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                relayOn
                  ? "bg-mint-light text-mint-dark"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <Icon name="broadcast" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">주변 안심 스캔</p>
              <p className="text-xs text-gray-500">
                켜두면 자동으로 안심 포인트 적립
              </p>
            </div>
          </div>
          <Toggle checked={relayOn} onChange={() => setRelayOn(!relayOn)} />
        </div>

        {relayOn && (
          <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-xl bg-mint-light px-3 py-2.5 text-mint-dark">
            <Icon name="search" className="animate-scan h-4 w-4 shrink-0" />
            <p className="text-xs font-semibold">주변을 안심 스캔하고 있어요</p>
          </div>
        )}

        <button
          onClick={onScan}
          disabled={!relayOn}
          className="mt-3 w-full rounded-xl bg-coral py-2.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-40"
        >
          안심 활동 적립하기 (+500P)
        </button>
      </div>

      <div>
        <SectionTitle title="리워드 상점" sub="포인트로 교환" />
        <div className="grid grid-cols-2 gap-3">
          {SHOP_ITEMS.map((item) => {
            const affordable = points >= item.cost
            return (
              <div
                key={item.id}
                className="flex flex-col rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex h-20 items-center justify-center rounded-xl bg-mint-light text-mint-dark">
                  <Icon name="gift" className="h-8 w-8" />
                </div>
                <p className="mt-2.5 text-[11px] font-semibold text-mint-dark">
                  {item.brand}
                </p>
                <p className="text-sm font-bold leading-tight text-navy">
                  {item.name}
                </p>
                <p className="mt-1 text-sm font-extrabold tabular-nums text-navy">
                  {item.cost.toLocaleString()}
                  <span className="text-xs text-gray-500"> P</span>
                </p>
                <button
                  onClick={() => buy(item)}
                  disabled={!affordable}
                  className={`mt-2.5 w-full rounded-xl py-2 text-xs font-bold transition active:scale-[.97] ${
                    affordable
                      ? "bg-mint text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {affordable ? "교환하기" : "포인트 부족"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle title="적립 내역" />
        <div className="space-y-2">
          {rewards.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-light text-mint-dark">
                <Icon name="pin" className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy">{r.label}</p>
                <p className="text-xs text-gray-500">
                  {r.area} · {r.ts}
                </p>
              </div>
              <span className="text-sm font-extrabold text-mint">
                +{r.points}P
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- 사이드 패널 & 서브페이지 ---------- */

const MENU_ITEMS = [
  ["프로필", "보호 대상 · 착코어 정보", "person"],
  ["마이페이지", "구독 · 리워드 · 주문 내역", "home2"],
  ["간단한 설정", "알림 · 안전반경 · 개인정보", "settings"],
  ["자사몰", "착코어 · 액세서리 구매", "store"],
]

function Drawer({
  onClose,
  onOpenPage,
}: {
  onClose: () => void
  onOpenPage: (page: string) => void
}) {
  return (
    <div className="absolute inset-0 z-40 flex">
      <div
        className="animate-fade-in absolute inset-0 bg-navy/30"
        onClick={onClose}
      />
      <div className="animate-slide-up relative flex h-full w-[80%] max-w-80 flex-col bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-mint-light px-5 py-6">
          <div className="h-14 w-14 rounded-full bg-gray-200" />
          <div>
            <p className="text-base font-extrabold text-navy">김보호 님</p>
            <p className="text-xs text-gray-500">프리미엄 케어 구독 중</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {MENU_ITEMS.map(([label, sub, icon]) => (
            <button
              key={label}
              onClick={() => onOpenPage(label)}
              className="flex w-full items-center gap-3.5 rounded-2xl px-3 py-3.5 text-left transition active:bg-gray-100"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-light text-mint-dark">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-navy">{label}</span>
                <span className="block text-xs text-gray-500">{sub}</span>
              </span>
              <Icon name="chevron" className="h-4 w-4 text-gray-300" />
            </button>
          ))}
        </nav>
        <p className="px-5 py-4 text-[11px] text-gray-400">ChakCare v1.0.0</p>
      </div>
    </div>
  )
}

function KvRows({ rows }: { rows: string[][] }) {
  return rows.map(([k, v]) => (
    <div
      key={k}
      className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-gray-100"
    >
      <span className="text-sm text-gray-500">{k}</span>
      <span className="text-sm font-bold text-navy">{v}</span>
    </div>
  ))
}

function MenuPage({ page, onClose }: { page: string; onClose: () => void }) {
  return (
    <div className="animate-fade-in absolute inset-0 z-50 flex flex-col bg-gray-50">
      <header className="flex items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3.5 backdrop-blur">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-navy transition active:scale-90 active:bg-gray-100"
        >
          <Icon name="chevron" className="h-6 w-6 rotate-180" />
        </button>
        <p className="text-base font-extrabold text-navy">{page}</p>
      </header>
      <div className="flex-1 overflow-y-auto p-5">
        {page === "프로필" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-gray-200" />
              <div>
                <p className="text-lg font-extrabold text-navy">김서준</p>
                <p className="text-sm text-gray-500">아들 · 만 8세</p>
                <p className="mt-1 text-xs text-mint-dark">
                  착코어 A · B 연결됨
                </p>
              </div>
            </div>
            <KvRows
              rows={[
                ["보호자", "김보호 (엄마)"],
                ["비상 연락처", "010-1234-5678"],
                ["기본 안전반경", "30m"],
                ["특이사항", "노란 자켓 착용"],
              ]}
            />
          </div>
        )}
        {page === "마이페이지" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-mint p-5 text-white shadow-sm">
              <p className="text-xs opacity-80">보유 포인트</p>
              <p className="text-3xl font-extrabold tabular-nums">3,500P</p>
            </div>
            <KvRows
              rows={[
                ["구독 상태", "프리미엄 케어"],
                ["다음 결제일", "2026.09.15"],
                ["누적 안심 제보", "27회"],
                ["최근 주문", "착코어 B · 배송완료"],
              ]}
            />
          </div>
        )}
        {page === "간단한 설정" && (
          <div className="space-y-3">
            {[
              ["이탈 알림", true],
              ["평소 경로 이탈 선제 알림", true],
              ["재난문자 연동", true],
              ["주변 안심 스캔", true],
              ["진동", false],
            ].map(([k, on]) => (
              <div
                key={k as string}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <span className="text-sm font-semibold text-navy">{k}</span>
                <Toggle checked={Boolean(on)} onChange={() => {}} />
              </div>
            ))}
          </div>
        )}
        {page === "자사몰" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-coral-light p-5 ring-1 ring-coral/20">
              <p className="text-sm font-extrabold text-coral-dark">
                신규 회원 첫 구매 15% 할인
              </p>
              <p className="mt-1 text-xs text-gray-500">
                착코어 스타터 키트를 만나보세요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["착코어 (2개입)", "49,000원"],
                ["실리콘 스트랩", "8,900원"],
                ["신발 부착 클립", "6,500원"],
                ["가방 태그", "5,900원"],
              ].map(([n, p]) => (
                <div
                  key={n}
                  className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="mb-2 aspect-square rounded-xl bg-gray-200" />
                  <p className="text-xs font-bold text-navy">{n}</p>
                  <p className="text-sm font-extrabold text-mint-dark">{p}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const fmtTs = (ts: string) =>
  new Date(ts).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

function NotificationPanel({
  events,
  onClose,
}: {
  events: EventRow[]
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      <div
        className="animate-fade-in absolute inset-0 bg-navy/30"
        onClick={onClose}
      />
      <div className="animate-slide-up relative flex h-full w-[86%] max-w-85 flex-col bg-gray-50 shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/90 px-5 py-3.5 backdrop-blur">
          <p className="text-base font-extrabold text-navy">알림</p>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition active:scale-90 active:bg-gray-100"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {events.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              아직 알림이 없어요
            </p>
          )}
          {events.map((e) => {
            const out = e.status === "exit"
            return (
              <div
                key={e.id}
                className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    out
                      ? "bg-coral-light text-coral-dark"
                      : "bg-mint-light text-mint-dark"
                  }`}
                >
                  <Icon name={out ? "alert" : "check"} className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-navy">
                      {out ? "안전반경 이탈" : "안전반경 복귀"}
                    </p>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {fmtTs(e.ts)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                    {e.subject} 님이 {out ? "안전반경을 벗어났어요" : "안전반경 안으로 돌아왔어요"}
                    {e.receiver ? ` · ${e.receiver}` : ""}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- 메인 앱 ---------- */

const TABS = [
  { key: "home" as TabKey, label: "홈", icon: "home" },
  { key: "live" as TabKey, label: "라이브 지도", icon: "map" },
  { key: "report" as TabKey, label: "리포트", icon: "chart" },
  { key: "reward" as TabKey, label: "리워드", icon: "wallet" },
]

export default function App() {
  const [tab, setTab] = useState<TabKey>("home")
  const [radius, setRadius] = useState(30)
  const [points, setPoints] = useState(3500)
  const [relayOn, setRelayOn] = useState(true)
  const [events, setEvents] = useState<EventRow[]>([])
  const [activeAlert, setActiveAlert] = useState<EventRow | null>(null)
  const [patternAlert, setPatternAlert] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuPage, setMenuPage] = useState<null | string>(null)

  const [cores, setCores] = useState<Core[]>([
    { id: "c1", name: "착코어 A", battery: 82, connected: true, monitoring: true },
    { id: "c2", name: "착코어 B", battery: 34, connected: true, monitoring: false },
  ])

  const [rewards, setRewards] = useState<Reward[]>([
    reward("r1", "오늘 14:20", "성수동 2가"),
    reward("r2", "어제 19:05", "왕십리역 인근"),
    reward("r3", "8/23 11:40", "서울숲 공원"),
  ])

  function handleScan() {
    setPoints((p) => p + 500)
    setRewards((prev) => [reward(`r${Date.now()}`, "방금", "현재 위치 인근"), ...prev])
  }

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .order("ts", { ascending: false })
      .limit(20)
      .then(({ data }) => data && setEvents(data))

    const channel = supabase
      .channel("events-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        ({ new: row }) => {
          const e = row as EventRow
          setEvents((prev) => [e, ...prev].slice(0, 20))
          if (e.status === "exit") setActiveAlert(e)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const goLive = () => {
    setActiveAlert(null)
    setPatternAlert(false)
    setTab("live")
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 p-0 sm:p-6">
      <div className="relative flex h-full w-full max-w-110 flex-col overflow-hidden bg-gray-50 shadow-2xl sm:h-225 sm:rounded-[2.5rem]">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3.5 backdrop-blur">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-navy transition active:scale-90 active:bg-gray-100"
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <p className="text-lg font-extrabold tracking-tight text-navy">
            ChakCare
          </p>
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-navy transition active:scale-90 active:bg-gray-100"
          >
            <Icon name="bell" className="h-6 w-6" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral ring-2 ring-white" />
          </button>
        </header>

        {/* 스크롤 콘텐츠 */}
        <main className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "home" && (
            <HomeScreen
              cores={cores}
              radius={radius}
              points={points}
              relayOn={relayOn}
              onGo={setTab}
            />
          )}
          {tab === "live" && (
            <LiveMapScreen
              radius={radius}
              setRadius={setRadius}
              cores={cores}
              setCores={setCores}
              latest={events[0]}
              relayOn={relayOn}
              setRelayOn={setRelayOn}
            />
          )}
          {tab === "report" && (
            <ReportScreen onPreviewAlert={() => setPatternAlert(true)} />
          )}
          {tab === "reward" && (
            <RewardScreen
              points={points}
              rewards={rewards}
              relayOn={relayOn}
              setRelayOn={setRelayOn}
              onScan={handleScan}
              onRedeem={(item) => setPoints((p) => Math.max(0, p - item.cost))}
            />
          )}
        </main>

        {/* 하단 탭바 */}
        <nav className="grid grid-cols-4 border-t border-gray-100 bg-white/95 px-1.5 pb-2 pt-1.5 backdrop-blur">
          {TABS.map((t) => {
            const on = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition active:scale-95 ${
                  on ? "text-mint" : "text-gray-400"
                }`}
              >
                <Icon
                  name={t.icon}
                  className={`h-6 w-6 transition-transform ${
                    on ? "scale-110" : ""
                  }`}
                />
                <span
                  className={`text-[10px] font-bold ${
                    on ? "text-mint" : "text-gray-500"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* 모달 & 오버레이 */}
        {activeAlert && (
          <AlertModal
            event={activeAlert}
            radius={radius}
            onClose={() => setActiveAlert(null)}
            onViewLocation={goLive}
          />
        )}

        {patternAlert && (
          <AlertSheet
            icon="route"
            title="평소 경로 이탈 감지"
            sub={PROTECTED.name}
            vibrate={[300, 150, 300]}
            confirm="위치 확인"
            onClose={() => setPatternAlert(false)}
            onConfirm={goLive}
          >
            <p className="text-center text-xl font-extrabold text-navy">
              평소 이동 경로를
              <br />
              <span className="text-coral-dark">80% 이상</span> 벗어났습니다
            </p>
            <p className="rounded-2xl bg-coral-light px-4 py-3 text-center text-[13px] leading-relaxed text-coral-dark">
              평소 가지 않던 방향으로 이동하고 있어요. 위치를 확인해 주세요.
            </p>
          </AlertSheet>
        )}

        {drawerOpen && (
          <Drawer
            onClose={() => setDrawerOpen(false)}
            onOpenPage={(p) => {
              setMenuPage(p)
              setDrawerOpen(false)
            }}
          />
        )}

        {menuPage && (
          <MenuPage page={menuPage} onClose={() => setMenuPage(null)} />
        )}

        {notifOpen && (
          <NotificationPanel events={events} onClose={() => setNotifOpen(false)} />
        )}
      </div>
    </div>
  )
}
