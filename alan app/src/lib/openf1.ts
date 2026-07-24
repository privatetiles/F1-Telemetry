export interface RadioCall {
  driver: string   // 3-letter abbreviation e.g. 'NOR'
  time: number     // race-relative seconds from lights out
  url: string      // F1 CDN recording URL
}

const BASE = 'https://api.openf1.org/v1'

export async function fetchRaceRadio(year: number, raceDate: string): Promise<RadioCall[]> {
  try {
    const sessRes = await fetch(`${BASE}/sessions?year=${year}&session_name=Race`)
    if (!sessRes.ok) return []
    const sessions: any[] = await sessRes.json()

    const targetMs = new Date(raceDate).getTime()
    const session = sessions.find((s: any) => {
      const d = new Date(s.date_start).getTime()
      return Math.abs(d - targetMs) < 3 * 86_400_000   // within 3 days
    })
    if (!session) return []
    const sessionKey: number = session.session_key

    const [lapRes, drvRes, radioRes] = await Promise.all([
      fetch(`${BASE}/laps?session_key=${sessionKey}&lap_number=1`),
      fetch(`${BASE}/drivers?session_key=${sessionKey}`),
      fetch(`${BASE}/team_radio?session_key=${sessionKey}`),
    ])
    if (!lapRes.ok || !drvRes.ok || !radioRes.ok) return []

    const [laps, drivers, rawRadio]: [any[], any[], any[]] = await Promise.all([
      lapRes.json(), drvRes.json(), radioRes.json(),
    ])

    // Lights-out = earliest lap 1 start across all drivers
    let lightsOutMs = Infinity
    for (const lap of laps) {
      if (lap.date_start) {
        const t = new Date(lap.date_start).getTime()
        if (t < lightsOutMs) lightsOutMs = t
      }
    }
    if (!isFinite(lightsOutMs)) return []

    const numToAbbr: Record<number, string> = {}
    for (const d of drivers) {
      if (d.driver_number && d.name_acronym) numToAbbr[d.driver_number] = d.name_acronym
    }

    const calls: RadioCall[] = []
    for (const r of rawRadio) {
      if (!r.recording_url || !r.date) continue
      const abbr = numToAbbr[r.driver_number]
      if (!abbr) continue
      const time = (new Date(r.date).getTime() - lightsOutMs) / 1000
      if (time < -60 || time > 14_400) continue
      calls.push({ driver: abbr, time, url: r.recording_url })
    }

    return calls.sort((a, b) => a.time - b.time)
  } catch {
    return []
  }
}
