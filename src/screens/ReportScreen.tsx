import { useState } from "react"
import { Icon } from "../components/Icon"
import { SectionTitle } from "../components/ui"

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

export function ReportScreen({ onPreviewAlert }: { onPreviewAlert: () => void }) {
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
