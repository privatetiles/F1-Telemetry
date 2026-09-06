export interface CircuitHighlight {
  year: number
  winner: string
  note: string
}

export interface DriverHighlight {
  race: string
  year: number
  note: string
}

export const CIRCUIT_HIGHLIGHTS: Record<string, CircuitHighlight[]> = {
  australia: [
    { year: 2022, winner: 'Charles Leclerc', note: 'Dominant Ferrari pole-to-win to open the new regulation era, with Verstappen retiring twice.' },
    { year: 2011, winner: 'Sebastian Vettel', note: 'Vettel controlled from pole in the opening round of his second title-winning season.' },
    { year: 1996, winner: 'Damon Hill', note: 'Albert Park hosted its first Australian GP; Hill won comfortably as Schumacher retired.' },
  ],
  china: [
    { year: 2024, winner: 'Max Verstappen', note: 'Brilliant tyre management in the first Chinese GP since 2019, Verstappen led a Red Bull one-two.' },
    { year: 2009, winner: 'Sebastian Vettel', note: 'Vettel dominated for Red Bull in the middle of Brawn GP\'s title-winning season.' },
    { year: 2007, winner: 'Kimi Räikkönen', note: 'Räikkönen won en route to his only championship, capitalising on McLaren reliability failures.' },
  ],
  japan: [
    { year: 2005, winner: 'Kimi Räikkönen', note: 'One of the greatest drives in F1 history — Räikkönen started last and overtook Fisichella on the final lap.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen clinched his third consecutive title at Suzuka with six races to spare.' },
    { year: 2019, winner: 'Valtteri Bottas', note: 'Bottas won a dominant pole-to-win with Mercedes, one of the finest drives of his career.' },
  ],
  miami: [
    { year: 2024, winner: 'Lando Norris', note: 'Norris took his long-awaited maiden Formula 1 victory after years of agonisingly close calls.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen led from pole in the second Miami GP in dominant fashion.' },
  ],
  canadian: [
    { year: 2011, winner: 'Jenson Button', note: 'Widely regarded as one of the greatest races ever — Button won from last after a two-hour red flag and six Safety Cars.' },
    { year: 2019, winner: 'Lewis Hamilton', note: 'Hamilton won after Vettel received a controversial five-second penalty for rejoining unsafely while leading.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen dominant as the turbo-hybrid era showed its full power on the long back straight.' },
  ],
  monaco: [
    { year: 1984, winner: 'Alain Prost', note: 'Senna was dominant when rain stopped the race; Prost was declared winner in one of F1\'s most controversial finishes.' },
    { year: 2021, winner: 'Max Verstappen', note: 'Verstappen won Monaco for the first time as Ferrari suffered a slow pit stop that handed him the lead.' },
    { year: 2024, winner: 'Charles Leclerc', note: 'Leclerc finally won his home race at Monaco after years of heartbreak, including a 2022 mechanical failure while leading.' },
  ],
  barcelona_catalunya: [
    { year: 1996, winner: 'Michael Schumacher', note: 'Schumacher won alone in treacherous wet conditions after every other frontrunner crashed or retired.' },
    { year: 2016, winner: 'Max Verstappen', note: 'Hamilton and Rosberg collided on lap one; Verstappen inherited the lead and won his first Grand Prix at just 18.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen dominant from pole, extending his championship lead with a controlled Barcelona masterclass.' },
  ],
  austrian: [
    { year: 2019, winner: 'Max Verstappen', note: 'Verstappen overtook Leclerc on the final lap in a move that sparked controversy — and the first of many battles between them.' },
    { year: 2020, winner: 'Valtteri Bottas', note: 'Bottas won the season opener at the Red Bull Ring as the COVID-delayed campaign finally began without spectators.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen at his dominant best, leading every lap of both the Sprint and main race.' },
  ],
  british: [
    { year: 2021, winner: 'Lewis Hamilton', note: 'Hamilton and Verstappen collided at Copse; Hamilton recovered from a penalty to win as Verstappen crashed heavily.' },
    { year: 2022, winner: 'Carlos Sainz', note: 'Sainz won his maiden Grand Prix from pole just days after emergency appendix surgery — one of the most remarkable recent victories.' },
    { year: 1991, winner: 'Nigel Mansell', note: 'Mansell won in front of a feverish home crowd who invaded the track at the chequered flag in iconic scenes.' },
  ],
  belgian: [
    { year: 2000, winner: 'Mika Häkkinen', note: 'Häkkinen\'s legendary overtake — using Zonta\'s backmarker car to pass Schumacher at 300 km/h — is one of the finest moves in F1 history.' },
    { year: 2019, winner: 'Charles Leclerc', note: 'Leclerc won his first Formula 1 race at Spa, dedicating the victory to Anthoine Hubert who had died in an F2 crash the day before.' },
    { year: 2026, winner: 'Kimi Antonelli', note: 'Antonelli\'s strategic masterclass at Spa, using a flat degradation curve to undercut the leading group for a decisive Mercedes win.' },
  ],
  hungarian: [
    { year: 2021, winner: 'Esteban Ocon', note: 'Chaos at Turn 1 eliminated most frontrunners; Ocon won his first GP from second, holding off Hamilton in a race of constant drama.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Dominant Verstappen win at the Hungaroring, the tightest circuit on the calendar — proof of Red Bull\'s all-round pace.' },
    { year: 2026, winner: 'Lando Norris', note: 'McLaren\'s mechanical grip advantage on full display — Norris carried 8 km/h more through Turn 2 than any rival.' },
  ],
  dutch: [
    { year: 2021, winner: 'Max Verstappen', note: 'The Dutch GP returned after 36 years; Verstappen won in front of a sea of orange — one of the most atmospheric scenes in modern F1.' },
    { year: 2022, winner: 'Max Verstappen', note: 'Verstappen won after starting from the back following a grid penalty, in a race that demonstrated his brilliance in recovery drives.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Norris led on softs before a late rain shower reshuffled strategy; Verstappen pounced to win in a tense finale.' },
  ],
  italian: [
    { year: 2019, winner: 'Charles Leclerc', note: 'Back-to-back Leclerc wins at Ferrari\'s home race; the Monza crowd invaded the track in scenes of pure emotion.' },
    { year: 2020, winner: 'Pierre Gasly', note: 'One of the biggest shock wins in recent memory — Gasly\'s AlphaTauri led the slowest-ever Monza race after a Hamilton pit lane penalty.' },
    { year: 2021, winner: 'Daniel Ricciardo', note: 'Hamilton and Verstappen collided at the chicane and retired; Ricciardo and Norris gave McLaren a first one-two since 2010.' },
  ],
  madrid: [
    { year: 2026, winner: 'TBD', note: 'Madrid joins the calendar for 2026 on a new purpose-built circuit — the first Spanish Grand Prix at this venue.' },
  ],
  azerbaijan: [
    { year: 2017, winner: 'Daniel Ricciardo', note: 'Ricciardo won from the chaos after Bottas and Hamilton both suffered Safety Car misfortune in the closing stages.' },
    { year: 2021, winner: 'Sergio Pérez', note: 'Verstappen punctured while leading; Hamilton pressed the wrong button at the restart — Pérez won for Red Bull in the confusion.' },
    { year: 2023, winner: 'Sergio Pérez', note: 'Pérez dominated at Baku, a circuit that has consistently suited his smooth, late-braking style.' },
  ],
  singapore: [
    { year: 2017, winner: 'Sebastian Vettel', note: 'Vettel won after a chaotic Turn 1 incident eliminated Räikkönen and Verstappen — a result that reignited his title fight with Hamilton.' },
    { year: 2023, winner: 'Carlos Sainz', note: 'Sainz produced a lights-to-flag masterclass under the Singapore lights, holding off a late charge on ageing tyres.' },
    { year: 2024, winner: 'Lando Norris', note: 'Norris won from pole in a controlled drive, adding to his breakout 2024 campaign.' },
  ],
  united_states: [
    { year: 2012, winner: 'Lewis Hamilton', note: 'Hamilton won the inaugural United States GP at the new Circuit of The Americas — the first COTA race in history.' },
    { year: 2021, winner: 'Max Verstappen', note: 'Verstappen beat Hamilton in a tense title-fight battle at COTA, with the championship going down to the final race.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen added the Sprint to his main race victory for maximum points, underlining his dominance of 2023.' },
  ],
  mexican_city: [
    { year: 2015, winner: 'Nico Rosberg', note: 'The first Mexican GP since 1992 — Rosberg won the historic revival at the Autódromo Hermanos Rodríguez.' },
    { year: 2018, winner: 'Max Verstappen', note: 'Verstappen ran the fastest lap and dominated in what was a sign of things to come for the Dutchman.' },
    { year: 2021, winner: 'Max Verstappen', note: 'Commanding Verstappen victory that extended his title lead over Hamilton with three rounds remaining.' },
  ],
  sao_paulo: [
    { year: 2012, winner: 'Jenson Button', note: 'Button\'s brilliant wet-weather masterclass from P6 on a chaotic final day — Vettel was also handed a drive-through penalty, settling a memorable championship.' },
    { year: 2021, winner: 'Lewis Hamilton', note: 'Hamilton overcame disqualification and grid penalties across the weekend to finish fifth in the Sprint, then won the main race — one of the most complete F1 weekends ever.' },
    { year: 2022, winner: 'George Russell', note: 'Russell\'s maiden Formula 1 victory at Interlagos — a composed drive that cemented his place at the front of the grid.' },
  ],
  las_vegas: [
    { year: 2023, winner: 'Max Verstappen', note: 'The return of Las Vegas to the F1 calendar after 41 years — Verstappen won the night race under the neon Strip.' },
    { year: 2024, winner: 'Carlos Sainz', note: 'Sainz won the second Las Vegas GP in dominant fashion, with Ferrari showing strong pace on the long straights.' },
  ],
  qatar: [
    { year: 2021, winner: 'Lewis Hamilton', note: 'Hamilton dominated at Losail in the first Qatar GP, with numerous competitors suffering tyre failures in the closing stages.' },
    { year: 2023, winner: 'Max Verstappen', note: 'Verstappen won the main race while the Sprint saw multiple punctures and a Safety Car — a chaotic Lusail weekend.' },
  ],
  abu_dhabi: [
    { year: 2010, winner: 'Sebastian Vettel', note: 'Vettel started 7th and won the title as Alonso was stuck behind Petrov, Webber and Hamilton all failed to score — one of the most dramatic title deciders ever.' },
    { year: 2021, winner: 'Max Verstappen', note: 'The most controversial race finish in decades — Verstappen overtook Hamilton on the final lap after a late Safety Car restart to win his first title.' },
    { year: 2022, winner: 'Charles Leclerc', note: 'Leclerc won the season finale as Verstappen dominated 2022 with a record 15 wins — a closing statement from Ferrari on what might have been.' },
  ],
}

