"""Build relative circuit projections without driver or absolute-time forecasts."""
from pathlib import Path
import hashlib
import json
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'outputs/github-pr-circuit-maps-2026-11-26/alan app'
OUT = ROOT / 'outputs/brazil_las_vegas_projections_2026-11-26'
MAPS = ROOT / 'outputs/latest_two_races_2026-11-26/maps'
CATEGORIES = ['Slow corners', 'Fast corners', 'Straights']
DELTA = 'weighted_speed_delta_vs_mercedes_pct'


def project(values, shares):
    if set(values) != set(CATEGORIES) or set(shares) != set(CATEGORIES):
        raise ValueError('All three categories required')
    if not all(np.isfinite(values[c]) and np.isfinite(shares[c]) and shares[c] > 0 for c in CATEGORIES):
        raise ValueError('Finite deltas and positive shares required')
    if not np.isclose(sum(shares.values()), 1):
        raise ValueError('Shares must sum to one')
    return float(sum(values[c] * shares[c] for c in CATEGORIES))


def main():
    OUT.mkdir(exist_ok=True)
    hashes = {}

    def record(path):
        hashes[str(path.relative_to(ROOT))] = hashlib.sha256(path.read_bytes()).hexdigest()
        return path

    def read(path):
        return pd.read_csv(record(path))

    history = read(APP / 'public/pace2/delta_calculations/all_available_2026_3class_delta_calculations.csv')
    ledger = []
    for event, group in history.groupby('event'):
        order = int(group.event_order.iloc[0])
        session = 'race' if order <= 10 else 'qualifying'
        directories = sorted((ROOT / 'FastF1 Data/2026').glob(f'{order:02d}_*'))
        if order == 16:
            directories = [ROOT / 'outputs/sepang_data_cleanup_2026-10-04/raw/FastF1 Data/2026/16_bahrain_grand_prix']
        directory = directories[0] / session if len(directories) == 1 else None
        weather_files = list(directory.glob('*_weather.csv')) if directory else []
        lap_files = list(directory.glob('*_laps.csv')) if directory else []
        reasons = []
        if order == 15:
            reasons.append('unresolved_mercedes_reference')
        if len(weather_files) != 1 or len(lap_files) != 1:
            reasons.append('missing_weather_or_lap_evidence')
        else:
            weather, laps = read(weather_files[0]), read(lap_files[0])
            if weather.empty or 'Rainfall' not in weather or weather.Rainfall.isna().any():
                reasons.append('unknown_weather')
            elif weather.Rainfall.astype(str).str.lower().isin(['true', '1', '1.0']).any():
                reasons.append('rain_in_session_weather_export')
            if 'Compound' not in laps:
                reasons.append('missing_tyre_evidence')
            elif laps.Compound.astype(str).str.upper().isin(['WET', 'INTERMEDIATE']).any():
                reasons.append('wet_tyre_laps')
            for control in directory.glob('*_race_control_messages.csv'):
                messages = read(control)
                if 'Message' in messages and messages.Message.astype(str).str.contains('WET TRACK', case=False).any():
                    reasons.append('wet_track_message')
        ledger.append({'event': event, 'session': session, 'event_order': order,
                       'included': not reasons, 'reason': ';'.join(reasons)})
    ledger = pd.DataFrame(ledger)
    admitted = history[history.event.isin(ledger.loc[ledger.included, 'event'])].copy()
    if admitted.duplicated(['event', 'team', 'category']).any():
        raise ValueError('Duplicate historical contributions')
    if not np.isfinite(admitted[[DELTA, 'time_weight_seconds', 'event_order']]).all().all():
        raise ValueError('Invalid historical values')
    if not (admitted.time_weight_seconds.gt(0) & admitted.event_order.gt(0)).all():
        raise ValueError('Nonpositive historical weights')
    calibration = []
    for (team, category), group in admitted.groupby(['team', 'category']):
        calibration.append({'team': team, 'category': category,
                            'delta': float(np.average(group[DELTA], weights=group.time_weight_seconds * group.event_order)),
                            'events': int(group.event.nunique())})
    calibration = pd.DataFrame(calibration)
    teams, mixes = [], []
    for race, prefix in [('São Paulo GP', 'sao_paulo_2025'), ('Las Vegas GP', 'las_vegas_2025')]:
        folder = MAPS / prefix
        provenance = json.loads(record(folder / 'provenance.json').read_text())
        boundaries = read(folder / 'segment_definitions.csv')
        source = ROOT / provenance['source_directory'] / 'telemetry_fastest_laps' / f"{provenance['geometry_driver']}_fastest_lap_telemetry.csv"
        lap = read(source)
        geometry = read(folder / 'geometry.csv')
        native = lap.Distance.to_numpy(float)
        if not np.allclose(native[[0, -1]], geometry.Distance_native_m.to_numpy()[[0, -1]]):
            raise ValueError('Map geometry and selected lap endpoints disagree')
        distance = np.interp(native, geometry.Distance_native_m, geometry.Distance)
        times = lap.Time_seconds.to_numpy(float)
        if not np.isfinite(distance).all() or not np.isfinite(times).all() or (np.diff(distance) <= 0).any() or (np.diff(times) <= 0).any():
            raise ValueError('Invalid audited map reference')
        if not np.isclose(boundaries.start_distance_m.iloc[0], 0) or not np.isclose(boundaries.end_distance_m.iloc[-1], distance[-1]):
            raise ValueError('Map boundaries must cover the actual reference distance')
        if not np.allclose(boundaries.start_distance_m.iloc[1:], boundaries.end_distance_m.iloc[:-1]):
            raise ValueError('Noncontiguous map boundaries')
        seconds = dict.fromkeys(CATEGORIES, 0.0)
        for segment in boundaries.itertuples():
            seconds[segment.category] += float(np.interp(segment.end_distance_m, distance, times) - np.interp(segment.start_distance_m, distance, times))
        shares = {c: seconds[c] / sum(seconds.values()) for c in CATEGORIES}
        mixes.append({'race': race, 'source_year': 2025, 'source_session': provenance['source_session'],
                      'reference_driver': provenance['geometry_driver'], 'seconds': seconds, 'shares': shares})
        for team, group in calibration.groupby('team'):
            values = dict(zip(group.category, group.delta))
            teams.append({'race': race, 'team': team, 'overall': project(values, shares),
                          'slow': values[CATEGORIES[0]], 'fast': values[CATEGORIES[1]], 'straight': values[CATEGORIES[2]],
                          'slowShare': shares[CATEGORIES[0]] * 100, 'fastShare': shares[CATEGORIES[1]] * 100,
                          'straightShare': shares[CATEGORIES[2]] * 100})
    assert len(teams) == 22
    assert all(abs(row['overall']) < 1e-10 for row in teams if row['team'] == 'Mercedes')
    ledger.to_csv(OUT / 'event_admission.csv', index=False)
    admitted.to_csv(OUT / 'calibration_inputs.csv', index=False)
    calibration.to_csv(OUT / 'team_category_calibration.csv', index=False)
    pd.DataFrame(teams).to_csv(OUT / 'circuit_pace_projections.csv', index=False)
    (OUT / 'track_time_mix.json').write_text(json.dumps(mixes, indent=2) + '\n')
    result = {'teams': teams, 'source_year': 2026, 'map_source_year': 2025}
    (OUT / 'circuit_pace_projections.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    (OUT / 'audit.json').write_text(json.dumps({
        'method': 'Category-duration times original event-order calibration; target category fractions from original lap Time using the existing approved map Distance_native_m to Distance alignment. No new distance reconstruction.',
        'scope': 'Current relative circuit projections, not retrospective qualifying forecasts or measured target-event deltas.',
        'sign': 'positive is slower than Mercedes', 'source_hashes': hashes,
        'excluded_events': ledger[~ledger.included].to_dict('records'),
        'limitations': ['Existing repaired historical segment values reused; this run screens session weather and known reference failure, not a new raw telemetry re-audit.',
                       'Any rain anywhere in a session weather export excludes the session conservatively.',
                       '2025 target maps only; no target 2026 team inputs, donor laps, absolute times or driver forecasts.'],
        'historical_forecasts_changed': False,
    }, indent=2) + '\n')
    print(pd.DataFrame(teams).pivot(index='team', columns='race', values='overall').round(3).to_string())
    print(ledger[~ledger.included].to_string(index=False))


if __name__ == '__main__':
    main()
