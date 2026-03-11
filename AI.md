# AI Parts in This Project (Short)

All AI/ML used for pump predictive maintenance lives in the backend. No AI runs in the frontend.

---

## 1. Overview

| Part | What it does | Where |
|------|--------------|--------|
| **Anomaly detection** | Flags unusual operating points (ensemble: Isolation Forest + LOF + Elliptic Envelope) | `ai_models.AnomalyEnsemble`, `app.PredictiveMaintenanceAI` |
| **Sensor validation** | Clips/fills invalid sensor values so AI gets safe inputs | `ai_models.validate_and_clip_sensor` |
| **Feature engineering** | Builds head, efficiency, pressure_ratio, specific_energy, rolling mean/std from raw sensors | `app.FeatureEngineer` |
| **Health index** | Single 0–100 score from flow deviation, efficiency loss, power increase, anomaly | `app.PredictiveMaintenanceAI.calculate_health_index` |
| **RUL (Remaining Useful Life)** | Hours until critical with confidence interval (rul_hours, rul_lower, rul_upper) | `ai_models.rul_linear_and_exponential`, `app.predict_rul` |
| **Failure mode detection** | Identifies likely causes (impeller wear, cavitation, power, etc.) from baseline vs current | `app.PredictiveMaintenanceAI.detect_failure_modes` |
| **Feature importance** | Explains which inputs drive anomaly (permutation or tree) | `ai_models.permutation_importance_pump`, `tree_feature_importance` |

---

## 2. Where the code lives

- **`backend/ai_models.py`**  
  Anomaly ensemble (IF + LOF + Elliptic Envelope), sensor validation, single-point feature build, RUL (linear + exponential + CI), permutation/tree feature importance.

- **`backend/app.py`**  
  `FeatureEngineer`, `PredictiveMaintenanceAI` (trains per-pump models at startup), health index, RUL wrapper, failure modes, all API routes that call AI.

---

## 3. Anomaly detection

- **Training (startup):** Per pump: Isolation Forest + LOF + Elliptic Envelope on 10 features (flow, pressures, power, head, efficiency, pressure_ratio, specific_energy, flow rolling mean/std). Optional `RobustScaler` in `AnomalyEnsemble`.
- **Inference:** Sensor data → `validate_and_clip_sensor` → `build_single_point_features` → ensemble scores → weighted 0–1 anomaly score (default weights: 0.45 IF, 0.35 LOF, 0.2 EE). `is_anomaly = (score >= 0.5)`.
- **Fallback:** If no ensemble for a pump, single Isolation Forest from `app.py` is used when available; else anomaly_score = 0.

---

## 4. Health index

- Starts at 100; subtracts capped penalties: flow deviation (max 20), efficiency loss (max 25), power increase (max 20), anomaly score × 35 (max 35). Uses per-pump `baseline_stats` (flow_mean, efficiency_mean, power_mean). No baseline → returns 85.

---

## 5. RUL

- **With enough history:** `rul_linear_and_exponential` in `ai_models`: linear + exponential degradation on efficiency; critical threshold 50%; returns rul_hours, rul_lower, rul_upper; scaled by health and clamped.
- **Fallback:** Health-based bands (e.g. health > 80 → 800–1500 h) with ±30% spread; all clamped to MIN/MAX RUL hours.

---

## 6. Failure modes

- Rule-based vs baseline: flow drop (impeller/fouling), efficiency drop, power increase, low suction + high pressure ratio (cavitation), low health with no other cause (general degradation). Each returns type, severity, message, recommendation, confidence.

---

## 7. Feature importance

- When possible: permutation importance (shuffle each feature, measure change in anomaly score) via `permutation_importance_pump`. Fallback: tree `feature_importances_` from Isolation Forest. Exposed in `/api/pump/<id>/ml-outputs` and used in root-cause style logic.

---

## 8. API endpoints that use AI

| Endpoint | AI used |
|----------|---------|
| `GET /api/pump/<id>/overview` | Anomaly, health, RUL |
| `GET /api/pump/<id>/kpis` | Anomaly, health, RUL, baseline |
| `GET /api/pump/<id>/anomalies` | Anomaly, health, failure modes |
| `GET /api/pump/<id>/ml-outputs` | Anomaly, health, RUL+CI, failure modes, feature importance |
| `GET /api/pump/<id>/root-cause` | Anomaly, health, failure modes |
| `GET /api/pump/<id>/alerts` | Anomaly, health, failure modes, RUL |

---

## 9. Dependencies

- **Python:** 3.x  
- **Libraries:** `scikit-learn` (Isolation Forest, LOF, Elliptic Envelope, scalers), `numpy`, `pandas`, `flask`  
- No separate AI service; everything runs inside the Flask app.
