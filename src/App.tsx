import { useEffect, useState } from "react"
import { supabase, type EventRow } from "./lib/supabase"
import { useBeaconStatus } from "./lib/useBeaconStatus"
import { recordAction, useAlertActions } from "./lib/useAlertActions"
import type { Core, Reward, TabKey } from "./types"
import { PROTECTED, reward } from "./data"
import { Icon } from "./components/Icon"
import { AlertSheet, AlertModal } from "./components/AlertModal"
import { buildPeople } from "./components/PeopleCarousel"
import { isReturned, NotificationPanel } from "./components/NotificationPanel"
import { HomeScreen } from "./screens/HomeScreen"
import { LiveMapScreen } from "./screens/LiveMapScreen"
import { ReportScreen } from "./screens/ReportScreen"
import { RewardScreen } from "./screens/RewardScreen"
import { Drawer, MenuPage } from "./screens/MenuPages"

const TABS = [
  { key: "home" as TabKey, label: "홈", icon: "home" },
  { key: "live" as TabKey, label: "라이브 지도", icon: "map" },
  { key: "report" as TabKey, label: "리포트", icon: "chart" },
  { key: "reward" as TabKey, label: "리워드", icon: "wallet" },
]

export default function App() {
  const [tab, setTab] = useState<TabKey>("home")
  const [radius, setRadius] = useState(30)
  const [points, setPoints] = useState(3500)
  const [relayOn, setRelayOn] = useState(true)
  const beacons = useBeaconStatus()
  const actions = useAlertActions()
  const [events, setEvents] = useState<EventRow[]>([])
  const [activeAlert, setActiveAlert] = useState<EventRow | null>(null)
  const [patternAlert, setPatternAlert] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuPage, setMenuPage] = useState<null | string>(null)

  const [cores, setCores] = useState<Core[]>([
    { id: "c1", name: "착코어 A", connected: true, monitoring: true, subject: PROTECTED.name },
    { id: "c2", name: "착코어 B", connected: true, monitoring: true, subject: "김민수" },
  ])

  const people = buildPeople(cores, events)

  const [rewards, setRewards] = useState<Reward[]>([
    reward("r1", "오늘 14:20", "성수동 2가"),
    reward("r2", "어제 19:05", "왕십리역 인근"),
    reward("r3", "8/23 11:40", "서울숲 공원"),
  ])

  function handleScan() {
    setPoints((p) => p + 500)
    setRewards((prev) => [reward(`r${Date.now()}`, "방금", "현재 위치 인근"), ...prev])
  }

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .order("ts", { ascending: false })
      .limit(20)
      .then(({ data }) => data && setEvents(data))

    const channel = supabase
      .channel("events-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        ({ new: row }) => {
          const e = row as EventRow
          setEvents((prev) => [e, ...prev].slice(0, 20))
          if (e.status === "exit") setActiveAlert(e)
          if (e.status === "present")
            setActiveAlert((a) => (a?.subject === e.subject ? null : a))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const goLive = () => {
    setActiveAlert(null)
    setPatternAlert(false)
    setTab("live")
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 p-0 sm:p-6">
      <div className="relative flex h-full w-full max-w-110 flex-col overflow-hidden bg-gray-50 shadow-2xl sm:h-225 sm:rounded-[2.5rem]">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3.5 backdrop-blur">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-navy transition active:scale-90 active:bg-gray-100"
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <p className="text-lg font-extrabold tracking-tight text-navy">
            ChakCare
          </p>
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-navy transition active:scale-90 active:bg-gray-100"
          >
            <Icon name="bell" className="h-6 w-6" />
            {events.some((e) => e.status === "exit" && !actions[e.id] && !isReturned(e, events)) && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral ring-2 ring-white" />
            )}
          </button>
        </header>

        {/* 스크롤 콘텐츠 */}
        <main className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "home" && (
            <HomeScreen
              people={people}
              beacons={beacons}
              cores={cores}
              radius={radius}
              points={points}
              relayOn={relayOn}
              onGo={setTab}
            />
          )}
          {tab === "live" && (
            <LiveMapScreen
              people={people}
              beacons={beacons}
              radius={radius}
              setRadius={setRadius}
              cores={cores}
              setCores={setCores}
              relayOn={relayOn}
              setRelayOn={setRelayOn}
            />
          )}
          {tab === "report" && (
            <ReportScreen onPreviewAlert={() => setPatternAlert(true)} />
          )}
          {tab === "reward" && (
            <RewardScreen
              points={points}
              rewards={rewards}
              relayOn={relayOn}
              setRelayOn={setRelayOn}
              onScan={handleScan}
              onRedeem={(item) => setPoints((p) => Math.max(0, p - item.cost))}
            />
          )}
        </main>

        {/* 하단 탭바 */}
        <nav className="grid grid-cols-4 border-t border-gray-100 bg-white/95 px-1.5 pb-2 pt-1.5 backdrop-blur">
          {TABS.map((t) => {
            const on = tab === t.key
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
            )
          })}
        </nav>

        {/* 모달 & 오버레이 */}
        {activeAlert && (
          <AlertModal
            event={activeAlert}
            radius={radius}
            onClose={() => {
              recordAction(activeAlert.id, "false_alarm")
              setActiveAlert(null)
            }}
            onViewLocation={() => {
              recordAction(activeAlert.id, "acknowledged")
              goLive()
            }}
          />
        )}

        {patternAlert && (
          <AlertSheet
            icon="route"
            title="평소 경로 이탈 감지"
            sub={PROTECTED.name}
            vibrate={[300, 150, 300]}
            confirm="위치 확인"
            onClose={() => setPatternAlert(false)}
            onConfirm={goLive}
          >
            <p className="text-center text-xl font-extrabold text-navy">
              평소 이동 경로를
              <br />
              <span className="text-coral-dark">80% 이상</span> 벗어났습니다
            </p>
            <p className="rounded-2xl bg-coral-light px-4 py-3 text-center text-[13px] leading-relaxed text-coral-dark">
              평소 가지 않던 방향으로 이동하고 있어요. 위치를 확인해 주세요.
            </p>
          </AlertSheet>
        )}

        {drawerOpen && (
          <Drawer
            onClose={() => setDrawerOpen(false)}
            onOpenPage={(p) => {
              setMenuPage(p)
              setDrawerOpen(false)
            }}
          />
        )}

        {menuPage && (
          <MenuPage page={menuPage} onClose={() => setMenuPage(null)} />
        )}

        {notifOpen && (
          <NotificationPanel
            events={events}
            actions={actions}
            onAction={recordAction}
            onClose={() => setNotifOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
