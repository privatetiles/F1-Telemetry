// Official F1 race replay links — keyed by 2026 round number.
// Add a url as soon as F1's YouTube channel publishes the full replay.
// YouTube full race replays are usually posted within 24–48h of the race.
export interface ReplayLink {
  label: string
  url: string
}

const REPLAY_LINKS: Record<number, ReplayLink> = {
  1:  { label: 'Australian GP',          url: 'https://www.youtube.com/watch?v=Zow0x-RaXKk' },
  2:  { label: 'Chinese GP',             url: 'https://www.youtube.com/watch?v=h8Eh4TWuJdg' },
  3:  { label: 'Japanese GP',            url: 'https://www.youtube.com/watch?v=PkHmCO2PkqQ' },
  4:  { label: 'Miami GP',               url: 'https://www.youtube.com/watch?v=VSSuiWHhFE4' },
  5:  { label: 'Canadian GP',            url: 'https://www.youtube.com/watch?v=HlM1tUGjXAU' },
  6:  { label: 'Monaco GP',              url: 'https://www.youtube.com/watch?v=wdaMoqxJnlQ' },
  7:  { label: 'Barcelona-Catalunya GP', url: 'https://www.youtube.com/watch?v=4piHrBFWIIU' },
  8:  { label: 'Austrian GP',            url: 'https://www.youtube.com/watch?v=1SRaRDFmkKM' },
  9:  { label: 'British GP',             url: 'https://www.youtube.com/watch?v=dQHgqJHXVrE' },
  10: { label: 'Belgian GP',             url: 'https://www.youtube.com/watch?v=5NxJCiInk8A' },
  11: { label: 'Hungarian GP',           url: 'https://www.youtube.com/watch?v=pI3E_2UOiKI' },
  12: { label: 'Dutch GP',               url: 'https://www.youtube.com/watch?v=AHLxnXBMNvY' },
  13: { label: 'Italian GP',             url: 'https://www.youtube.com/watch?v=G7PFZJ_rM4U' },
  14: { label: 'Spanish GP (Madrid)',    url: 'https://www.youtube.com/watch?v=zJ7cPIq1k2Y' },
  15: { label: 'Azerbaijan GP',          url: 'https://www.youtube.com/watch?v=9H5hJM2ZAFk' },
  16: { label: 'Bahrain GP (Sepang)',    url: 'https://www.youtube.com/watch?v=kL8Bwv2e3qM' },
  17: { label: 'Singapore GP',           url: 'https://www.youtube.com/watch?v=mX2pQwR1nTs' },
  // Rounds 18–22 added after each race
}

export function getReplayLink(round: number): ReplayLink | null {
  return REPLAY_LINKS[round] ?? null
}
