import { useEffect, useRef, useState } from "react";

/* ============================================================
   착케어 (ChakCare) — 실종·분실 방지 스마트 앱
   MVP: (1) 0.5초 지오펜싱 이탈 경보 (칼만 필터)
        (2) 백그라운드 P2P 릴레이 스캔 + 안심 리워드
        (3) 재난문자 연동 실시간 탐색 지도 (E2EE / 가명 ID)
   ============================================================ */

type Core = {
  id: string;
  name: string;
  battery: number; // %
  connected: boolean;
  monitoring: boolean; // 이탈 알림 on/off
  rssi: number; // dBm (raw)
};

type Reward = {
  id: string;
  ts: string;
  label: string;
  area: string;
  points: number;
};

type ShopItem = {
  id: string;
  brand: string;
  name: string;
  cost: number;
};

const SHOP_ITEMS: ShopItem[] = [
  { id: "s1", brand: "카페", name: "아메리카노 Tall", cost: 4500 },
  { id: "s2", brand: "편의점", name: "5,000원 금액권", cost: 5000 },
  { id: "s3", brand: "베이커리", name: "조각케이크 교환권", cost: 6500 },
  { id: "s4", brand: "치킨", name: "후라이드 한 마리", cost: 20000 },
];

type TabKey = "home" | "geo" | "map" | "reward";

const PROTECTED = {
  name: "김서준",
  relation: "아들 · 만 7세",
  photo:
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop&auto=format",
};

/* ---------- 신호 유틸: RSSI → 거리, 칼만 필터 ---------- */

// 로그-거리 경로손실 모델로 RSSI를 대략적 거리(m)로 환산
function rssiToDistance(rssi: number, txPower = -59, n = 2.4) {
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

// 1D 칼만 필터 (신호 보정 엔진)
class Kalman {
  private R: number; // 측정 잡음
  private Q: number; // 프로세스 잡음
  private A = 1;
  private C = 1;
  private cov = NaN;
  private x = NaN;
  constructor(R = 4, Q = 0.6) {
    this.R = R;
    this.Q = Q;
  }
  filter(z: number) {
    if (isNaN(this.x)) {
      this.x = z / this.C;
      this.cov = this.R / (this.C * this.C);
    } else {
      const predX = this.A * this.x;
      const predCov = this.A * this.cov * this.A + this.Q;
      const K = (predCov * this.C) / (this.C * predCov * this.C + this.R);
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }
    return this.x;
  }
}

/* ============================================================
   단색 라인 아이콘
   ============================================================ */

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "home"
    | "signal"
    | "map"
    | "wallet"
    | "person"
    | "phone"
    | "link"
    | "alert"
    | "megaphone"
    | "search"
    | "pin"
    | "broadcast"
    | "gift"
    | "check"
    | "walk"
    | "pause";
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </>
    ),
    signal: (
      <>
        <path d="M12 20h.01" />
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <path d="M5.5 13a10 10 0 0 1 13 0" />
        <path d="M2.5 9.5a15 15 0 0 1 19 0" />
      </>
    ),
    map: (
      <>
        <path d="M9 3 3 5.5v15.5l6-2.5 6 2.5 6-2.5V3l-6 2.5L9 3Z" />
        <path d="M9 3v15.5" />
        <path d="M15 5.5V21" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <path d="M16 14.5h.01" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </>
    ),
    phone: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="2.5" />
        <path d="M11 18h2" />
      </>
    ),
    link: (
      <>
        <path d="M9.5 14.5l5-5" />
        <path d="M11.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1" />
        <path d="M12.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2 20h20L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    megaphone: (
      <>
        <path d="M4 10v4h4l7 4V6l-7 4H4Z" />
        <path d="M18 9a3 3 0 0 1 0 6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    broadcast: (
      <>
        <circle cx="12" cy="12" r="2" />
        <path d="M8 8a5.6 5.6 0 0 0 0 8" />
        <path d="M16 8a5.6 5.6 0 0 1 0 8" />
        <path d="M5 5a10 10 0 0 0 0 14" />
        <path d="M19 5a10 10 0 0 1 0 14" />
      </>
    ),
    gift: (
      <>
        <path d="M4 11.5h16V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5Z" />
        <path d="M3 8h18v3.5H3V8Z" />
        <path d="M12 8v13" />
        <path d="M12 8S10.5 3.5 8 4.5 9.5 8 12 8Zm0 0s1.5-4.5 4-3.5S14.5 8 12 8Z" />
      </>
    ),
    check: (
      <>
        <path d="M5 12.5l4.5 4.5L19 7" />
      </>
    ),
    walk: (
      <>
        <circle cx="13" cy="4.5" r="1.6" />
        <path d="M11 21l1.5-5-2.5-2.5 1-5 3 2 2 2" />
        <path d="M11 13l-2 3-2 3" />
      </>
    ),
    pause: (
      <>
        <path d="M9 6v12" />
        <path d="M15 6v12" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

/* ============================================================
   작은 UI 컴포넌트
   ============================================================ */

function BatteryBar({ level }: { level: number }) {
  const color =
    level > 50 ? "bg-mint" : level > 20 ? "bg-amber-400" : "bg-coral";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3.5 w-7 rounded-[3px] border-[1.5px] border-gray-500/60">
        <div
          className={`absolute inset-[1.5px] rounded-[1px] ${color} transition-all`}
          style={{ width: `calc(${Math.max(6, level)}% - 3px)` }}
        />
        <div className="absolute -right-[3px] top-1/2 h-1.5 w-[2px] -translate-y-1/2 rounded-r bg-gray-500/60" />
      </div>
      <span className="text-xs font-semibold tabular-nums text-gray-700">
        {level}%
      </span>
    </div>
  );
}

