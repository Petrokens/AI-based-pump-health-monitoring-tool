"""
Utility script to generate realistic pump master, maintenance, failure and
operation logs for the demo application. The values are based on publicly
available process pump data sheets from major OEMs (Flowserve, Sulzer, KSB,
Goulds, etc.) to make the dataset feel closer to real plant data.
"""

from __future__ import annotations

import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

BASE_DIR = Path("backend/data")
RAW_DIR = BASE_DIR / "raw"
RNG = random.Random(42)


def ensure_dirs() -> None:
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def build_pump_catalog() -> List[dict]:
    return [
        dict(
            pump_id="PU-201A",
            model="Flowserve Mark 3 (3x4-10)",
            rated_flow=190,
            rated_head=53,
            rated_power=55,
            impeller=254,
            vendor="Flowserve",
            fluid_density=998,
        ),
        dict(
            pump_id="PU-202B",
            model="Sulzer AHLSTAR A43-125",
            rated_flow=160,
            rated_head=48,
            rated_power=45,
            impeller=305,
            vendor="Sulzer",
            fluid_density=998,
        ),
        dict(
            pump_id="PU-203C",
            model="KSB MegaCPK 150-400",
            rated_flow=260,
            rated_head=67,
            rated_power=90,
            impeller=360,
            vendor="KSB",
            fluid_density=1000,
        ),
        dict(
            pump_id="PU-204A",
            model="Goulds 3196 (3x4-13)",
            rated_flow=220,
            rated_head=60,
            rated_power=75,
            impeller=356,
            vendor="ITT Goulds",
            fluid_density=998,
        ),
        dict(
            pump_id="PU-205D",
            model="Grundfos NB 80-200/216",
            rated_flow=170,
            rated_head=45,
            rated_power=55,
            impeller=270,
            vendor="Grundfos",
            fluid_density=998,
        ),
        dict(
            pump_id="PU-206E",
            model="Ruhrpumpen CPP 100-250",
            rated_flow=140,
            rated_head=42,
            rated_power=48,
            impeller=285,
            vendor="Ruhrpumpen",
            fluid_density=1000,
        ),
        dict(
            pump_id="PU-207F",
            model="Ebara GSD 200-300",
            rated_flow=300,
            rated_head=78,
            rated_power=110,
            impeller=400,
            vendor="Ebara",
            fluid_density=1005,
        ),
        dict(
            pump_id="PU-208G",
            model="Andritz ACP 150-350",
            rated_flow=240,
            rated_head=65,
            rated_power=95,
            impeller=375,
            vendor="Andritz",
            fluid_density=1000,
        ),
        dict(
            pump_id="PU-209H",
            model="Warman SHW 150",
            rated_flow=180,
            rated_head=55,
            rated_power=88,
            impeller=365,
            vendor="Weir Minerals",
            fluid_density=1030,
        ),
        dict(
            pump_id="PU-210J",
            model="Wilo CronoLine-IL 65/175",
            rated_flow=120,
            rated_head=32,
            rated_power=32,
            impeller=230,
            vendor="Wilo",
            fluid_density=998,
        ),
        dict(
            pump_id="PU-211K",
            model="KSB Etanorm SYT 125-250",
            rated_flow=210,
            rated_head=58,
            rated_power=78,
            impeller=340,
            vendor="KSB",
            fluid_density=980,
        ),
        dict(
            pump_id="PU-212L",
            model="Sulzer SNS 200-500",
            rated_flow=320,
            rated_head=86,
            rated_power=125,
            impeller=415,
            vendor="Sulzer",
            fluid_density=1002,
        ),
    ]


