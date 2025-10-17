import pandas as pd
import numpy as np
from datetime import timedelta

from data_processing import pump_performance

def compute_degradation_features(op_df, pump_master_map, maint_df):
    op = op_df.copy()
    op['timestamp'] = pd.to_datetime(op['timestamp'])
    op = op.sort_values('timestamp')
    
    # Convert to timezone-naive to avoid comparison issues
    if op['timestamp'].dt.tz is not None:
        op['timestamp'] = op['timestamp'].dt.tz_localize(None)
    
    # expected from pump master
    def expected(row):
        pm = pump_master_map[row['pump_id']]
        return pump_performance(row['flow_m3h'], pm, rpm=row.get('rpm', None))
    exp = op.apply(lambda r: expected(r), axis=1)
    op['expected_head_m'] = exp.apply(lambda x: x['expected_head_m'])
    op['expected_eff'] = exp.apply(lambda x: x['expected_eff'])
    op['expected_motor_power_kw'] = exp.apply(lambda x: x['expected_motor_power_kw'])
    # inferred hydraulic power
    op['hydraulic_power_kw'] = (op['flow_m3h']/3600.0) * 9.81 * op['expected_head_m'] * pump_master_map[next(iter(pump_master_map))]['fluid_density'] / 1000.0
    op['inferred_eff'] = op['hydraulic_power_kw'] / (op['motor_power_kw'] + 1e-6)
    op['delta_eff'] = op['inferred_eff'] - op['expected_eff']
    op['power_increase_pct'] = op['motor_power_kw'] / (op['expected_motor_power_kw'] + 1e-6) - 1.0
    
    # time_since_last_maintenance
    maint_df = maint_df.copy()
    maint_df['date'] = pd.to_datetime(maint_df['date'])
    
    # Convert maintenance dates to timezone-naive as well
    if maint_df['date'].dt.tz is not None:
        maint_df['date'] = maint_df['date'].dt.tz_localize(None)
    
    # naive approach: for each row find last maintenance date
    def last_maint_days(row):
        md = maint_df[(maint_df.pump_id==row.pump_id) & (maint_df.date <= row.timestamp)]
        if md.empty: return np.nan
        return (row.timestamp - md.date.max()).days
    op['days_since_last_maint'] = op.apply(last_maint_days, axis=1)
    
    # rolling stats by pump
    op = op.set_index('timestamp')
    grouped = op.groupby('pump_id', include_groups=False).apply(lambda df: df.assign(
        delta_eff_roll7 = df['delta_eff'].rolling('7D').mean(),
        motor_pow_std30 = df['motor_power_kw'].rolling('30D').std()
    )).reset_index(drop=True)
    return grouped
