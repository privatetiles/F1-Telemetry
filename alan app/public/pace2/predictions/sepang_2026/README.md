# Sepang qualifying forecast and maps

Frozen dry best-lap forecast for October 3, 2026, using data through FP2 on October 2. The pole estimate is Antonelli at 1:34.933. The UI intentionally shows only the pole time; REPORT.md contains the method, assumptions and uncertainty.

The revised track mix is 43.097992% slow corners, 26.038012% fast corners and 30.863997% straights. The historical team model includes Baku qualifying with Russell as the sole Mercedes reference. Sepang practice is not added to the canonical history.

The driver CSV in this folder preserves the original full-precision forecast. The app-facing driver CSV declares `delta_sign=slower_positive`, and the team CSV is a fixed pre-qualifying snapshot so later history updates do not rewrite it. The 1:35.006852 Mercedes team-mean baseline is 98.040 seconds times the six-event weighted-median Q3/medium-FP2 ratio of 0.969062139. Driver offsets are centered over each current pair.

- `anchor_calibration.csv`, `anchor_event_ledger.csv` and `anchor_leave_one_out.csv`: anchor inputs, exclusions and historical error checks.
- `driver_offset_samples.csv`: dry same-team, last-shared-phase qualifying comparisons with linear round weights.
- `sepang_relative_pace_projection.csv` and `practice_2_track_mix.csv`: structural team projection and revised weights.
- `sepang_provisional_3class_segments.csv` and `map_revision_changes.csv`: all 11 shared segments and requested exit changes.
- `map_reference_telemetry.csv` and `map_metadata.json`: Leclerc FP2 reference trace, coordinate scale and colour scale.
- `source_hashes.json`: provenance of the archived analysis inputs; original raw files remain in the Keji workspace.

The telemetry map uses native reference-lap speed with a blue → green → yellow → red scale, 60–330 km/h, and 100m markers. The three-class map shows only the circuit with red slow corners, green fast corners and black straights. Its classifications follow the shared screened FP2 median and the user's map overrides.

Validation from `alan app/`: `npm test` (24 passed), `npm run build`, and `npx eslint src/lib/paceData2.ts src/components/PaceAnalysis2View.tsx tests/sepang.test.mjs`. Desktop and mobile previews were checked, including both map tabs and the compact pole display. The seven Sepang tests verify publication integrity and independently reproduce the forecast from the archived calibration inputs.
