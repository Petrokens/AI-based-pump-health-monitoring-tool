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
    with path.open("w", newline="") as fh:
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
    actions = ["inspect", "calibrate", "repair", "replace", "clean"]
    components = [
        "bearing",
        "seal",
        "impeller",
        "coupling",
        "motor",
        "alignment",
        "lubricant",
        "general",
        "suction strainer",
    ]
    notes = [
        "Quarterly PM completed",
        "Thermal imaging performed",
        "Vibration above alert threshold",
        "Seal flush optimized",
        "Spare kit issued",
        "No anomalies",
        "Oil sample sent to lab",
        "Rotor balanced on site",
        "Soft foot corrected",
        "Wireless sensor replaced",
    ]

    entries = []
    day = datetime(2027, 1, 8)
    for offset in range(0, 360, 5):
        date = day + timedelta(days=offset)
        for _ in range(RNG.choice([1, 1, 2])):
            pump = RNG.choice(pumps)
            entries.append(
                [
                    date.strftime("%Y-%m-%d"),
                    pump["pump_id"],
                    RNG.choice(actions),
                    RNG.choice(components),
                    RNG.choice(notes),
                    RNG.choice([0, 1, 2, 4, 6, 8, 12]),
                ]
            )
    entries.sort()
    path = BASE_DIR / "maintenance_log.csv"
    with path.open("w", newline="") as fh:
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
    with path.open("w", newline="") as fh:
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
    start = datetime(2027, 7, 1, 6, 0)
    interval = timedelta(minutes=15)
    statuses = ["running", "running", "running", "alarm", "standby", "maintenance"]
    rows = []

    for pump in pumps:
        rpm_nom = 1480 if pump["rated_flow"] < 200 else 1500
        ts = start
        for _ in range(24 * 4 * 10):  # 10 days @ 15-min resolution
            status = RNG.choices(statuses, weights=[78, 8, 6, 4, 3, 1])[0]
            flow = max(0, RNG.gauss(pump["rated_flow"] * 0.86, pump["rated_flow"] * 0.07))
            if status == "standby":
                flow *= 0.15
            elif status in {"maintenance", "alarm"}:
                flow *= 0.4
            discharge = max(0.6, pump["rated_head"] / 9.8 + RNG.uniform(-0.7, 0.8))
            suction = max(0.1, discharge - RNG.uniform(2.4, 3.1))
            rpm = rpm_nom + RNG.uniform(-55, 55)
            power = max(6.0, pump["rated_power"] * 0.68 + RNG.uniform(-6, 7))
            vibration = round(RNG.uniform(1.1, 4.4), 2)
            bearing_temp = round(RNG.uniform(46, 84), 1)
            displacement = round(RNG.uniform(28, 70), 1)
            rows.append(
                [
                    ts.isoformat(),
                    pump["pump_id"],
                    round(flow, 2),
                    round(discharge, 2),
                    round(suction, 2),
                    round(rpm, 1),
                    round(power, 2),
                    vibration,
                    bearing_temp,
                    displacement,
                    status,
                ]
            )
            ts += interval

    rows.sort(key=lambda r: r[0])
    path = BASE_DIR / "operation_log.csv"
    with path.open("w", newline="") as fh:
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


