# AI-Based Pump Health Monitoring Platform  
## Module-Wise Documentation

**Document Version:** 1.0  
**Last Updated:** March 2025  
**Project:** Pump Predictive Maintenance (PdM) AI Platform

---

## 1. Project Overview

| Item | Description |
|------|--------------|
| **Project Name** | AI-Based Pump Health Monitoring Tool |
| **Type** | Predictive Maintenance (PdM) Web Platform |
| **Stack** | React + Vite + Tailwind (Frontend) · Flask + pandas + scikit-learn (Backend) |
| **Total Modules** | **12** (6 Frontend + 6 Backend) |

---

## 2. Module Count Summary

| # | Module | Layer | Tiles / Sub-items | Owner Role |
|---|--------|--------|-------------------|------------|
| 1 | Landing & Auth | Frontend | 1 tile | Frontend Dev |
| 2 | Pump Setup & Onboarding | Frontend | 5 steps (tiles) | Full-stack |
| 3 | Universal PdM Dashboard | Frontend | 8+ tiles | Frontend + Backend |
| 4 | Analytics & Insights | Frontend | 4 tiles | Frontend + Data |
| 5 | Alerts, Reports, Settings | Frontend | 3 tiles | Frontend Dev |
| 6 | Shared UI & Services | Frontend | 4 tiles | Frontend Dev |
| 7 | Setup & Data Ingestion API | Backend | 3 endpoints | Backend Dev |
| 8 | Pump Core API | Backend | 6 endpoints | Backend Dev |
| 9 | Analytics & ML API | Backend | 8 endpoints | Backend + ML Dev |
| 10 | Diagnostics & Alerts API | Backend | 5 endpoints | Backend Dev |
| 11 | AI/ML Engine | Backend | 1 module (shared) | ML Dev |
| 12 | Data & Config | Backend | CSV/Excel, config | Backend Dev |

---

## 3. Frontend Modules (Tiles & Details)

### Module 1: Landing & Auth  
**Route:** `/` (redirects to `/app/select-pump` when not logged in)

| Tile | Description |
|------|-------------|
| Landing Page | Login / entry; redirects to Pump Setup after auth |

**Files:** `LandingPage.jsx`  
**Timeline:** Phase 1 · **Team:** 1 Frontend developer

---

### Module 2: Pump Setup & Onboarding  
**Route:** `/app/select-pump`

| Step (Tile) | Description |
|-------------|-------------|
| 1. Category | Select pump category (e.g. centrifugal, multistage) |
| 2. Type | Select pump type and design standard |
| 3. Pump Master Data | Enter or upload pump master (CSV/Excel) |
| 4. Operation Log | Upload operation log (Excel/CSV) |
| 5. Maintenance Log | Upload maintenance log; then “Open Dashboard” |

**Files:** `PumpSelectionFlow.jsx`, `pumpTaxonomy.js`, `api.js` (setup endpoints)  
**Timeline:** Phase 1–2 · **Team:** 1 Full-stack developer

---

### Module 3: Universal PdM Dashboard  
**Route:** `/app/dashboard`

| Tile / Section | Description |
|----------------|-------------|
| Layer 1 – Pump Health | Status, Health Index, Failure %, RUL, AI Confidence |
| Alarm Overview | Normal / Warning / Alarm / Critical bands |
| Key Sensor Indicators | Suction/Discharge pressure, flow, motor current, temps, vibration, RPM (sensor-driven) |
| Layer 2 – Performance | Pump curve, efficiency, energy, hydraulic health |
| Layer 3 – Failure Diagnostics | Top 5 failure probabilities, signature detection, maintenance recommendations |
| Advanced AI Indicators | Sensor correlation, detectability, priority, shutdown risk, confidence |
| Health Index Band | 0–30 Critical, 30–60 Warning, 60–80 Moderate, 80–100 Healthy |
| Digital Twin | Expected vs actual (flow, head, power, deviation %) |
| Trend Analytics | Placeholder / link to Trend Explorer |
| Pump Failure Map | Clickable zones: Bearing, Seal, Impeller, Motor, Shaft |
| Fleet Monitoring | Total / Healthy / Warning / Critical pumps |

**Files:** `UniversalPdMDashboard.jsx`  
**Timeline:** Phase 2–3 · **Team:** 1 Frontend + 1 Backend (APIs)

---

### Module 4: Analytics & Insights  
**Routes:** `/app/analytics`, `/app/insights`, `/app/trends`