def render_pump_master(pumps: List[dict]) -> None:
    path = BASE_DIR / "pump_master.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            [
                "pump_id",
                "model",
                "rated_flow_m3h",
                "rated_head_m",
                "rated_power_kw",
                "impeller_dia_mm",
                "vendor",
                "head_curve_flow",
                "head_curve_head",
                "eff_curve_flow",
                "eff_curve_eff",
                "fluid_density",
            ]
        )
        for p in pumps:
            flow_curve = [
                0,
                round(p["rated_flow"] * 0.4, 1),
                round(p["rated_flow"] * 0.75, 1),
                p["rated_flow"],
            ]
            head_curve = [
                round(p["rated_head"] * 1.22, 1),
                round(p["rated_head"] * 1.05, 1),
                round(p["rated_head"] * 0.82, 1),
                round(p["rated_head"] * 0.58, 1),
            ]
            eff_flow = [
                round(p["rated_flow"] * 0.2, 1),
                round(p["rated_flow"] * 0.5, 1),
                round(p["rated_flow"] * 0.85, 1),
                p["rated_flow"],
            ]
            eff_vals = [
                RNG.randint(24, 30),
                RNG.randint(55, 61),
                RNG.randint(68, 75),
                RNG.randint(62, 69),
            ]
            writer.writerow(
                [
                    p["pump_id"],
                    p["model"],
                    p["rated_flow"],
                    p["rated_head"],
                    p["rated_power"],
                    p["impeller"],
                    p["vendor"],
                    json.dumps(flow_curve),
                    json.dumps(head_curve),
                    json.dumps(eff_flow),
                    json.dumps(eff_vals),
                    p["fluid_density"],
                ]
            )


def build_maintenance_log(pumps: List[dict]) -> None:
    """Create a log aligned with API-610 route tasks performed at real sites."""

    site_programs = [
        dict(
            pump_id="PU-201A",
            freq_days=14,
            actions=["inspect", "clean", "repair"],
            components=["seal", "impeller", "alignment", "lubricant"],
            notes=[
                "Seal Plan 32 flow verified against refinery spec",
                "Shaft alignment checked after turbine outage",
                "Lubricant sample sent to Chevron ASTM D4378 panel",
                "Impeller clearance reset per OEM tolerance",
            ],
        ),
        dict(
            pump_id="PU-202B",
            freq_days=21,
            actions=["inspect", "calibrate", "replace"],
            components=["bearing", "motor", "suction strainer"],
            notes=[
                "Route vibration per API 610 collected (2.8 mm/s overall)",
                "Motor IR scan performed, no hot spots",
                "Bearing oil topped up with ISO 46 VG",
                "Suction basket flushed after filter DP alarm",
            ],
        ),
        dict(
            pump_id="PU-203C",
            freq_days=18,
            actions=["inspect", "repair", "replace"],
            components=["coupling", "seal", "bearing"],
            notes=[
                "Laser alignment with Fixturlaser XA (within 0.05 mm)",
                "Cartridge seal faces dressed and leak-tested",
                "Thrust bearing temperature trending 3 degC high",
                "Coupling elastomer spider swapped due to cracks",
            ],
        ),
        dict(
            pump_id="PU-204A",
            freq_days=16,
            actions=["inspect", "clean", "calibrate"],
            components=["motor", "impeller", "lubricant"],
            notes=[
                "Motor insulation DAR ratio recorded 1.6 (acceptable)",
                "Impeller wear ring clearance checked with taper gauge",
                "Oil mist console differential pressure adjusted",
                "Thermography noted 4 degC delta on DE bearing",
            ],
        ),
        dict(
            pump_id="PU-205D",
            freq_days=28,
            actions=["inspect", "repair", "replace"],
            components=["seal", "bearing", "general"],
            notes=[
                "Plan 11 flush restriction orifice cleaned",
                "Bearing housing desiccant breather replaced",
                "Lubrication checklist signed by Unit 300 operator",
            ],
        ),
        dict(
            pump_id="PU-206E",
            freq_days=30,
            actions=["inspect", "calibrate", "clean"],
            components=["alignment", "coupling", "suction strainer"],
            notes=[
                "Soft-foot eliminated after skid grout crack repair",
                "Spacer coupling bolts retorqued to 95 ft-lbf",
                "Strainer differential reset after catalyst fines flush",
            ],
        ),
        dict(
            pump_id="PU-207F",
            freq_days=20,
            actions=["inspect", "repair", "replace"],
            components=["motor", "bearing", "seal"],
            notes=[
                "High-energy vibration at 1x RPM investigated",
                "Motor winding surge test performed post rewind",
                "Seal flush conductivity matched condensate spec",
            ],
        ),
        dict(
            pump_id="PU-208G",
            freq_days=24,
            actions=["inspect", "clean", "calibrate"],
            components=["impeller", "alignment", "lubricant"],
            notes=[
                "Impeller balancing weights verified after shop run",
                "Alignment check after suction header supports fixed",
                "Lube oil varnish potential measured (MPC=18)",
            ],
        ),
        dict(
            pump_id="PU-209H",
            freq_days=19,
            actions=["inspect", "repair", "replace"],
            components=["bearing", "seal", "impeller"],
            notes=[
                "Bearing housing vibration dropped below 3 mm/s",
                "Seal support pot level corrected to 70%",
                "Impeller vane leading edge blended to remove pitting",
            ],
        ),
        dict(
            pump_id="PU-210J",
            freq_days=32,
            actions=["inspect", "clean"],
            components=["bearing", "general", "lubricant"],
            notes=[
                "Skid drains cleared of condensate",
                "Split bearing shells inspected for wipe marks",
                "Operator completed lube round (ISO 22 synthetic)",
            ],
        ),
        dict(
            pump_id="PU-211K",
            freq_days=12,
            actions=["inspect", "repair", "replace", "calibrate"],
            components=["alignment", "coupling", "seal", "bearing"],
            notes=[
                "API 610 route found axial vibration high, filter added",
                "Coupling hub fretting cleaned and anti-seize applied",
                "Seal plan 53A bladder charged to 30 psig",
                "Bearing pad thermocouples re-zeroed",
            ],
        ),
        dict(
            pump_id="PU-212L",
            freq_days=14,
            actions=["inspect", "calibrate", "clean"],
            components=["motor", "seal", "suction strainer"],
            notes=[
                "Motor current signature analysis (no bar defects)",
                "Seal pot nitrogen header leak repaired",
                "Strainer pulled due to high fines load",
            ],
        ),
    ]

    entries = []
    for program in site_programs:
        date = datetime(2027, 1, RNG.randint(3, 10))
        # Generate entries through end of 2028 for current data
        while date <= datetime(2028, 12, 31):
            entries.append(
                [
                    date.strftime("%Y-%m-%d"),
                    program["pump_id"],
                    RNG.choice(program["actions"]),
                    RNG.choice(program["components"]),
                    RNG.choice(program["notes"]),
                    RNG.choice([0, 1, 2, 4, 6, 8, 12]),
                ]
            )
            date += timedelta(days=program["freq_days"] + RNG.randint(-3, 3))

    entries.sort()
    path = BASE_DIR / "maintenance_log.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["date", "pump_id", "action", "component", "notes", "downtime_hours"]
        )
        writer.writerows(entries)


