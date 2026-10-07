import type { BeaconStatus } from "../lib/useBeaconStatus"
import type { Core, TabKey, Person } from "../types"
import { Icon } from "../components/Icon"
import { BatteryBadge, SectionTitle } from "../components/ui"
import { toneBg, statusText, personLabel, PeopleCarousel } from "../components/PeopleCarousel"

export function HomeScreen({
  cores,
  people,
  beacons,
  radius,
  points,
  relayOn,
  onGo,
}: {
  cores: Core[]
  people: Person[]
  beacons: Record<string, BeaconStatus>
  radius: number
  points: number
  relayOn: boolean
  onGo: (t: TabKey) => void
}) {
  const connected = cores.filter((c) => c.connected).length
  return (
    <div className="space-y-5">
      <PeopleCarousel people={people}>
        {(p) => (
          <div className={`relative overflow-hidden rounded-3xl p-6 text-white transition-colors ${toneBg(p)}`}>
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute right-6 top-8 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl border-2 border-white/60 bg-gray-200" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white">
                  <span className={`block h-2 w-2 rounded-full ${p.breach ? "bg-coral" : "bg-mint"}`} />
                </span>
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">{personLabel(p)}</p>
                <p className="text-2xl font-extrabold tracking-tight">{statusText(p)}</p>
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
        )}
      </PeopleCarousel>

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
              <BatteryBadge core={c} beacons={beacons} />
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
