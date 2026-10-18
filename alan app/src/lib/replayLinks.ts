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
  // R2 Chinese: only radio rewind available on YouTube
  // R3 Japanese: playlist only, no standalone full race
  // R4 Miami: only post-race show found
  // R5 Canadian: unverified
  6:  { url: 'https://www.youtube.com/watch?v=MRHE6NKn6Hk', type: 'highlights' },
  7:  { url: 'https://www.youtube.com/watch?v=sIdwR_pZ2yQ', type: 'replay'     },
  8:  { url: 'https://www.youtube.com/watch?v=E0gWSGyIAEA', type: 'replay'     },
  9:  { url: 'https://www.youtube.com/watch?v=xrIjES0q7dA', type: 'highlights' },
  10: { url: 'https://www.youtube.com/watch?v=ocQ80MM-E4o', type: 'replay'     },
  11: { url: 'https://www.youtube.com/watch?v=mqgAvvZxD2k', type: 'replay'     },
  12: { url: 'https://www.youtube.com/watch?v=y0gv58iv10U', type: 'highlights' },
  13: { url: 'https://www.youtube.com/watch?v=xaHPCs-JQVk', type: 'replay'     },
  // R14 Madrid, R15 Azerbaijan, R16 Sepang, R17 Singapore: unverified — add once confirmed
}

export function getReplayLink(round: number): ReplayLink | null {
  return REPLAY_LINKS[round] ?? null
}