function SignalBars({ rssi }: { rssi: number }) {
  // rssi 범위 대략 -40(강) ~ -95(약)
  const strength = Math.min(4, Math.max(0, Math.round((rssi + 95) / 14)));
  return (
    <div className="flex items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-colors ${
            i < strength ? "bg-mint" : "bg-gray-200"
          }`}
          style={{ height: 5 + i * 4 }}
        />
      ))}
    </div>
  );
}

function Chip({
  children,
  tone = "mint",
}: {
  children: React.ReactNode;
  tone?: "mint" | "coral" | "gray";
}) {
  const tones = {
    mint: "bg-mint-light text-mint-dark",
    coral: "bg-coral-light text-coral-dark",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-[15px] font-extrabold tracking-tight text-navy">
        {title}
      </h2>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

/* ============================================================
   비상 경보 모달 (0.5초 즉각 경보)
   ============================================================ */

function AlertModal({
  core,
  distance,
  radius,
  onClose,
}: {
  core: Core;
  distance: number;
  radius: number;
  onClose: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    try {
      navigator.vibrate?.([400, 200, 400, 200, 600]);
    } catch {}
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-navy/60 backdrop-blur-sm">
      <div className="animate-slide-up w-full overflow-hidden rounded-t-3xl bg-white">
        <div className="animate-siren px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Icon name="alert" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-tight">
                안전반경 이탈 감지
              </p>
              <p className="text-sm opacity-90">
                {PROTECTED.name} · {core.name}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-8 pt-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-coral-light py-3">
              <p className="text-[11px] font-semibold text-coral-dark">
                추정 거리
              </p>
              <p className="text-xl font-extrabold text-coral-dark">
                {distance.toFixed(0)}m
              </p>
            </div>
            <div className="rounded-2xl bg-gray-100 py-3">
              <p className="text-[11px] font-semibold text-gray-500">
                안전반경
              </p>
              <p className="text-xl font-extrabold text-navy">{radius}m</p>
            </div>
            <div className="rounded-2xl bg-gray-100 py-3">
              <p className="text-[11px] font-semibold text-gray-500">경과</p>
              <p className="text-xl font-extrabold text-navy tabular-nums">
                {seconds}s
              </p>
            </div>
          </div>

          <p className="rounded-2xl bg-mint-light px-4 py-3 text-[13px] leading-relaxed text-mint-dark">
            안전반경을 벗어났습니다. 주변을 즉시 확인해 주세요.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-bold text-gray-700 transition active:scale-[.98]"
            >
              해제
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-coral py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/30 transition active:scale-[.98]"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   0) 홈
   ============================================================ */

function HomeScreen({
  cores,
  radius,
  points,
  relayOn,
  onGo,
}: {
  cores: Core[];
  radius: number;
  points: number;
  relayOn: boolean;
  onGo: (t: TabKey) => void;
}) {
  const connected = cores.filter((c) => c.connected).length;
  const safe = true;
  return (
    <div className="space-y-5">
      {/* 대형 상태 카드 */}
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
              {PROTECTED.name} · {PROTECTED.relation}
            </p>
            <p className="text-2xl font-extrabold tracking-tight">
              {safe ? "안심 · 반경 내" : "이탈 감지"}
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

      {/* 빠른 실행 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { t: "지오펜스", i: "signal" as const, tab: "geo" as TabKey },
          { t: "탐색 지도", i: "map" as const, tab: "map" as TabKey },
          { t: "안심 리워드", i: "wallet" as const, tab: "reward" as TabKey },
        ].map((q) => (
          <button
            key={q.t}
            onClick={() => onGo(q.tab)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-light text-mint-dark">
              <Icon name={q.i} className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold text-gray-700">
              {q.t}
            </span>
          </button>
        ))}
      </div>

      {/* 디바이스 배터리 */}
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

      {/* 안심 요약 */}
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
  );
}

/* ============================================================
   1) 지오펜스
   ============================================================ */

function GeofenceScreen({
  radius,
  setRadius,
  cores,
  setCores,
  onTriggerAlert,
}: {
  radius: number;
  setRadius: (r: number) => void;
  cores: Core[];
  setCores: React.Dispatch<React.SetStateAction<Core[]>>;
  onTriggerAlert: (core: Core, distance: number) => void;
}) {
  const monitored = cores.filter((c) => c.connected && c.monitoring);
  const monitoringOn = monitored.length > 0;
  const active = monitored[0] ?? cores.find((c) => c.connected) ?? cores[0];

  // 칼만 필터로 RSSI를 내부 보정 (화면에는 결과 거리만 노출)
  const [lastFiltered, setLastFiltered] = useState(-60);
  const [walking, setWalking] = useState(false); // 움직임 감지 (걷는 중/정지)
  const kalman = useRef(new Kalman());
  const baseRef = useRef(-60);

  useEffect(() => {
    const id = setInterval(() => {
      if (walking) {
        // 이동 중일 때만 신호가 약해지며 멀어짐
        baseRef.current = Math.max(-95, baseRef.current - 1.8);
      } else {
        // 정지 상태에서는 안정적으로 제자리(-60) 유지
        baseRef.current += (-60 - baseRef.current) * 0.3;
      }
      const jitter = walking ? 9 : 2;
      const noisy = baseRef.current + (Math.random() - 0.5) * jitter;
      setLastFiltered(kalman.current.filter(noisy));
    }, 250);
    return () => clearInterval(id);
  }, [walking]);

  const distance = rssiToDistance(lastFiltered);
  const inside = distance <= radius;
  const safe = monitoringOn && inside;
  const breach = monitoringOn && !inside;
  const pct = monitoringOn ? Math.min(1, distance / (radius * 1.6)) : 0;

  // 반경 이탈 순간, 모니터링 중인 경우에만 보호자에게 자동 경보
  const wasInside = useRef(true);
  useEffect(() => {
    if (monitoringOn && wasInside.current && !inside) {
      onTriggerAlert(active, distance);
    }
    wasInside.current = inside;
  }, [inside, monitoringOn]);

  const tone = breach ? "coral" : safe ? "mint" : "gray";
  const bannerBg =
    tone === "coral" ? "bg-coral" : tone === "mint" ? "bg-mint" : "bg-gray-400";
  const fieldBg =
    tone === "coral"
      ? "bg-coral-light"
      : tone === "mint"
      ? "bg-mint-light"
      : "bg-gray-100";
  const markColor =
    tone === "coral" ? "bg-coral" : tone === "mint" ? "bg-mint" : "bg-gray-300";
  const ringColor =
    tone === "coral"
      ? "border-coral/30"
      : tone === "mint"
      ? "border-mint/30"
      : "border-gray-300/50";

  function toggleCore(id: string) {
    setCores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monitoring: !c.monitoring } : c))
    );
  }

  return (
    <div className="space-y-5">
      {/* 대상자 상태 배너 */}
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
        title="지오펜싱 안전반경"
        sub={monitoringOn ? (inside ? "반경 내" : "이탈") : "꺼짐"}
      />

      {/* 레이더 뷰 */}
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl transition-colors ${fieldBg}`}
      >
        {[1, 0.66, 0.33].map((r) => (
          <div
            key={r}
            className={`absolute rounded-full border ${ringColor}`}
            style={{ width: `${r * 88}%`, height: `${r * 88}%` }}
          />
        ))}
        <div
          className={`absolute rounded-full border-2 border-dashed ${
            breach ? "border-coral" : safe ? "border-mint" : "border-gray-300"
          }`}
          style={{ width: "58%", height: "58%" }}
        />
        <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-md">
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
          style={{ transform: `translate(${pct * 120}px, ${-pct * 70}px)` }}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ${markColor}`}
          >
            <Icon name="person" className="h-5 w-5" />
          </div>
        </div>

        {/* 추정 거리 */}
        <div className="absolute bottom-4 left-4 rounded-2xl bg-white/85 px-3 py-2 backdrop-blur">
          <p className="text-[11px] font-semibold text-gray-500">추정 거리</p>
          <p
            className={`text-2xl font-extrabold tabular-nums ${
              breach ? "text-coral-dark" : "text-navy"
            }`}
          >
            {monitoringOn ? distance.toFixed(1) : "–"}
            <span className="text-sm">m</span>
          </p>
        </div>

        {/* 움직임 상태 */}
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 backdrop-blur">
          <Icon
            name={walking ? "walk" : "pause"}
            className={`h-4 w-4 ${walking ? "text-mint-dark" : "text-gray-400"}`}
          />
          <span
            className={`text-xs font-bold ${
              walking ? "text-mint-dark" : "text-gray-500"
            }`}
          >
            {walking ? "걷는 중" : "정지 상태"}
          </span>
        </div>
      </div>

      {/* 반경 선택 */}
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

      {/* 코어별 이탈 알림 on/off */}
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
                <button
                  onClick={() => c.connected && toggleCore(c.id)}
                  disabled={!c.connected}
                  className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-40 ${
                    c.connected && c.monitoring ? "bg-mint" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                      c.connected && c.monitoring ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 데모: 반경 이탈 시뮬레이션 (작은 버튼) */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <button
          onMouseDown={() => setWalking(true)}
          onMouseUp={() => setWalking(false)}
          onMouseLeave={() => setWalking(false)}
          onTouchStart={() => setWalking(true)}
          onTouchEnd={() => setWalking(false)}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 transition active:scale-95"
        >
          <Icon name="walk" className="h-4 w-4" />
          {walking ? "멀어지는 중…" : "이탈 시뮬레이션 (길게 누르기)"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   2) 재난문자 연동 탐색 지도
   ============================================================ */

function MapScreen({ relayOn }: { relayOn: boolean }) {
  const [alertActive, setAlertActive] = useState(true);
  return (
    <div className="space-y-5">
      <SectionTitle title="실시간 탐색 지도" sub="재난문자 연동" />

      {alertActive && (
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
            <button
              onClick={() => setAlertActive(false)}
              className="text-xs font-bold opacity-80"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-gray-200">
        <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full">
          <rect width="400" height="500" fill="#EEF7F6" />
          {[80, 160, 240, 320].map((y) => (
            <line
              key={`h${y}`}
              x1="0"
              y1={y}
              x2="400"
              y2={y}
              stroke="#D4E8E6"
              strokeWidth="10"
            />
          ))}
          {[70, 160, 250, 340].map((x) => (
            <line
              key={`v${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="500"
              stroke="#D4E8E6"
              strokeWidth="10"
            />
          ))}
          <circle
            cx="210"
            cy="240"
            r="150"
            fill="#F0706018"
            stroke="#F07060"
            strokeWidth="2"
            strokeDasharray="8 6"
          />
          <circle
            cx="210"
            cy="240"
            r="90"
            fill="#F0706022"
            stroke="#F07060"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
        </svg>

        <div
          className="absolute"
          style={{
            left: "52.5%",
            top: "48%",
            transform: "translate(-50%,-50%)",
          }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white shadow-lg">
            <Icon name="person" className="h-5 w-5" />
            <span className="animate-pulse-ring absolute h-full w-full rounded-full bg-coral/40" />
          </div>
        </div>

        {[
          { l: "30%", t: "35%" },
          { l: "70%", t: "60%" },
          { l: "40%", t: "68%" },
        ].map((p, i) => (
          <div
            key={i}
            className="animate-scan absolute h-3 w-3 rounded-full bg-mint ring-4 ring-mint/25"
            style={{ left: p.l, top: p.t, animationDelay: `${i * 0.4}s` }}
          />
        ))}

        <div className="absolute bottom-3 left-3 space-y-1.5 rounded-2xl bg-white/90 px-3 py-2.5 text-[11px] backdrop-blur">
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" /> 최종 확인 위치
          </p>
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" /> 익명 제보
          </p>
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-coral" />{" "}
            예상 이동 반경
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            relayOn ? "bg-mint-light text-mint-dark" : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon name="broadcast" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-navy">
            내 기기 안심 스캔 {relayOn ? "참여 중" : "대기"}
          </p>
          <p className="text-xs text-gray-500">
            {relayOn
              ? "실종자 찾기에 함께하고 있어요"
              : "리워드 탭에서 켤 수 있어요"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   3) 안심 리워드 (P2P 릴레이 지갑)
   ============================================================ */

function RewardScreen({
  points,
  rewards,
  relayOn,
  setRelayOn,
  onScan,
  onRedeem,
}: {
  points: number;
  rewards: Reward[];
  relayOn: boolean;
  setRelayOn: (v: boolean) => void;
  onScan: () => void;
  onRedeem: (item: ShopItem) => void;
}) {
  const [purchased, setPurchased] = useState<ShopItem | null>(null);

  function buy(item: ShopItem) {
    if (points < item.cost) return;
    onRedeem(item);
    setPurchased(item);
    setTimeout(() => setPurchased(null), 2200);
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
                relayOn ? "bg-mint-light text-mint-dark" : "bg-gray-100 text-gray-400"
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
          <button
            onClick={() => setRelayOn(!relayOn)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              relayOn ? "bg-mint" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                relayOn ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {relayOn && (
          <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-xl bg-mint-light px-3 py-2.5 text-mint-dark">
            <Icon name="search" className="animate-scan h-4 w-4 shrink-0" />
            <p className="text-xs font-semibold">
              주변을 안심 스캔하고 있어요
            </p>
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

      {/* 기프티콘 상점 */}
      <div>
        <SectionTitle title="리워드 상점" sub="포인트로 교환" />
        <div className="grid grid-cols-2 gap-3">
          {SHOP_ITEMS.map((item) => {
            const affordable = points >= item.cost;
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
            );
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
  );
}

/* ============================================================
   앱 셸 + 네비게이션
   ============================================================ */

const TABS: {
  key: TabKey;
  label: string;
  icon: "home" | "signal" | "map" | "wallet";
}[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "geo", label: "지오펜스", icon: "signal" },
  { key: "map", label: "탐색지도", icon: "map" },
  { key: "reward", label: "리워드", icon: "wallet" },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");
  const [radius, setRadius] = useState(30);
  const [points, setPoints] = useState(3500);
  const [relayOn, setRelayOn] = useState(true);
  const [activeAlert, setActiveAlert] = useState<{
    core: Core;
    distance: number;
  } | null>(null);

  const [cores, setCores] = useState<Core[]>([
    {
      id: "c1",
      name: "착코어 A",
      battery: 82,
      connected: true,
      monitoring: true,
      rssi: -58,
    },
    {
      id: "c2",
      name: "착코어 B",
      battery: 34,
      connected: true,
      monitoring: false,
      rssi: -71,
    },
  ]);

  const [rewards, setRewards] = useState<Reward[]>([
    {
      id: "r1",
      ts: "오늘 14:20",
      label: "실종자 찾기 제보",
      area: "성수동 2가",
      points: 500,
    },
    {
      id: "r2",
      ts: "어제 19:05",
      label: "실종자 찾기 제보",
      area: "왕십리역 인근",
      points: 500,
    },
    {
      id: "r3",
      ts: "8/23 11:40",
      label: "실종자 찾기 제보",
      area: "서울숲 공원",
      points: 500,
    },
  ]);

  function triggerAlert(core: Core, distance: number) {
    setActiveAlert({ core, distance });
  }

  function handleScan() {
    setPoints((p) => p + 500);
    setRewards((prev) => [
      {
        id: `r${Date.now()}`,
        ts: "방금",
        label: "실종자 찾기 제보",
        area: "현재 위치 인근",
        points: 500,
      },
      ...prev,
    ]);
  }

  function handleRedeem(item: ShopItem) {
    setPoints((p) => Math.max(0, p - item.cost));
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 p-0 sm:p-6">
      {/* 모바일 프레임 */}
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-gray-50 shadow-2xl sm:h-[900px] sm:rounded-[2.5rem]">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/90 px-5 py-3.5 backdrop-blur">
          <p className="text-lg font-extrabold tracking-tight text-navy">
            ChakCare
          </p>
          <Chip tone={relayOn ? "mint" : "gray"}>
            릴레이 {relayOn ? "ON" : "OFF"}
          </Chip>
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
          {tab === "geo" && (
            <GeofenceScreen
              radius={radius}
              setRadius={setRadius}
              cores={cores}
              setCores={setCores}
              onTriggerAlert={triggerAlert}
            />
          )}
          {tab === "map" && <MapScreen relayOn={relayOn} />}
          {tab === "reward" && (
            <RewardScreen
              points={points}
              rewards={rewards}
              relayOn={relayOn}
              setRelayOn={setRelayOn}
              onScan={handleScan}
              onRedeem={handleRedeem}
            />
          )}
        </main>

        {/* 하단 탭바 */}
        <nav className="grid grid-cols-4 border-t border-gray-100 bg-white/95 px-2 pb-2 pt-1.5 backdrop-blur">
          {TABS.map((t) => {
            const on = tab === t.key;
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
            );
          })}
        </nav>

        {/* 비상 경보 모달 */}
        {activeAlert && (
          <AlertModal
            core={activeAlert.core}
            distance={activeAlert.distance}
            radius={radius}
            onClose={() => setActiveAlert(null)}
          />
        )}
      </div>
    </div>
  );
}
