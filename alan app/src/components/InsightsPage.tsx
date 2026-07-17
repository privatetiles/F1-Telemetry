const INSIGHTS = [
  {
    round: 'R9',
    race: 'British GP — Silverstone Circuit',
    date: 'July 5, 2026',
    tag: 'Sprint Weekend',
    body: [
      `Silverstone delivered one of the most aerodynamically demanding weekends of the 2026 season. The circuit's unique combination of ultra-high-speed sweepers — Copse, the Maggotts-Becketts-Chapel complex, and the rebuilt Arena section — compresses the top teams into a narrow setup window where downforce level, rake angle, and front wing balance must all align simultaneously. The qualifying speed trace shows the top five covered by just 0.21 seconds, the closest margin at Silverstone in three seasons.`,
      `The sprint race telemetry provided some of the clearest evidence yet of the 2026 active aerodynamics hierarchy. Through the Maggotts-Becketts chicane — where drivers sustain lateral G-forces exceeding 4.5G for over three seconds — the cars with more refined active aero management showed a measurably flatter speed profile through the sequence, losing less time to the brief directional loads compared to those whose systems were slower to react. The minimum speed differential through Chapel alone tracked closely to the final sprint classification order.`,
      `In the main race, tyre behaviour on the resurfaced Arena complex played a larger role than expected. The new asphalt through Turns 13–16 has significantly higher abrasion characteristics than the original surface, and rear tyre degradation in this section was the primary driver behind several late-race pit decisions. The throttle trace data from the final ten laps shows the leading drivers managing wheelspin through the Arena exit kerbs far more conservatively than in the opening stint — a clear sign of rear rubber reaching its thermal limit under the warm Northamptonshire conditions.`,
    ],
  },
  {
    round: 'R8',
    race: 'Austrian GP — Red Bull Ring',
    date: 'June 28, 2026',
    tag: 'Pace Analysis',
    body: [
      `The Austrian Grand Prix at the Red Bull Ring produced one of the most telemetry-rich races of the 2026 season. The short, high-downforce circuit exposed a clear split between teams that prioritised mechanical grip through the sweeping middle sector and those who sacrificed it for straight-line speed through the DRS zones on the start-finish straight and the run to Turn 3.`,
      `Our sector-by-sector breakdown shows that the McLaren of Norris was consistently quickest through the technical first two sectors, posting mini-sector bests through the tight chicane complex where the car's balance under trail-braking was exceptional. However, the Ferrari of Leclerc clawed back significant time on the long acceleration zones, suggesting Ferrari's updated power unit deployment maps were giving them a meaningful straight-line advantage into the final sector.`,
      `The race pace delta chart reveals how tyre management played a decisive role in the closing stages. Drivers who ran the medium compound into the final stint showed a sharper degradation curve after lap 40, with throttle traces indicating increasing wheelspin through the exit of Turn 4 as the rubber went past its thermal window.`,
    ],
  },
  {
    round: 'R7',
    race: 'Barcelona-Catalunya GP — Circuit de Barcelona-Catalunya',
    date: 'June 14, 2026',
    tag: 'Tyre Strategy',
    body: [
      `Barcelona remains the definitive engineering test on the F1 calendar, and the 2026 edition was no different. The telemetry from qualifying highlighted exactly why the Circuit de Barcelona-Catalunya is so demanding: every corner from Turn 3 through the Sector 2 complex requires a completely different setup compromise, making it nearly impossible to find a truly balanced car.`,
      `Looking at the speed trace through the legendary Turn 9 right-hander — one of the most demanding in the sport — the spread between teams was remarkable. The Red Bull showed a 12 km/h higher minimum speed through the apex compared to the Williams, a gap that translates directly to lap time given the long acceleration that follows all the way to the final chicane.`,
      `In the race, the hard tyre proved far more durable than pre-race predictions suggested. Several teams who planned a two-stop strategy were able to extend their opening stint well beyond the theoretical window, with throttle and brake data showing drivers managing energy recovery systems intelligently to keep tyre temperatures within range.`,
    ],
  },
  {
    round: 'R6',
    race: 'Monaco GP — Circuit de Monaco',
    date: 'June 7, 2026',
    tag: 'Street Circuit',
    body: [
      `Monaco is unlike anywhere else on the Formula 1 calendar, and the telemetry data from the 2026 Grand Prix reflects that perfectly. With an average speed below 160 km/h and full-throttle time of under 45% — the lowest of any circuit — the data tells the story of a race decided almost entirely by qualifying position and pit stop timing rather than raw pace.`,
      `The brake trace through the Mirabeau hairpin and the infamous Rascasse corner shows drivers scrubbing off over 180 km/h in under two seconds, with peak deceleration forces exceeding 5G. What separates the top drivers from the midfield here is not straight-line speed but the ability to carry momentum through the tight exit kerbs without inducing understeer that costs time on the micro-straights.`,
      `Interestingly, the ERS deployment data from Monaco shows a very different pattern to a conventional circuit. Teams were deploying their stored energy almost exclusively as a buffer out of slow corners rather than for top-end speed, giving drivers instant torque out of hairpins where the battery recharge from heavy braking is near-constant.`,
    ],
  },
  {
    round: 'R5',
    race: 'Canadian GP — Circuit Gilles Villeneuve',
    date: 'May 24, 2026',
    tag: 'Power Unit',
    body: [
      `The Circuit Gilles Villeneuve in Montreal is a true power unit circuit, and the 2026 Canadian Grand Prix telemetry underscores exactly why. The long blast along the back straight — with the DRS zone stretching from the hairpin all the way to the chicane — saw top speeds exceeding 330 km/h, making it the fastest braking point of the season to that stage.`,
      `The brake data into the famous hairpin is particularly striking. The most aggressive drivers were beginning to brake almost 80 metres later than the conservative end of the grid, yet arriving at essentially the same apex speed. This reflects the advantage of high-confidence carbon braking systems and the willingness of certain drivers to exploit the large runoff area as a safety margin on the outside.`,
      `Canada's wall-lined circuit also punishes any aerodynamic damage heavily. The telemetry from one midfield car that clipped the barriers in the third sector shows an immediate 15 km/h straight-line speed loss as the damaged front wing created additional drag, visually explaining why even minor contact at street-style circuits tends to have a much larger performance impact than it might appear from a broadcast camera.`,
    ],
  },
  {
    round: 'R4',
    race: 'Miami GP — Miami International Autodrome',
    date: 'May 3, 2026',
    tag: 'Speed Trace',
    body: [
      `The Miami International Autodrome produced fascinating telemetry data in 2026, particularly through the long, sweeping Turn 7–9 complex where the combination of high-speed commitment and late-apex precision separated the championship contenders from the rest of the pack. This sequence of corners demands a car that is both aerodynamically stable at peak load and responsive enough to rotate quickly at the point of turn-in.`,
      `McLaren's pace through the Miami stadium section was notably superior this year, with our speed trace showing them carrying nearly 18 km/h more through the fast left-right complex compared to the average of the top five teams. This ties directly into their suspension geometry updates introduced for the Miami weekend, which allowed a flatter ride through the banked sections without sacrificing mechanical grip in the slower final sector.`,
      `The sprint race data provided a unique window into race-trim tyre behaviour without the strategic noise of a full grand prix. Comparing the sprint and main race throttle maps for the top drivers reveals that medium compound management in the sprint directly informed how aggressively teams opted to use the soft tyre in the opening laps of the main event — a data feedback loop that has become increasingly important as the sprint format matures.`,
    ],
  },
  {
    round: 'R3',
    race: 'Japanese GP — Suzuka Circuit',
    date: 'March 29, 2026',
    tag: 'Downforce',
    body: [
      `Suzuka is widely considered the ultimate test of a Formula 1 car's aerodynamic integrity, and the 2026 Japanese Grand Prix telemetry reinforces that reputation vividly. The iconic figure-of-eight layout demands peak downforce commitment through the fearsome Esses sequence in Sector 1, yet requires efficient low-drag configuration through the back straight to remain competitive at the end of the lap.`,
      `The data through 130R — arguably the fastest corner in modern F1 — shows a fascinating divergence in driving styles. Several drivers chose to flatten the throttle completely from well before the apex, trusting the car's aerodynamic platform to generate enough grip through the long, sweeping right-hander. Others lifted fractionally mid-corner, trading a small speed compromise for greater confidence and consistency over a race distance.`,
      `Tyre degradation at Suzuka in 2026 was heavier than in recent years due to the resurfaced sections in Sectors 2 and 3. The telemetry clearly shows the transition point — approximately lap 18–22 on a medium tyre — where front-left temperatures exceeded their optimal window and steering input data shows increasing amounts of correction needed through the high-load left-hand corners.`,
    ],
  },
  {
    round: 'R2',
    race: 'Chinese GP — Shanghai International Circuit',
    date: 'March 15, 2026',
    tag: 'Race Analysis',
    body: [
      `The 2026 Chinese Grand Prix at Shanghai was one of the most chaotic race weekends of the season opener swing. A red flag incident on the grid resulted in multiple drivers being unable to restart, dramatically reshaping the race and producing a result that the pure pace telemetry data did not necessarily predict. The Mercedes of Kimi Antonetti ultimately took victory in just his second Formula 1 race — a result that the sector time data suggests was as much about clear air and tyre management as raw outright speed.`,
      `Looking at the qualifying telemetry from the long, sweeping Turn 1–2 complex at Shanghai, the spread of minimum corner speeds was over 20 km/h between the fastest and slowest qualifiers. This traces directly to suspension and differential setup choices that affect how aggressively a driver can carry entry speed into the long right-hander before having to manage the car through the double-apex left that follows.`,
      `The ERS data from the back straight at Shanghai — one of the longest full-throttle sections on the calendar at over 1.2 kilometres — highlights the development gap between power unit suppliers in 2026. Top-end deployment differences translate into time gaps of over two tenths of a second at this single location alone, making Shanghai a critical venue for assessing the true power unit hierarchy each season.`,
    ],
  },
  {
    round: 'R1',
    race: 'Australian GP — Albert Park Circuit',
    date: 'March 8, 2026',
    tag: 'Season Opener',
    body: [
      `The 2026 Formula 1 season opened at the Albert Park Circuit in Melbourne, and the telemetry data from the weekend offered an early indication of the competitive order that would play out across the season. Following sweeping regulation changes over the winter, the performance gaps between the leading teams were notably compressed compared to 2025, with less than three tenths of a second separating the top five in qualifying — a margin reflected clearly in the mini-sector breakdown on our visualizer.`,
      `Albert Park's revised layout, which has been progressively updated in recent years to increase average speeds, produced a notably different speed trace profile compared to the original circuit. The new extended sections through the Lakeside complex demand a car that is confidence-inspiring in medium-speed direction changes, and the telemetry shows that teams with more sophisticated active aerodynamic systems had a measurable advantage sustaining speed through the long, sweeping second sector.`,
      `The race distance degradation curves from Australia provide the clearest early-season indication of which teams had best understood the characteristics of the 2026 Pirelli tyre compounds. Teams that opted for a longer opening stint on the medium compound showed lap time drop-off beginning approximately six laps earlier than their rivals on the same rubber, suggesting significant variation in car sensitivity to rear tyre overheating — a theme that would persist deep into the 2026 season.`,
    ],
  },
]

export default function InsightsPage() {
  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1 className="insights-title">Race Insights</h1>
        <p className="insights-sub">Written analysis of telemetry, pace, and strategy from each 2026 race weekend</p>
      </div>
      <div className="insights-list">
        {INSIGHTS.map((item) => (
          <article key={item.round} className="insight-card">
            <div className="insight-card-header">
              <span className="insight-round">{item.round}</span>
              <div className="insight-meta">
                <h2 className="insight-race">{item.race}</h2>
                <div className="insight-sub-meta">
                  <span className="insight-date">{item.date}</span>
                  <span className="insight-tag">{item.tag}</span>
                </div>
              </div>
            </div>
            <div className="insight-body">
              {item.body.map((para, i) => (
                <p key={i} className="insight-para">{para}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
