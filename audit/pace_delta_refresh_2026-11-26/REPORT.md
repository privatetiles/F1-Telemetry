# Current Pace Analysis refresh

Preview: http://127.0.0.1:5174/#pace

Recalculated current form from 12 retained historical events (390 team/category contributions), removing wet Miami, Canada and Dutch sessions and Baku with its unresolved Mercedes reference. No new measured event deltas were added. This reuses existing repaired historical segment values; it is not a complete new raw-data audit.

Positive means slower than Mercedes. Category weights remain reference duration times original event order; overall uses summed category weights. See current_team_pace.csv for all team/category results and before_after.csv for changes. McLaren has 11 inputs because China is absent; Alpine has 11 because Sepang is excluded. Other teams have 12.

Later events: Singapore/Austin and Las Vegas still lack full validated distance/quality inputs; Mexico is missing session data; Brazil is wet and excluded. See later_event_coverage.csv. Circuit projections and display notices were not used as measured inputs.

18 relevant tests, targeted lint, production build and skill validation passed. The helper rejected invalid inputs in smoke checks. All 70 protected historical CSVs retain their hashes. Local desktop review confirmed the updated table, 12 history columns and existing graphics.

The installed update-f1-pace-analysis skill links to the workspace skill folder. It now contains a reusable hash-checked generator and current-delta refresh reference.

Local branch: codex/refresh-pace-deltas-2026-11-26. No push, pull request or deployment; live site and frozen forecasts unchanged.
