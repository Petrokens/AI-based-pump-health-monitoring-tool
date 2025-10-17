import json
import numpy as np

def load_pump_master(row):
    # row: dict from pump_master.csv
    # Handle column names with spaces
    head_curve_flow_col = 'head_curve_flow' if 'head_curve_flow' in row else ' head_curve_flow'
    head_curve_head_col = 'head_curve_head' if 'head_curve_head' in row else ' head_curve_head'
    eff_curve_flow_col = 'eff_curve_flow' if 'eff_curve_flow' in row else ' eff_curve_flow'
    eff_curve_eff_col = 'eff_curve_eff' if 'eff_curve_eff' in row else ' eff_curve_eff'
    fluid_density_col = 'fluid_density' if 'fluid_density' in row else ' fluid_density'
    
    row['head_flow'] = np.array(json.loads(row[head_curve_flow_col]))
    row['head_head'] = np.array(json.loads(row[head_curve_head_col]))
    row['eff_flow']  = np.array(json.loads(row[eff_curve_flow_col]))
    row['eff_eff']   = np.array(json.loads(row[eff_curve_eff_col]))
    row['fluid_density'] = float(row.get(fluid_density_col, 1000))
    return row

def pump_performance(flow_m3h, pump_master, rpm=None, rated_rpm=1450):
    # flow in m3/h -> convert to m3/s for hydraulic power calc when needed
    flow = float(flow_m3h)
    head = float(np.interp(flow, pump_master['head_flow'], pump_master['head_head']))
    eff = float(np.interp(flow, pump_master['eff_flow'], pump_master['eff_eff'])) / 100.0
    if rpm and rpm != rated_rpm:
        # apply affinity (speed) scaling
        scale = (rpm / rated_rpm)
        head *= scale**2
        flow *= scale
    # hydraulic power (kW) = Q(m3/s) * g * H(m) * rho / 1000
    hydraulic_power_kw = (flow/3600.0) * 9.81 * head * pump_master['fluid_density'] / 1000.0
    motor_power_kw = hydraulic_power_kw / (eff + 1e-6)
    return {'expected_head_m': head, 'expected_eff': eff, 'expected_motor_power_kw': motor_power_kw, 'hydraulic_power_kw': hydraulic_power_kw}
