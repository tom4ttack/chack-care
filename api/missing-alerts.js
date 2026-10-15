// 경찰청 안전Dream 실종경보 Open API를 서버에서 대신 불러, 앱에는 정리된 결과만 준다. (인증키가 브라우저에 나가지 않게)
// 환경변수(Vercel): SAFE182_ESNTL_ID, SAFE182_AUTH_KEY
const API = "https://www.safe182.go.kr/api/lcm/amberList.do"
const TARGET = { "010": "아동", "060": "지적장애인", "070": "치매환자" }
const SEX = { 1: "남", 2: "여" }

export default async function handler(req, res) {
  const { SAFE182_ESNTL_ID: esntlId, SAFE182_AUTH_KEY: authKey } = process.env
  if (!esntlId || !authKey) return res.status(503).json({ error: "no-key" })

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ esntlId, authKey, rowSize: "5", page: "1", xmlUseYN: "N" }),
    })
    const d = await r.json()
    if (d.result !== "00") return res.status(502).json({ error: d.result, msg: d.msg })

    // 하루 호출 한도(1,000건)를 아끼려고 5분 캐시
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
    res.json({
      source: "경찰청",
      items: (d.list ?? []).map((x) => ({
        age: x.age,
        sex: SEX[x.sexdstnDscd] ?? x.sexdstnDscd,
        target: TARGET[x.writngTrgetDscd] ?? x.writngTrgetDscd,
        place: x.occrAdres,
        dress: x.alldressingDscd,
        date: String(x.occrde ?? "").replace(/^(d{4})(d{2})(d{2})/, "$1.$2.$3"),
      })),
    })
  } catch {
    res.status(502).json({ error: "fetch-failed" })
  }
}