def build_failure_log(pumps: List[dict]) -> None:
    modes = ["bearing", "seal", "motor", "impeller", "coupling", "electrical", "vibration"]
    causes = [
        "lubrication loss",
        "abrasive ingress",
        "cavitation damage",
        "overheating",
        "alignment drift",
        "winding insulation breakdown",
        "process upset",
    ]
    parts = {
        "bearing": "Bearing cartridge",
        "seal": "Mechanical seal kit",
        "motor": "Motor stator",
        "impeller": "Impeller casting",
        "coupling": "Flexible coupling",
        "electrical": "VFD module",
        "vibration": "Sensor package",
    }

    records = []
    start = datetime(2027, 5, 1)
    for _ in range(18):
        date = start + timedelta(days=RNG.randint(0, 200))
        pump = RNG.choice(pumps)
        mode = RNG.choice(modes)
        cause = RNG.choice(causes)
        records.append(
            [
                date.strftime("%Y-%m-%d"),
                pump["pump_id"],
                mode,
                cause,
                parts[mode],
                RNG.randint(6, 20),
                RNG.randint(3200, 11000),
            ]
        )
    records.sort()
    path = RAW_DIR / "failure_data.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            [
                "failure_date",
                "pump_id",
                "failure_mode",
                "root_cause",
                "parts_replaced",
                "downtime_hours",
                "cost_usd",
            ]
        )
        writer.writerows(records)


