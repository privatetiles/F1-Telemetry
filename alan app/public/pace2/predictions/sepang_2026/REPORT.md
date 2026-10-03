# Sepang qualifying-time forecast — October 3, 2026

Dry-run forecast through FP2 only. Predicted pole: ANT 1:34.933.

Mercedes FP2 medium mean: 98.040s. Six-event recency-weighted median Q3/FP2 ratio: 0.969062. Mercedes qualifying mean anchor: 95.007s (1:35.007).

Team percentages come from the revised Sepang map and existing historical category calibration, including Baku. The approximate lap-time conversion uses a unit slope. Historical qualifying offsets use each pair’s last shared qualifying phase, dry-session samples, current-team history, and linear round weights. They are centered over the current pair. Mercedes at Baku has only the selected Russell reference, so it is omitted from the paired anchor and Mercedes driver-offset estimate.

| Rank | Driver | Team | Predicted time | Gap |
|---:|---|---|---:|---:|
| 1 | Kimi Antonelli | Mercedes | 1:34.933 | +0.000s |
| 2 | Charles Leclerc | Ferrari | 1:35.065 | +0.132s |
| 3 | George Russell | Mercedes | 1:35.081 | +0.148s |
| 4 | Lewis Hamilton | Ferrari | 1:35.150 | +0.218s |
| 5 | Max Verstappen | Red Bull Racing | 1:35.329 | +0.396s |
| 6 | Isack Hadjar | Red Bull Racing | 1:35.362 | +0.429s |
| 7 | Lando Norris | McLaren | 1:35.388 | +0.455s |
| 8 | Oscar Piastri | McLaren | 1:35.457 | +0.524s |
| 9 | Pierre Gasly | Alpine | 1:36.498 | +1.565s |
| 10 | Nico Hulkenberg | Audi | 1:36.615 | +1.682s |
| 11 | Arvid Lindblad | Racing Bulls | 1:36.646 | +1.714s |
| 12 | Gabriel Bortoleto | Audi | 1:36.719 | +1.786s |
| 13 | Liam Lawson | Racing Bulls | 1:36.773 | +1.841s |
| 14 | Franco Colapinto | Alpine | 1:36.816 | +1.884s |
| 15 | Oliver Bearman | Haas F1 Team | 1:37.069 | +2.137s |
| 16 | Esteban Ocon | Haas F1 Team | 1:37.346 | +2.413s |
| 17 | Carlos Sainz | Williams | 1:37.413 | +2.481s |
| 18 | Alexander Albon | Williams | 1:37.717 | +2.784s |
| 19 | Fernando Alonso | Aston Martin | 1:38.811 | +3.879s |
| 20 | Sergio Perez | Cadillac | 1:38.994 | +4.062s |
| 21 | Lance Stroll | Aston Martin | 1:39.131 | +4.199s |
| 22 | Valtteri Bottas | Cadillac | 1:39.428 | +4.495s |

Anchor leave-one-out mean absolute error: 0.706s; largest error: 1.531s. A rough absolute-time error scale is ±1.2s. This is not a confidence interval or a team-ranking uncertainty estimate.

Reported milliseconds describe model output precision, not predictive accuracy. These are best-lap potential estimates; elimination, track evolution, traffic and red flags can alter achieved times and grid order.

F1’s pre-weekend forecast reports 40% Saturday rain chance; this table assumes dry conditions. [Official weather forecast](https://www.formula1.com/en/latest/article/what-is-the-weather-forecast-for-the-2026-bahrain-grand-prix-in-malaysia.5OZ23exBdO608dxwkDLrad). [Official session schedule](https://www.formula1.com/en/latest/article/what-time-is-the-formula-1-2026-bahrain-grand-prix-in-malaysia-and-how-can-i-watch-it.3gFLqniY3acdKlkPjaN66d).

Limitations:
- Dry best-lap potential, not a Q1/Q2/Q3 elimination or grid-position model.
- The weighted speed metric is mapped approximately into lap-time percentage with unit slope.
- FP2 Mercedes anchor laps carry mixed green/yellow status; fuel and power settings are unknown.
- Only six comparable anchor weekends; leave-one-out checks do not validate Sepang.
- Baku remains in structural team calibration with its unresolved Russell telemetry warning.
- Historical driver offsets include session interruptions and driver errors.
- Forecast uses FP1/FP2 era inputs only; no Sepang FP3 or qualifying results.

Reproduce with `.venv/bin/python scripts/predict_sepang_qualifying.py`. Calibration FP2 inputs were downloaded from the official F1 timing feed with telemetry disabled. See anchor_event_ledger.csv for every included/excluded weekend; anchor_calibration.csv for timing pairs; driver_offset_samples.csv for teammate comparisons; source_hashes.json for input provenance.
