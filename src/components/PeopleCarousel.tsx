import { useEffect, useRef, useState } from "react"
import type { EventRow } from "../lib/supabase"
import type { Core, Person } from "../types"
import { PROTECTED } from "../data"

export function buildPeople(cores: Core[], events: EventRow[]): Person[] {
  const subjects = [...new Set(cores.map((c) => c.subject))]
  return subjects
    .map((subject) => {
      const mine = cores.filter((c) => c.subject === subject)
      const last = events.find((e) => e.subject === subject && e.status !== "low_battery")
      const monitoring = mine.some((c) => c.connected && c.monitoring)
      return {
        subject,
        relation: subject === PROTECTED.name ? PROTECTED.relation : undefined,
        core: mine[0],
        last,
        monitoring,
        breach: monitoring && last?.status === "exit",
      }
    })
    .sort((a, b) => Number(b.breach) - Number(a.breach))
}

export const toneBg = (p: Person) => (p.breach ? "bg-coral" : p.monitoring ? "bg-mint" : "bg-gray-400")

export const statusText = (p: Person) => (p.breach ? "이탈 감지" : p.monitoring ? "안심 · 반경 내" : "모니터링 꺼짐")

export const personLabel = (p: Person) => (p.relation ? `${p.subject} · ${p.relation}` : p.subject)

export function PeopleCarousel({
  people,
  children,
}: {
  people: Person[]
  children: (p: Person) => React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const first = people[0]

  useEffect(() => {
    ref.current?.scrollTo({ left: 0, behavior: "smooth" })
  }, [first?.subject, first?.breach])

  return (
    <div>
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {people.map((p) => (
          <div key={p.subject} className="w-full shrink-0 snap-center">
            {children(p)}
          </div>
        ))}
      </div>
      {people.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {people.map((p, n) => (
            <span
              key={p.subject}
              className={`h-1.5 rounded-full transition-all ${n === index ? "w-4 bg-mint" : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
