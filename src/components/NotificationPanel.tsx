import type { EventRow } from "../lib/supabase"
import type { ActionKind } from "../lib/useAlertActions"
import { Icon } from "./Icon"

const fmtTs = (ts: string) =>
  new Date(ts).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const EVENT_UI = {
  exit: { icon: "alert", title: "안전반경 이탈", body: "이 안전반경을 벗어났어요", tone: "bg-coral-light text-coral-dark" },
  present: { icon: "check", title: "안전반경 복귀", body: "이 안전반경 안으로 돌아왔어요", tone: "bg-mint-light text-mint-dark" },
  low_battery: { icon: "bell", title: "배터리 교체 필요", body: "의 착코어 배터리가 얼마 남지 않았어요", tone: "bg-coral-light text-coral-dark" },
}

const ACTION_LABEL: Record<ActionKind, string> = {
  acknowledged: "확인함",
  resolved: "처리 완료",
  false_alarm: "이상 없음",
}

export const isReturned = (e: EventRow, events: EventRow[]) =>
  events.some((x) => x.subject === e.subject && x.status === "present" && x.id > e.id)

export const isOpen = (e: EventRow, events: EventRow[], actions: Record<number, ActionKind>) =>
  e.status === "exit" &&
  !isReturned(e, events) &&
  actions[e.id] !== "resolved" &&
  actions[e.id] !== "false_alarm"

function ExitActions({
  e,
  done,
  returned,
  onAction,
}: {
  e: EventRow
  done?: ActionKind
  returned: boolean
  onAction: (eventId: number, action: ActionKind) => void
}) {
  const closed = done === "resolved" || done === "false_alarm"
  const chip = done ? ACTION_LABEL[done] : returned ? "자동 복귀" : "미확인"
  const chipTone = done || returned ? "bg-gray-100 text-gray-600" : "bg-coral-light text-coral-dark"
  const next: ActionKind = done === "acknowledged" ? "resolved" : "acknowledged"
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chipTone}`}>{chip}</span>
      {!closed &&
        [next, "false_alarm" as const].map((a) => (
          <button
            key={a}
            onClick={() => onAction(e.id, a)}
            className="rounded-full bg-mint-light px-2.5 py-0.5 text-[11px] font-bold text-mint-dark transition active:scale-95"
          >
            {ACTION_LABEL[a]}
          </button>
        ))}
    </div>
  )
}

export function NotificationPanel({
  events,
  actions,
  onAction,
  onClear,
  onClose,
}: {
  events: EventRow[]
  actions: Record<number, ActionKind>
  onAction: (eventId: number, action: ActionKind) => void
  onClear?: () => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      <div
        className="animate-fade-in absolute inset-0 bg-navy/30"
        onClick={onClose}
      />
      <div className="animate-slide-up relative flex h-full w-[86%] max-w-85 flex-col bg-gray-50 shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/90 px-5 py-3.5 backdrop-blur">
          <p className="text-base font-extrabold text-navy">알림</p>
          <div className="flex items-center gap-1">
            {onClear && (
              <button
                onClick={onClear}
                className="rounded-xl px-3 py-1.5 text-sm font-bold text-gray-500 transition active:scale-95 active:bg-gray-100"
              >
                지우기
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition active:scale-90 active:bg-gray-100"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {events.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              아직 알림이 없어요
            </p>
          )}
          {events.map((e) => {
            const k = EVENT_UI[e.status]
            return (
              <div
                key={e.id}
                className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${k.tone}`}
                >
                  <Icon name={k.icon} className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-navy">{k.title}</p>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {fmtTs(e.ts)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                    {e.subject} 님{k.body}
                    {e.receiver ? ` · ${e.receiver}` : ""}
                  </p>
                  {e.status === "exit" && (
                    <ExitActions e={e} done={actions[e.id]} returned={isReturned(e, events)} onAction={onAction} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
