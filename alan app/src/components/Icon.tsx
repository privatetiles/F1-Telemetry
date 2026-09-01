import type { SVGProps } from 'react'

export type IconName =
  | 'track' | 'standings' | 'calendar' | 'results' | 'drivers' | 'teams'
  | 'circuits' | 'pace' | 'predict' | 'insights' | 'games' | 'classics'
  | 'socials' | 'updates' | 'help' | 'settings' | 'radio' | 'camera'
  | 'battery' | 'lock' | 'coffee' | 'plus' | 'minus' | 'reset'
  | 'arrow-left' | 'arrow-right' | 'chevron-down'

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

const paths: Record<IconName, React.ReactNode> = {
  track: <><path d="M4 19c2.8-5.8 4.3-11.7 8.2-13.3 3.3-1.3 6.3 1.1 7.8 4.1"/><path d="M4 19h5.2c3.7 0 4.9-2.1 4.9-4.2s1.3-3.7 5.9-5"/><path d="M6.2 15.2h4.1"/></>,
  standings: <><path d="M8 21h8M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  results: <><path d="M7 3h10v18H7z"/><path d="M9 7h6M9 11h6M9 15h4M5 6H3v13h10"/></>,
  drivers: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  teams: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13 20a4 4 0 0 1 8 0"/></>,
  circuits: <><path d="M4 7.5 9 4l6 3 5-3v13l-5 3-6-3-5 3Z"/><path d="M9 4v13M15 7v13"/></>,
  pace: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  predict: <><path d="M4 18 9 13l4 3 7-9"/><path d="M15 7h5v5"/></>,
  insights: <><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  games: <><path d="M8 8h8a5 5 0 0 1 4.7 6.7l-1 2.7a2 2 0 0 1-3.3.8L14 16h-4l-2.4 2.2a2 2 0 0 1-3.3-.8l-1-2.7A5 5 0 0 1 8 8Z"/><path d="M8 11v4M6 13h4M16.5 12.5h.01M18.5 14.5h.01"/></>,
  classics: <><path d="M13 2 5 14h7l-1 8 8-12h-7z"/></>,
  socials: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A7 7 0 0 1 3 13V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></>,
  updates: <><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2M17 3h4v4"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.2 2.1c-.8.4-1 1-1 1.9M12 17h.01"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  radio: <><path d="m8 5 9-3M5 8h14a2 2 0 0 1 2 2v9H3v-9a2 2 0 0 1 2-2Z"/><circle cx="8" cy="14" r="3"/><path d="M14 12h4M14 15h4"/></>,
  camera: <><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"/><circle cx="12" cy="13" r="3"/></>,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M8 10l-2 3h3l-2 3"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  coffee: <><path d="M5 8h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 4v1M12 3v2M16 4v1"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  reset: <><path d="M4 7v5h5"/><path d="M5.7 16.5A8 8 0 1 0 6 6.3L4 8"/></>,
  'arrow-left': <><path d="m15 18-6-6 6-6"/></>,
  'arrow-right': <><path d="m9 18 6-6-6-6"/></>,
  'chevron-down': <><path d="m6 9 6 6 6-6"/></>,
}

export default function Icon({ name, size = 18, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
