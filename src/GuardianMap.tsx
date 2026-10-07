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
        ? "수신 구역(대략)"
        : breach
          ? "마지막 확인 구역(대략)"
          : "비콘 수신 구역(대략)"
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
    <>
      <div ref={el} className="absolute inset-0 isolate" />
      <button
        onClick={saveReceiver}
        disabled={!guardian}
        className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-mint-dark shadow backdrop-blur transition active:scale-95 disabled:text-gray-400"
      >
        {saved ? "저장됨" : "여기를 수신기 위치로 지정"}
      </button>
      {(geoError || (!guardian && !receiver)) && (
        <p className="absolute inset-x-6 top-14 z-10 rounded-xl bg-white/90 px-3 py-2 text-center text-[11px] text-gray-500 backdrop-blur">
          {geoError
            ? "위치 권한을 허용하면 내 위치가 지도에 보여요"
            : "내 위치를 찾는 중..."}
        </p>
      )}
    </>
  )
}
