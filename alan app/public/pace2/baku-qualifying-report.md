# Baku qualifying pace snapshot

Approved analysis snapshot: 2026-09-27. Positive percentages mean slower than Mercedes.

## Scope and selection

- One AZE history column, using 2026 qualifying only. Each driver's fastest lap across Q1/Q2/Q3 is selected, then Antonelli is excluded at the user's request. This is not a Q1-only analysis.
- 21 drivers: six Q1, seven Q2, eight Q3. Mercedes uses Russell's Q3 lap 25, 1:42.526; all other teams use two drivers.
- AZE qualifying enters calibration once, as event 15. Neither Baku race nor the Q1-only trial enters the active history or calibration.
- The prior 14-event history is also refreshed to the approved interpolated snapshot. These are not unchanged historical values from the previous website version.
- Hungary, the Netherlands, Italy, Madrid, and Baku use qualifying. Earlier events use race laps. Original graphics, map-viewer behavior, and archived driver/pole forecasts are unchanged.
- Existing display exclusions are preserved, including Williams' Netherlands history cell. Display exclusions are separate from calibration inclusion; the latter is recorded in `calibration_included`.

## Calculation

For each Baku segment, the team speed is the driver-speed average weighted by driver segment duration. Category speeds are averages of team segment speeds weighted by the corresponding Mercedes segment durations. The category delta is `100 * (Mercedes category speed / team category speed - 1)`, rounded to three decimals. The event overall is the category-duration-weighted average of those deltas.

For the 15-event calibration, each included category row receives weight `time_weight_seconds * event_order`. Category predictions are the weighted mean of category deltas. Overall pace combines the three category predictions using their accumulated input weights. Event order is explicit in the CSV and ranges from 1 to 15; missing inputs are not imputed as zero.

## Quality limitations

This remains a **provisional, unresolved-baseline** comparison, not a fully cleaned estimate. Russell's Q3 telemetry holds 180 km/h for 0.800 seconds, then reaches 231 km/h in 0.280 seconds. The interpolation repair failed its gate because the lap has mixed green/yellow status, so that interval remains uncorrected. Stroll's braking jump also remains unresolved. Existing accepted session-specific interpolation repairs are retained.

Excluding Antonelli is a requested comparison choice, not evidence that his lap is corrupt. Using Russell alone against two-driver averages can favor Mercedes. The provisional 19-segment speed-band map spans 0-5930 m, and mixed qualifying phases and track statuses limit comparability.

`passes_prior_quality_gate` in the lap manifest records the earlier gate result, not a guarantee that all anomalies have been repaired. Russell is explicitly marked false and included in this provisional calibration.

## Results

| Team | AZE overall (%) | 15-event overall (%) |
|---|---:|---:|
| Mercedes | 0.000 | 0.000 |
| Ferrari | 0.761 | 0.136 |
| Red Bull Racing | 0.926 | 0.365 |
| McLaren | 0.932 | 0.436 |
| Alpine | 1.812 | 1.677 |
| Audi | 2.898 | 1.733 |
| Racing Bulls | 2.367 | 1.755 |
| Haas F1 Team | 2.247 | 2.258 |
| Williams | 2.087 | 2.632 |
| Aston Martin | 4.189 | 4.179 |
| Cadillac | 4.747 | 4.320 |

## Audit files

- `delta_calculations/all_available_2026_3class_delta_calculations.csv`: 489 event/team/category rows, including explicit recency order and calibration inclusion.
- `delta_calculations/baku_2026_qualifying_russell_only.csv`: the 33 AZE category rows.
- `predictions/delta_predictions/team_category_delta_inputs_from_2026.csv`: 33 recalculated team/category predictions with source event lists.
- `provenance/baku_2026_selected_qualifying_laps.csv`: 21 selected laps, phases, source-relative telemetry paths, and quality flags.
- `provenance/baku_2026_selected_driver_segments.csv`: 399 selected driver/segment speed and duration records.

Run `npm run test:pace` from `alan app` to verify the committed data, recency-weighted aggregation, provenance, and production loaders. The original extraction/interpolation scripts and raw telemetry are outside this repository; these checks validate this published snapshot, not a fresh FastF1 extraction or the completeness of anomaly detection.
