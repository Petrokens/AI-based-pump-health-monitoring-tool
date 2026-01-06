# AI-based Pump Health Monitoring Tool

## 1. Overview
An end-to-end predictive maintenance platform for centrifugal pump fleets. Combines rich CSV datasets, AI-driven analytics (Isolation Forest anomaly detection), and a modern React dashboard to deliver live KPIs, alerts, and historical playback.

## 2. Key Features
- Real-time health score, RUL, and anomaly detection per pump.
- Dynamic dashboards (KPIs, AI insights, maintenance history, alerts, reports).
- Manual start/stop controls with live runtime counters.
- Fast-forward timeline (100× playback) for accelerated 6-hour windows.
- Fully simulated dataset (~6 months) with realistic maintenance/failure logs.

## 3. Tech Stack
- **Frontend:** React + Vite, Tailwind-based styling, Recharts.
- **Backend:** Flask, pandas, numpy, scikit-learn (Isolation Forest), CORS-enabled API.
- **Data:** CSV-based (operation log, maintenance, failure, pump master).
- **Tooling:** Python scripts for data generation, npm for frontend builds.

## 4. Data Pipeline
1. `scripts/generate_new_data.py` builds pump catalog, maintenance/failure logs, and long-horizon operation logs.
2. Backend loads CSVs on startup, caches pandas DataFrames, and precomputes baseline stats.
3. Endpoints serve live snapshots, trends, maintenance history, and fast-forward series.
4. Frontend polls APIs every 1–3 seconds for live cards, while the fast-forward panel streams accelerated data.

## 5. Backend Endpoints
- `GET /api/pumps` – pump list + AI metrics.
- `GET /api/pump/<id>/realtime | kpis | overview | maintenance-history | runtime | fast-forward`.
- `GET /api/pump/<id>/trends | trend-signals | anomalies | vibration | thermal | electrical | hydraulic`.
- `POST /api/pump/<id>/control` – simulated start/stop actions.
- All endpoints accept JSON responses, with hours/signal filters where applicable.

## 6. Frontend Modules
- `src/App.jsx` orchestrates views, pump selection, and live polling.
- Dashboard components: `PumpOverview`, `PumpRuntimePanel`, `FastForwardPanel`, `RealtimeOperatingPanel`, `VibrationMechanical`, `ThermalDiagnostics`, `ElectricalHealth`, `HydraulicAlarms`, `MaintenanceHistory`, `KPICards`, `AIInsights`, etc.
- Service layer `src/services/api.js` centralizes Axios calls and timeouts (20s).

## 7. Fast-Forward Timeline (100×)
- Backend: `/api/pump/<id>/fast-forward?speed=100&window_hours=6`.
- Returns dense time-series slice (flow, pressure, RPM, power, status) plus metadata for playback duration.
- Frontend `FastForwardPanel` animates the series (0.4s steps) with simulated timestamps and progress.

## 8. Running the Project
```bash
# Data regeneration (optional but recommended)
python scripts/generate_new_data.py

# Backend
cd backend
python app.py   # API at http://localhost:5000/api/

# Frontend
cd frontend
npm install
npm run dev     # http://localhost:3000/, proxy to backend via /api
```

## 9. Troubleshooting
- **Timeouts:** Ensure backend is running; Axios timeout is 20s. Heavy dataset loads may take a few seconds.
- **Stale data:** Regenerate CSVs and restart backend.
- **CORS issues:** Vite dev server proxies `/api` to `http://localhost:5000`. For production, set `VITE_API_BASE_URL`.
- **Missing live updates:** Pump must be “running” (start via Manual Control). Fast-forward panel always plays using historical data.

## 10. Extensibility / Future Work
- Integrate MQTT/OPC-UA for real plant feeds.
- Deploy backend + frontend as containerized services.
- Add user auth, role-based dashboards, and alerting rules.
- Support additional equipment types (compressors, fans).
- Enhance AI models (LSTM forecasting, Bayesian Health Index).

## 11. Problem Statement
Industrial pump houses suffer unplanned downtime due to late detection of bearing, seal, or lubrication issues. Legacy systems rely on quarterly inspections, resulting in 5–10% production losses whenever a critical pump fails. Manual data collection also prevents centralized monitoring across pump fleets.

## 12. Solution Approach
- Continuous data capture every 15 minutes across 12 pumps (flow, pressures, RPM, vibration, temperatures).
- AI/ML health scoring (Isolation Forest) layered with rolling KPIs and anomaly explanations.
- Fast runtime counters and manual controls for operators.
- Accelerated fast-forward timeline (100×) to replay recent operating windows and spot anomalies quickly.
- React dashboard with rapid polling (1–3 s) + Flask API with preloaded pandas DataFrames for low-latency responses.

## 13. Benefits
- **Predictive insights:** Early warnings on efficiency drops, cavitation, lubrication defects.
- **Reduced downtime:** Diagnose issues before pump trips; manual control triggers immediate actions.
- **Operator efficiency:** Single dashboard covering runtime, maintenance, anomaly, and fast-forward views.
- **Auditability:** CSV-backed history for compliance and root-cause investigations.

## 14. Loss Avoidance & Income Impact
- Typical hydrocarbon plant loses \$50–100k per pump failure; proactive detection can avoid 4–6 failures/year → \$200–600k savings.
- Fast-forward timeline shortens troubleshooting cycles (minutes vs hours), accelerating plant restart.
- Data foundation enables new service offerings (predictive maintenance contracts) and monetizable insights.