def build_operation_log(pumps: List[dict]) -> None:
    """Craft ~6 months of historian-style samples with profile events per pump."""

    headers = [
        "timestamp",
        "pump_id",
        "flow_m3h",
        "discharge_pressure_bar",
        "suction_pressure_bar",
        "rpm",
        "motor_power_kw",
        "vibration_mm_s",
        "bearing_temp_c",
        "displacement_um",
        "status",
    ]

    start = datetime(2027, 1, 1, 0, 0)
    interval = timedelta(minutes=15)
    samples_per_day = int(timedelta(days=1) / interval)
    horizon_days = 180  # ~6 months
    total_samples = samples_per_day * horizon_days

    base_status_weights = {
        "running": 75,
        "standby": 8,
        "maintenance": 5,
        "alarm": 5,
        "trip": 3,
        "startup": 4,
    }

    rows = []

    for pump in pumps:
        rpm_nom = 1485 if pump["rated_flow"] < 200 else 1505
        discharge_nom = pump["rated_head"] / 9.81
        suction_nom = max(0.5, discharge_nom - 2.6)
        flow_nom = pump["rated_flow"] * 0.88
        power_nom = pump["rated_power"] * 0.7

        # Planned windows for downtime/alarms
        windows = []
        for _ in range(RNG.randint(2, 4)):
            start_idx = RNG.randint(0, total_samples - samples_per_day)
            duration = RNG.randint(4, 24)
            forced_status = RNG.choice(["maintenance", "alarm", "trip", "standby"])
            windows.append((start_idx, start_idx + duration, forced_status))

        vibration_drift = RNG.uniform(-0.05, 0.08)
        temp_bias = RNG.uniform(-2.0, 3.5)

        ts = start
        for idx in range(total_samples):
            status_override = None
            for w_start, w_end, forced in windows:
                if w_start <= idx <= w_end:
                    status_override = forced
                    break
            if status_override:
                status = status_override
            else:
                status = RNG.choices(
                    list(base_status_weights.keys()),
                    weights=list(base_status_weights.values()),
                )[0]

            mode = RNG.choice(["normal", "recycle", "low_suction", "high_head"])
            flow = RNG.gauss(flow_nom, pump["rated_flow"] * 0.07)
            discharge = RNG.gauss(discharge_nom, 0.35)
            suction = RNG.gauss(suction_nom, 0.25)
            power = RNG.gauss(power_nom, pump["rated_power"] * 0.06)

            if mode == "recycle":
                flow *= 0.7
                suction += 0.3
            elif mode == "low_suction":
                suction -= 0.8
            elif mode == "high_head":
                discharge += 0.6
                power += 5

            if status == "standby":
                flow *= 0.12
                power = max(2.5, power * 0.3)
            elif status in {"maintenance", "trip"}:
                flow = 0.0
                power = 0.0
                rpm = 0.0
            elif status == "alarm":
                flow *= 0.6
                power *= 0.8
                suction -= 0.4
                discharge -= 0.5
            elif status == "startup":
                flow *= 0.4
                power *= 0.5
                rpm = rpm_nom * 0.6 + RNG.uniform(-40, 40)
            else:
                rpm = rpm_nom + RNG.uniform(-45, 45)

            if status not in {"maintenance", "trip"} and status != "startup":
                rpm = rpm_nom + RNG.uniform(-45, 45)

            vibration = 2.1 + vibration_drift * (idx / total_samples) + RNG.uniform(
                -0.4, 0.8
            )
            vibration = max(0.4, round(vibration, 2))
            bearing_temp = (
                58 + temp_bias + RNG.uniform(-6, 6) + (0.8 if status == "alarm" else 0.0)
            )
            displacement = max(10.0, RNG.gauss(42, 8))

            suction = max(0.05, suction)
            discharge = max(suction + 0.3, discharge)
            flow = max(0.0, flow)
            power = max(0.0, power)

            rows.append(
                [
                    ts.isoformat(),
                    pump["pump_id"],
                    round(flow, 2),
                    round(discharge, 2),
                    round(suction, 2),
                    round(rpm, 1) if status not in {"maintenance", "trip"} else 0.0,
                    round(power, 2),
                    vibration,
                    round(bearing_temp, 1),
                    round(displacement, 1),
                    status,
                ]
            )
            ts += interval

    rows.sort(key=lambda r: (r[0], r[1]))
    path = BASE_DIR / "operation_log.csv"
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(headers)
        writer.writerows(rows)


def main() -> None:
    ensure_dirs()
    pumps = build_pump_catalog()
    render_pump_master(pumps)
    build_maintenance_log(pumps)
    build_failure_log(pumps)
    build_operation_log(pumps)


if __name__ == "__main__":
    main()