| Tile | Route | Description |
|------|--------|-------------|
| Analytics Dashboard | `/app/analytics` | Seal/bearing health, cavitation risk, efficiency, motor load, RUL, MTBF, operating envelope |
| AI Insights | `/app/insights` | ML outputs, root cause, AI insights panel |
| Trend Explorer | `/app/trends` | Historical trend charts (vibration, temp, flow, etc.) |

**Files:** `AnalyticsDashboard.jsx`, `MLOutputs.jsx`, `RootCausePanel.jsx`, `AIInsights.jsx`, `TrendExplorer.jsx`, `PerformanceChart.jsx`  
**Timeline:** Phase 2–3 · **Team:** 1 Frontend + 1 Backend/Data

---

### Module 5: Alerts, Reports, Settings  
**Routes:** `/app/alerts`, `/app/reports`, `/app/settings`

| Tile | Route | Description |
|------|--------|-------------|
| Alerts Workflow | `/app/alerts` | Alert list, severity, actions |
| Reports & KPIs | `/app/reports` | Reports and KPI views |
| Settings | `/app/settings` | API URL, theme, app configuration |

**Files:** `AlertsWorkflow.jsx`, `ReportsKPIs.jsx`, `Settings.jsx` (and settings subfolder)  
**Timeline:** Phase 2 · **Team:** 1 Frontend developer

---

### Module 6: Shared UI & Services  
**No direct route**

| Tile | Description |
|------|-------------|
| Header | Pump selector, last update, status |
| Sidebar | Navigation (Pump Setup, Dashboard, Analytics, Insights, Trends, Alerts, Reports, Settings) |
| Theme & Demo Context | Dark/light theme, demo timestamp |
| API Service | Centralized REST client, all endpoints |

**Files:** `Header.jsx`, `Sidebar.jsx`, `ThemeContext.jsx`, `DemoContext.jsx`, `api.js`, `ErrorBoundary.jsx`  
**Timeline:** Phase 1 · **Team:** 1 Frontend developer

---

## 4. Backend Modules (Endpoints & Details)

