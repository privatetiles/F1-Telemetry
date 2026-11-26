# Brazil and Las Vegas projections

These are current relative circuit projections for 11 teams, not measured target-event deltas or retrospective qualifying forecasts. Positive values mean slower than Mercedes. Existing saved driver forecasts and pole times are unchanged.

Calibration reuses repaired historical segment values from 12 admitted 2026 events, weighted by category duration times original event order. Wet Miami, Canada and Dutch sessions and the unresolved Baku Mercedes reference are excluded. The approved 2025 maps supply target category time shares only. See audit.json, event_admission.csv and track_time_mix.json for provenance and limitations.

The Python file is an archival copy of the workspace generator at scripts/project_brazil_las_vegas_pace.py, whose paths assume the original Keji workspace and its raw inputs. It is not a standalone generator from this audit directory.

The user explicitly requested the display text "The race was wet." on both 2026 tabs. This wording is a display override, not new weather evidence: the earlier audit identified wet Sao Paulo 2026 sessions and wet Las Vegas 2025 qualifying; Las Vegas 2026 full telemetry validation remained unresolved. The display override does not change input eligibility or source-year metadata.

Validation: 10 pace tests, targeted ESLint, TypeScript/Vite production build and whitespace checks passed. All 70 protected historical pace CSV files retain their hashes. Desktop checks verified the separate tabs, projected tables, map toggles and 2025 map labels. The build retains its existing bundle-size advisory.
