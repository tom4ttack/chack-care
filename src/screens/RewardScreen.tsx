import { useState } from "react"
import type { Reward, ShopItem } from "../types"
import { SHOP_ITEMS } from "../data"
import { Icon } from "../components/Icon"
import { SectionTitle, Toggle } from "../components/ui"

export function RewardScreen({
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
