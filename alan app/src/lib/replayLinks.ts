// Race video links — keyed by 2026 round number.
// 'replay' = full race video. 'highlights' = official race highlights.
// Full replays are paywalled on F1 TV Pro; YouTube only has highlights for most rounds.
// Only add verified links — unverified video IDs are left out to avoid dead links.
export interface ReplayLink {
  url: string
  type: 'replay' | 'highlights'
}

const REPLAY_LINKS: Record<number, ReplayLink> = {
  1:  { url: 'https://www.youtube.com/watch?v=lL_d84cN1UY', type: 'highlights' },
  2:  { url: 'https://www.youtube.com/watch?v=Fjpn0s-KtKI', type: 'highlights' },
  3:  { url: 'https://www.youtube.com/watch?v=oAtYfF0_4-I', type: 'highlights' },
  4:  { url: 'https://www.youtube.com/watch?v=5gYys4GL7S0', type: 'highlights' },
  5:  { url: 'https://www.youtube.com/watch?v=QrRh2vOJQbw', type: 'highlights' },
  6:  { url: 'https://www.youtube.com/watch?v=MRHE6NKn6Hk', type: 'highlights' },
  7:  { url: 'https://www.youtube.com/watch?v=sIdwR_pZ2yQ', type: 'replay'     },
  8:  { url: 'https://www.youtube.com/watch?v=E0gWSGyIAEA', type: 'replay'     },
  9:  { url: 'https://www.youtube.com/watch?v=xrIjES0q7dA', type: 'highlights' },
  10: { url: 'https://www.youtube.com/watch?v=ocQ80MM-E4o', type: 'replay'     },
  11: { url: 'https://www.youtube.com/watch?v=mqgAvvZxD2k', type: 'replay'     },
  12: { url: 'https://www.youtube.com/watch?v=y0gv58iv10U', type: 'highlights' },
  13: { url: 'https://www.youtube.com/watch?v=xaHPCs-JQVk', type: 'replay'     },
  14: { url: 'https://www.youtube.com/watch?v=NK7AfP_wi8M', type: 'highlights' },
  15: { url: 'https://www.youtube.com/watch?v=I9oahfzac0I', type: 'highlights' },
  16: { url: 'https://www.youtube.com/watch?v=U-V7IfBwN1I', type: 'highlights' },
  17: { url: 'https://www.youtube.com/watch?v=E0O09MzrITM', type: 'highlights' },
  // Rounds 18–22 added after each race
}

export function getReplayLink(round: number): ReplayLink | null {
  return REPLAY_LINKS[round] ?? null
}