### Module 7: Setup & Data Ingestion API  
**Base path:** `/api/setup/*`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/setup/pump-master` | POST | Add pump master record (JSON) |
| `/api/setup/pump-master/upload` | POST | Upload pump master file (CSV/Excel) |
| `/api/setup/operation-log` | POST | Upload operation log (CSV/Excel) |
| `/api/setup/maintenance-log` | POST | Upload maintenance log (CSV/Excel) |

**Timeline:** Phase 1 · **Team:** 1 Backend developer

---

### Module 8: Pump Core API  
**Base path:** `/api/pump/<pump_id>/*` (core ops)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pumps` | GET | List all pumps with health |
| `/api/pump/<id>/runtime` | GET | Runtime state |
| `/api/pump/<id>/control` | POST | Control action |
| `/api/pump/<id>/realtime` | GET | Real-time readings |
| `/api/pump/<id>/overview` | GET | Full overview (health, RUL, status, master) |
| `/api/dashboard/summary` | GET | Fleet summary (total, normal, warning, critical) |

**Timeline:** Phase 1–2 · **Team:** 1 Backend developer

---

### Module 9: Analytics & ML API  
**Base path:** `/api/pump/<pump_id>/*` (analytics)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pump/<id>/kpis` | GET | KPIs |
| `/api/pump/<id>/trends` | GET | Trend data |
| `/api/pump/<id>/fast-forward` | GET | Fast-forward playback series |
| `/api/pump/<id>/demo-simulation` | GET | Demo simulation data |
| `/api/pump/<id>/anomalies` | GET | Anomaly list |
| `/api/pump/<id>/performance-curve` | GET | Performance curve |
| `/api/pump/<id>/ml-outputs` | GET | ML outputs (health, RUL, failure modes) |
| `/api/pump/<id>/trend-signals` | GET | Trend signals (multi-signal, hours) |

**Timeline:** Phase 2–3 · **Team:** 1 Backend + 1 ML developer

---

### Module 10: Diagnostics & Alerts API  
**Base path:** `/api/pump/<pump_id>/*` (diagnostics)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pump/<id>/vibration` | GET | Vibration & mechanical health |
| `/api/pump/<id>/thermal` | GET | Thermal data |
| `/api/pump/<id>/electrical` | GET | Electrical (current, power) |
| `/api/pump/<id>/hydraulic` | GET | Hydraulic (flow, pressure, cavitation) |
| `/api/pump/<id>/maintenance-metrics` | GET | MTBF and maintenance metrics |
| `/api/pump/<id>/maintenance-history` | GET | Maintenance history |
| `/api/pump/<id>/root-cause` | GET | Root cause analysis |
| `/api/pump/<id>/alerts` | GET | Alerts list |
| `/api/pump/<id>/reports` | GET | Reports |

**Timeline:** Phase 2–3 · **Team:** 1 Backend developer

---

### Module 11: AI/ML Engine (Shared)  
**No direct route – used by other backend modules**

| Component | Description |
|-----------|-------------|
| Anomaly prediction | Isolation Forest, feature set, threshold |
| Health index | Per-pump health score 0–100 |
| RUL prediction | Remaining useful life (hours) |
| Failure-mode probabilities | Seal, bearing, cavitation, etc. |

**Files:** Logic inside `app.py` (e.g. `ai_predictor`, `RealDataProvider`)  
**Timeline:** Phase 2–3 · **Team:** 1 ML / Backend developer

---

### Module 12: Data & Config  
**No REST API – file/system**

| Item | Description |
|------|-------------|
| Pump master | CSV/Excel (pump metadata) |
| Operation log | CSV/Excel (time-series operation data) |
| Maintenance log | CSV/Excel (maintenance events) |
| Config / env | API URL, CORS, paths |

**Timeline:** Phase 1 · **Team:** 1 Backend developer

---

## 5. Timeline (Phases)

| Phase | Duration | Focus | Modules |
|-------|----------|--------|---------|
| **Phase 1** | 4–6 weeks | Foundation: Auth, Setup flow, Core API, Shared UI, Data ingestion | M1, M2, M6, M7, M8 (partial), M12 |
| **Phase 2** | 4–6 weeks | Dashboard, Analytics UI, Diagnostics API, ML API | M3, M4, M8 (rest), M9, M10 |
| **Phase 3** | 2–4 weeks | AI/ML tuning, Fleet view, Failure map, Reports, Polish | M3 (enhance), M4, M9, M10, M11 |

**Total estimated timeline:** 10–16 weeks (2.5–4 months) for core platform.

---

## 6. Team Size & Roles

### Recommended Team

| Role | Count | Responsibility |
|------|--------|----------------|
| **Frontend Developer** | 1 | React/Vite UI, dashboard tiles, setup flow, alerts/reports/settings, shared components |
| **Backend Developer** | 1 | Flask API, setup ingestion, pump core, diagnostics endpoints, data layer |
| **ML / Data Developer** | 1 | Health index, RUL, anomaly detection, failure-mode models, trend/analytics APIs |
| **Tech Lead / Full-Stack** | 0.5 (optional) | Architecture, code review, integration, deployment |

**Total:** **2.5–3** developers (can be 2 if one person does backend + ML).

### Role Matrix (Who Does What)

| Module | Frontend | Backend | ML/Data |
|--------|----------|---------|---------|
| M1 Landing | ● | | |
| M2 Pump Setup | ● | ● | |
| M3 Dashboard | ● | ● | ○ |
| M4 Analytics & Insights | ● | ● | ● |
| M5 Alerts, Reports, Settings | ● | ● | |
| M6 Shared UI & Services | ● | | |
| M7 Setup API | | ● | |
| M8 Pump Core API | | ● | ○ |
| M9 Analytics & ML API | | ● | ● |
| M10 Diagnostics API | | ● | ○ |
| M11 AI/ML Engine | | ○ | ● |
| M12 Data & Config | | ● | |

● Primary · ○ Support

---

## 7. Tiles per Module (Quick Reference)

| Module | Number of Tiles / Endpoints |
|--------|-----------------------------|
| M1 Landing | 1 |
| M2 Pump Setup | 5 (steps) |
| M3 Dashboard | 11 (sections/tiles) |
| M4 Analytics & Insights | 4 (Analytics, ML, Root Cause, Trends) |
| M5 Alerts, Reports, Settings | 3 |
| M6 Shared UI & Services | 4 |
| M7 Setup API | 4 endpoints |
| M8 Pump Core API | 6 endpoints |
| M9 Analytics & ML API | 8 endpoints |
| M10 Diagnostics API | 9 endpoints |
| M11 AI/ML Engine | 1 (shared logic) |
| M12 Data & Config | 1 (data layer) |

---

## 8. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2025 | Initial module-wise documentation, tiles, timeline, team and roles |

---

*This document should be updated when new modules or tiles are added or when timeline and roles change.*
