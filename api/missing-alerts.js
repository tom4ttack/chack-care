// 경찰청 안전Dream 실종경보 Open API를 서버에서 대신 불러, 앱에는 정리된 결과만 준다. (인증키가 브라우저에 나가지 않게)
// 환경변수(Vercel): SAFE182_ESNTL_ID, SAFE182_AUTH_KEY
const API = "https://www.safe182.go.kr/api/lcm/amberList.do"
const TARGET = { "010": "아동", "070": "치매환자" } // 060·061·062는 장애인
const day = (d) => d.toISOString().slice(0, 10)

export default async function handler(req, res) {
  const { SAFE182_ESNTL_ID: esntlId, SAFE182_AUTH_KEY: authKey } = process.env
  if (!esntlId || !authKey) return res.status(503).json({ error: "no-key" })

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        esntlId,
        authKey,
        rowSize: "20",
        page: "1",
        xmlUseYN: "N",
        detailDate1: day(new Date(Date.now() - 30 * 864e5)),
        detailDate2: day(new Date()),
      }),
    })
    const d = await r.json()
    if (d.result !== "00") return res.status(502).json({ error: d.result, msg: d.msg })

    // 하루 호출 한도(1,000건)를 아끼려고 5분 캐시
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
    res.json({
      source: "경찰청",
      // API 정렬이 날짜순이 아니라서 최신순으로 다시 정렬
      items: (d.list ?? [])
        .sort((a, b) => b.occrde.localeCompare(a.occrde))
        .slice(0, 5)
        .map((x) => ({
          age: x.age,
          sex: x.sexdstnDscd,
          target: TARGET[x.writngTrgetDscd] ?? "장애인",
          place: x.occrAdres.trim(),
          dress: x.alldressingDscd ?? "",
          date: x.occrde.replace(/^(\d{4})(\d{2})(\d{2})/, "$1.$2.$3"),
        })),
    })
  } catch {
    res.status(502).json({ error: "fetch-failed" })
  }
}
