import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { supabase } from "./lib/supabase"

type Pos = { lat: number; lng: number }

const FALLBACK_CENTER: [number, number] = [37.5665, 126.978]

export default function GuardianMap({
  receiverName,
  radius,
  breach,
  monitoringOn,
}: {
  receiverName: string
  radius: number
  breach: boolean
  monitoringOn: boolean
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const me = useRef<L.CircleMarker | null>(null)
  const zone = useRef<L.Circle | null>(null)
  const dot = useRef<L.CircleMarker | null>(null)
  const fitted = useRef(false)

  const [guardian, setGuardian] = useState<Pos | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [receiver, setReceiver] = useState<Pos | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const m = L.map(el.current!, { zoomControl: false, attributionControl: true }).setView(
      FALLBACK_CENTER,
      15,
    )
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
      me.current = zone.current = dot.current = null
      fitted.current = false
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return setGeoError(true)
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGeoError(false)
        setGuardian({ lat: p.coords.latitude, lng: p.coords.longitude })
      },
      () => setGeoError(true),
      { enableHighAccuracy: true },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  useEffect(() => {
    supabase
      .from("receivers")
      .select("*")
      .then(({ data }) => {
        const r = data?.find((x) => x.name === receiverName) ?? data?.[0]
        if (r) setReceiver({ lat: r.lat, lng: r.lng })
      })
  }, [receiverName])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (guardian) {
      if (!me.current) {
        me.current = L.circleMarker([guardian.lat, guardian.lng], {
          radius: 8,
          color: "#fff",
          weight: 3,
          fillColor: "#2563EB",
          fillOpacity: 1,
        })
          .bindTooltip("내 위치", { direction: "top" })
          .addTo(m)
      } else me.current.setLatLng([guardian.lat, guardian.lng])
    }
    if (receiver) {
      const color = breach ? "#9AA5A4" : "#2A9D8F"
      const label = !monitoringOn
        ? "수신 구역"
        : breach
          ? "마지막 확인 구역"
          : "비콘 수신 구역"
      if (!zone.current) {
        zone.current = L.circle([receiver.lat, receiver.lng], { radius })
          .bindTooltip(label, { direction: "top", sticky: true })
          .addTo(m)
        dot.current = L.circleMarker([receiver.lat, receiver.lng], {
          radius: 5,
          color: "#fff",
          weight: 2,
          fillOpacity: 1,
        }).addTo(m)
      }
      zone.current.setLatLng([receiver.lat, receiver.lng]).setRadius(radius)
      zone.current.setStyle({ color, fillColor: color, fillOpacity: 0.15, weight: 2, dashArray: breach ? "6 6" : undefined })
      zone.current.setTooltipContent(label)
      dot.current!.setLatLng([receiver.lat, receiver.lng]).setStyle({ fillColor: color })
    }
    if (!fitted.current && (guardian || receiver)) {
      const pts = [guardian, receiver].filter(Boolean) as Pos[]
      if (pts.length === 2) m.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng])).pad(0.5), { maxZoom: 18 })
      else m.setView([pts[0].lat, pts[0].lng], 17)
      fitted.current = true
    }
  }, [guardian, receiver, radius, breach, monitoringOn])

  async function saveReceiver() {
    if (!guardian) return
    const { error } = await supabase
      .from("receivers")
      .upsert({ name: receiverName, lat: guardian.lat, lng: guardian.lng, updated_at: new Date().toISOString() })
    if (error) return
    setReceiver(guardian)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    map.current?.setView([guardian.lat, guardian.lng], 18)
  }

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-square overflow-hidden rounded-3xl ring-1 ring-gray-200">
        <div ref={el} className="absolute inset-0 isolate" />
        <button
          onClick={saveReceiver}
          disabled={!guardian}
          aria-label="현재 위치를 수신기 위치로 지정"
          title="현재 위치를 수신기 위치로 지정"
          className={`absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow backdrop-blur transition active:scale-90 disabled:opacity-40 ${
            saved ? "bg-mint text-white" : "bg-white/90 text-mint-dark"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {saved ? (
              <path d="M5 12.5l4.5 4.5L19 7" />
            ) : (
              <>
                <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </>
            )}
          </svg>
        </button>
      </div>
      {geoError && (
        <p className="px-1 text-[11px] text-gray-400">
          위치 권한을 허용하면 내 위치가 지도에 보여요
        </p>
      )}
    </div>
  )
}
