# Sample Pump Excel Files (2 Pumps × 3 Files)

Use these files in the app’s **Pump Setup** flow: upload the 3 files per pump (master, operation log, maintenance log) to load data and open the dashboard.

## Pump 1 – Centrifugal (End Suction Overhung)

| File | Description |
|------|-------------|
| **pump_master.xlsx** | One row: pump_id `SAMPLE-01`, Centrifugal Process Pump, End Suction Overhung, API 610 OH1 / ISO 13709, ISO 5199 |
| **operation_log.xlsx** | 50 rows: timestamp, pump_id, flow_m3h, pressures, rpm, motor_power_kw, vibration_mm_s, bearing_temp_c, displacement_um, status |
| **maintenance_log.xlsx** | 12 rows: date, pump_id, action, component, notes, downtime_hours |

**Folder:** `pump_1_centrifugal/`

## Pump 2 – Reciprocating (Triplex / Quintuplex)

| File | Description |
|------|-------------|
| **pump_master.xlsx** | One row: pump_id `SAMPLE-02`, Reciprocating Plunger Pump, Triplex / Quintuplex, API 674 |
| **operation_log.xlsx** | 50 rows: same columns as above for `SAMPLE-02` |
| **maintenance_log.xlsx** | 12 rows: same columns as above for `SAMPLE-02` |

**Folder:** `pump_2_reciprocating/`

## Column reference

- **pump_master:** pump_id, pump_type, pump_type_detail, manufacturer, model, installation_date, rated_power_kw, rated_flow_m3h, rated_head_m, flow_range_min/max_m3h, head_range_min/max_m, rated_rpm, seal_type, bearing_type_de/nde, impeller_type, location, criticality_level, serial_number, warranty_expiry, last_overhaul, min/max_safe_flow_m3h, max_motor_load_kw, max_suction_pressure_bar, efficiency_bep_percent, npshr_m, health_score  
- **operation_log:** timestamp, pump_id, flow_m3h, discharge_pressure_bar, suction_pressure_bar, rpm, motor_power_kw, vibration_mm_s, bearing_temp_c, displacement_um, status  
- **maintenance_log:** date, pump_id, action, component, notes, downtime_hours  

To regenerate these files, run from the backend directory:

```bash
python scripts/generate_sample_pump_excel.py
```
