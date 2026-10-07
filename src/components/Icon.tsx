const ICONS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  signal: '<path d="M12 20h.01"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5.5 13a10 10 0 0 1 13 0"/><path d="M2.5 9.5a15 15 0 0 1 19 0"/>',
  map: '<path d="M9 3 3 5.5v15.5l6-2.5 6 2.5 6-2.5V3l-6 2.5L9 3Z"/><path d="M9 3v15.5"/><path d="M15 5.5V21"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path d="M16 14.5h.01"/>',
  person: '<circle cx="12" cy="8" r="3.2"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  link: '<path d="M9.5 14.5l5-5"/><path d="M11.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1"/><path d="M12.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1"/>',
  alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
  megaphone: '<path d="M4 10v4h4l7 4V6l-7 4H4Z"/><path d="M18 9a3 3 0 0 1 0 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  broadcast: '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.6 5.6 0 0 0 0 8"/><path d="M16 8a5.6 5.6 0 0 1 0 8"/><path d="M5 5a10 10 0 0 0 0 14"/><path d="M19 5a10 10 0 0 1 0 14"/>',
  gift: '<path d="M4 11.5h16V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5Z"/><path d="M3 8h18v3.5H3V8Z"/><path d="M12 8v13"/><path d="M12 8S10.5 3.5 8 4.5 9.5 8 12 8Zm0 0s1.5-4.5 4-3.5S14.5 8 12 8Z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  walk: '<circle cx="13" cy="4.5" r="1.6"/><path d="M11 21l1.5-5-2.5-2.5 1-5 3 2 2 2"/><path d="M11 13l-2 3-2 3"/>',
  pause: '<path d="M9 6v12"/><path d="M15 6v12"/>',
  chart: '<path d="M3 21h18"/><path d="M6.5 21v-6"/><path d="M12 21V8"/><path d="M17.5 21v-9"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16"/>',
  home2: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  store: '<path d="M4 9h16l-1-4H5L4 9Z"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 20v-5h4v5"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
}

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}
