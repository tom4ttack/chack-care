import { Icon } from "../components/Icon"
import { Toggle } from "../components/ui"

const MENU_ITEMS = [
  ["프로필", "보호 대상 · 착코어 정보", "person"],
  ["마이페이지", "구독 · 리워드 · 주문 내역", "home2"],
  ["간단한 설정", "알림 · 안전반경 · 개인정보", "settings"],
  ["자사몰", "착코어 · 액세서리 구매", "store"],
]

export function Drawer({
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

export function MenuPage({ page, onClose }: { page: string; onClose: () => void }) {
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
