import GuardianMap from "../GuardianMap"
import type { BeaconStatus } from "../lib/useBeaconStatus"
import type { Core, Person } from "../types"
import { Icon } from "../components/Icon"
import { BatteryBadge, SignalBars, SectionTitle, Toggle } from "../components/ui"
import { toneBg, statusText, personLabel, PeopleCarousel } from "../components/PeopleCarousel"

export function LiveMapScreen({
  people,
  beacons,
  radius,
  setRadius,
  cores,
  setCores,
  relayOn,
  setRelayOn,
}: {
  people: Person[]
  beacons: Record<string, BeaconStatus>
  radius: number
  setRadius: (r: number) => void
  cores: Core[]
  setCores: React.Dispatch<React.SetStateAction<Core[]>>
  relayOn: boolean
  setRelayOn: (v: boolean) => void
}) {
  const monitoringOn = people.some((p) => p.monitoring)
  const breach = people.some((p) => p.breach)
  const top = people[0]

  function toggleCore(id: string) {
    setCores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monitoring: !c.monitoring } : c)),
    )
  }

  return (
    <div className="space-y-5">
      <PeopleCarousel people={people}>
        {(p) => (
          <div className={`flex items-center gap-3 rounded-3xl p-4 text-white transition-colors ${toneBg(p)}`}>
            <div className="h-12 w-12 rounded-2xl border-2 border-white/60 bg-gray-200" />
            <div className="flex-1">
              <p className="text-xs opacity-90">{personLabel(p)}</p>
              <p className="text-lg font-extrabold">{statusText(p)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] opacity-80">디바이스</p>
              <BatteryBadge core={p.core} beacons={beacons} onDark />
            </div>
          </div>
        )}
      </PeopleCarousel>

      <SectionTitle
        title="라이브 지도"
        sub={monitoringOn ? (breach ? "이탈" : "반경 내") : "꺼짐"}
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

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-gray-500">
          <span>수신 신호</span>
          <span className={breach ? "text-coral-dark" : "text-navy"}>
            <SignalBars rssi={monitoringOn ? top?.last?.rssi : null} />
          </span>
        </div>
        <GuardianMap
          receiverName={top?.last?.receiver ?? "3층출입구"}
          radius={radius}
          breach={breach}
          monitoringOn={monitoringOn}
        />
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
                <BatteryBadge core={c} beacons={beacons} />
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