export const DRIVER_HIGHLIGHTS: Record<string, DriverHighlight[]> = {
  VER: [
    { race: 'Spanish GP', year: 2016, note: 'Won his debut race for Red Bull at just 18 — the youngest winner in Formula 1 history at the time.' },
    { race: 'Abu Dhabi GP', year: 2021, note: 'Last-lap overtake on Hamilton after a controversial Safety Car restart to clinch his first World Championship.' },
    { race: 'Japanese GP', year: 2023, note: 'Clinched his third consecutive title at Suzuka with six races still to go — the most dominant season in the turbo-hybrid era.' },
  ],
  ANT: [
    { race: 'Chinese GP', year: 2026, note: 'Won his maiden Formula 1 Grand Prix at Shanghai in a dominant lights-to-flag drive — the breakthrough result that announced his arrival among the frontrunners.' },
    { race: 'Belgian GP', year: 2026, note: 'Strategic masterclass at Spa — flat tyre degradation allowed him to undercut the leading group and win convincingly.' },
  ],
  HAM: [
    { race: 'Brazilian GP', year: 2008, note: 'Clinched his first World Championship on the final corner of the final lap, overtaking Glock to secure the fifth place he needed.' },
    { race: 'Russian GP', year: 2021, note: 'Won his 100th Formula 1 Grand Prix at Sochi — a milestone no other driver has ever reached.' },
    { race: 'Brazilian GP', year: 2021, note: 'Fought from the back of the grid to victory after a disqualification controversy — a stunning drive through the field that reignited his title battle with Verstappen.' },
  ],
  NOR: [
    { race: 'Miami GP', year: 2024, note: 'His long-awaited first win, finally ending the "Last Lap Lando" narrative after three years of heartbreak.' },
    { race: 'Singapore GP', year: 2024, note: 'Dominant pole-to-win at one of the most demanding street circuits — part of a remarkable mid-season title charge.' },
    { race: 'Hungarian GP', year: 2026, note: 'McLaren\'s rear mechanical grip advantage was decisive — Norris was 8 km/h faster through Turn 2 than any rival.' },
  ],
  RUS: [
    { race: 'Sakhir GP', year: 2020, note: 'In his debut race in a Mercedes seat — filling in for the ill Hamilton — Russell led convincingly before a botched pit stop and puncture denied him a sensational win at Bahrain\'s outer layout.' },
    { race: 'Brazilian GP', year: 2022, note: 'Maiden Formula 1 victory at Interlagos in his first full season for Mercedes — a composed, controlled drive that confirmed his place among the grid\'s elite.' },
  ],
  LEC: [
    { race: 'Bahrain GP', year: 2019, note: 'Won on his Ferrari debut, becoming the second youngest driver to win for the Scuderia — on the same track where he had taken his first pole.' },
    { race: 'Italian GP', year: 2024, note: 'Won at Monza in front of the Tifosi — an emotional Ferrari home victory that ended a long wait and triggered scenes of celebration in the grandstands.' },
    { race: 'Monaco GP', year: 2024, note: 'Finally won his home race after years of Monaco heartbreak, including a devastating 2022 mechanical failure while leading.' },
  ],
  PIA: [
    { race: 'Hungarian GP', year: 2024, note: 'First career victory at the Hungaroring — a composed performance in a McLaren one-two that announced his arrival at the front.' },
    { race: 'Dutch GP', year: 2025, note: 'Claimed a grand chelem at Zandvoort — pole, win, fastest lap, and led every lap — a masterclass that underlined his status as a future champion.' },
  ],
  SAI: [
    { race: 'Australian GP', year: 2024, note: 'Won in Melbourne just days after emergency appendix surgery — one of the most remarkable victories in modern Formula 1, driving through pain to beat the field and silence any doubters ahead of his Ferrari farewell season.' },
    { race: 'British GP', year: 2022, note: 'Won from pole at Silverstone — a commanding drive under intense pressure that produced one of his strongest performances of the season.' },
    { race: 'Singapore GP', year: 2023, note: 'Brilliant lights-to-flag win at Marina Bay, holding off charging rivals on ageing tyres in intense heat and humidity.' },
  ],
  ALO: [
    { race: 'Bahrain GP', year: 2005, note: 'Won the race that confirmed his first World Championship — ending Michael Schumacher\'s five-title run at just 24 years old.' },
    { race: 'Monaco GP', year: 2006, note: 'Commanding victory at Monte Carlo in his second championship-winning season, demonstrating the full range of his ability.' },
    { race: 'Bahrain GP', year: 2023, note: 'Returned to the podium at 41 with Aston Martin — the start of a stunning late-career resurgence that reminded the paddock of his enduring talent.' },
  ],
  GAS: [
    { race: 'Italian GP', year: 2026, note: 'Took a stunning pole position at Monza for Alpine — his first career pole and the fastest qualifying lap of the 2026 Italian GP weekend, beating the top teams on the power-sensitive circuit.' },
    { race: 'Italian GP', year: 2020, note: 'One of the biggest shock results in recent memory — Gasly won at Monza for AlphaTauri after a Hamilton pit lane penalty, the team\'s first ever F1 win.' },
    { race: 'Brazilian GP', year: 2019, note: 'Scored a stunning second place for Toro Rosso at Interlagos — just months after being dropped by Red Bull — one of the most emotional results in recent F1 history.' },
  ],
  OCO: [
    { race: 'Hungarian GP', year: 2021, note: 'First and only Formula 1 victory — Ocon kept his head in a chaotic race where most frontrunners were wiped out at Turn 1 on lap one.' },
  ],
  BOT: [
    { race: 'Russian GP', year: 2017, note: 'Won his first Formula 1 Grand Prix at Sochi — a breakthrough moment that had seemed elusive despite years of strong performances.' },
    { race: 'Japanese GP', year: 2019, note: 'Dominant pole-to-win at Suzuka, one of the finest drives of his Mercedes tenure.' },
  ],
  PER: [
    { race: 'Sakhir GP', year: 2020, note: 'Won in the most dramatic circumstances — called up as a substitute, Pérez took a deserved first victory for Racing Point after years of near-misses.' },
    { race: 'Monaco GP', year: 2022, note: 'Strategic victory at Monte Carlo, outwitting Verstappen\'s Red Bull team to take the most glamorous win of his career.' },
  ],
  STR: [
    { race: 'Azerbaijan GP', year: 2017, note: 'Finished third as a rookie at Baku — one of the youngest podium finishers in Formula 1 history at the time.' },
    { race: 'Turkish GP', year: 2020, note: 'Shock pole position in mixed conditions at Istanbul Park — one of the most unexpected qualifying results in recent seasons.' },
  ],
  HUL: [
    { race: '24 Hours of Le Mans', year: 2015, note: 'Won Le Mans outright with Porsche — his greatest motorsport achievement and a title that eluded him throughout his Formula 1 career.' },
    { race: 'Brazilian GP', year: 2010, note: 'Took a stunning pole position at Interlagos in the wet — out-qualifying everyone in a Williams that had no business being at the front — one of the great qualifying laps of the modern era.' },
    { race: 'British GP', year: 2025, note: 'Claimed his first Formula 1 podium at Silverstone after more than 180 race starts — one of the most celebrated moments in the paddock from a driver whose talent long deserved it.' },
  ],
  ALB: [
    { race: 'British GP', year: 2020, note: 'Claimed a podium finish at Silverstone in his second season at Red Bull — evidence of the raw pace that had earned him a top-team seat.' },
  ],
  BEA: [
    { race: 'Saudi Arabian GP', year: 2024, note: 'Scored points on his Formula 1 debut at Jeddah, deputising for Sainz at Ferrari — the composed performance that earned him his full-time 2025 seat at Haas.' },
  ],
  COL: [
    { race: 'Azerbaijan GP', year: 2024, note: 'Scored P8 at Baku early in his Formula 1 career — a composed drive on one of the fastest and most demanding street circuits that announced his arrival at the top level.' },
  ],
  BOR: [
    { race: 'Bahrain GP', year: 2026, note: 'Made his Formula 1 debut with Audi — representing the German manufacturer\'s first race as a fully works Formula 1 entry.' },
  ],
  HAD: [
    { race: 'Bahrain GP', year: 2026, note: 'Made his Formula 1 debut for Red Bull Racing alongside Verstappen — one of the most anticipated rookie arrivals in years.' },
  ],
  LAW: [
    { race: 'United States GP', year: 2023, note: 'Scored his first Formula 1 points in only his fifth race as a substitute driver for AlphaTauri — an immediate impression.' },
  ],
  LIN: [
    { race: 'Bahrain GP', year: 2026, note: 'Made his Formula 1 debut with Racing Bulls as one of the youngest drivers on the 2026 grid, backed by the Red Bull junior programme.' },
  ],
  TSU: [
    { race: 'Abu Dhabi GP', year: 2021, note: 'Finished fourth at Yas Marina in his debut season — a controlled performance on the final lap of the year that confirmed his status as one of the most exciting rookie talents in the field.' },
    { race: 'Qatar GP', year: 2025, note: 'Fifth in the Sprint at Lusail — a clean, precise drive that demonstrated his ability to perform on circuits that demand absolute commitment.' },
  ],
}
