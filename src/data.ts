import type { Reward, ShopItem } from "./types"

export const PROTECTED = { name: "김서준", relation: "아들 · 만 8세" }

export const reward = (id: string, ts: string, area: string): Reward => ({
  id,
  ts,
  area,
  label: "실종자 찾기 제보",
  points: 500,
})

export const SHOP_ITEMS: ShopItem[] = [
  { id: "s1", brand: "카페", name: "아메리카노 Tall", cost: 4500 },
  { id: "s2", brand: "편의점", name: "5,000원 금액권", cost: 5000 },
  { id: "s3", brand: "베이커리", name: "조각케이크 교환권", cost: 6500 },
  { id: "s4", brand: "치킨", name: "후라이드 한 마리", cost: 20000 },
]
