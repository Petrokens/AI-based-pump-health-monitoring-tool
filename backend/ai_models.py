"""
Extended AI/ML models for pump predictive maintenance.
- Multiple anomaly detectors (Isolation Forest, LOF, Elliptic Envelope) with ensemble.
- RUL with linear + exponential degradation and confidence intervals.
- Permutation-based feature importance.
- Sensor data validation and robust scaling option.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import StandardScaler, RobustScaler
import logging

logger = logging.getLogger("pump-api.ai")

# Feature columns used by anomaly models (must match FeatureEngineer output)
FEATURE_COLS = [
    'flow_m3h', 'discharge_pressure_bar', 'suction_pressure_bar',
    'motor_power_kw', 'head_m', 'efficiency', 'pressure_ratio',
    'specific_energy', 'flow_m3h_rolling_mean', 'flow_m3h_rolling_std'
]

# Reasonable physical bounds for validation (broad limits)
SENSOR_BOUNDS = {
    'flow_m3h': (0.1, 10000),
    'discharge_pressure_bar': (0.0, 100),
    'suction_pressure_bar': (0.0, 50),
    'motor_power_kw': (0.01, 5000),
}


def validate_and_clip_sensor(sensor_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and clip sensor values to physical bounds; fill missing with safe defaults."""
    out = dict(sensor_data)
    for key, (lo, hi) in SENSOR_BOUNDS.items():
        if key not in out or out[key] is None or (isinstance(out[key], float) and np.isnan(out[key])):
            if key == 'flow_m3h':
                out[key] = 100.0
            elif key == 'motor_power_kw':
                out[key] = 20.0
            elif 'pressure' in key:
                out[key] = 2.0 if 'suction' in key else 4.0
            else:
                out[key] = (lo + hi) / 2
        else:
            try:
                v = float(out[key])
                out[key] = max(lo, min(hi, v))
            except (TypeError, ValueError):
                out[key] = (lo + hi) / 2
    return out


def build_single_point_features(sensor_data: Dict[str, Any]) -> np.ndarray:
    """Build 1-row feature vector for anomaly prediction (same as training)."""
    flow = sensor_data['flow_m3h']
    dp = sensor_data['discharge_pressure_bar']
    sp = sensor_data['suction_pressure_bar']
    power = sensor_data['motor_power_kw']
    head_m = (dp - sp) * 10.2
    hyd_power = (flow * head_m) / 367
    motor_safe = power if power and power != 0 else 0.1
    efficiency = (hyd_power / motor_safe) * 100
    efficiency = max(0, min(100, efficiency))
    pressure_ratio = dp / (sp + 0.1)
    specific_energy = motor_safe / (flow + 0.1)
    return np.array([[
        flow, dp, sp, power, head_m, efficiency, pressure_ratio,
        specific_energy, flow, 0.0  # rolling mean = current, rolling std = 0
    ]])


def score_to_probability_01(score: float, is_lof: bool = False) -> float:
    """Map detector raw score to 0-1 anomaly probability (higher = more anomalous)."""
    if is_lof:
        # LOF: negative_outlier_factor_; more negative = more anomalous. Typical range ~[-2, 0].
        return float(1 / (1 + np.exp(-score)))  # sigmoid on (-score) so high LOF -> high prob
    # IF / Elliptic: score_samples; more negative = more anomalous
    return float(1 / (1 + np.exp(score)))


class AnomalyEnsemble:
    """Train and run multiple anomaly detectors; combine scores for robust prediction."""

    def __init__(self, use_robust_scaler: bool = False, weights: Optional[Dict[str, float]] = None):
        self.use_robust_scaler = use_robust_scaler
        self.weights = weights or {"isolation_forest": 0.45, "lof": 0.35, "elliptic": 0.2}
        self.detectors = {}   # pump_id -> { "if", "lof", "ee", "scaler" }
        self.feature_cols = FEATURE_COLS

    def train(
        self,
        pump_id: str,
        X: np.ndarray,
        contamination: float = 0.1,
        n_estimators_if: int = 80,
        n_neighbors_lof: int = 20,
    ) -> bool:
        """Train Isolation Forest, LOF, and Elliptic Envelope for one pump."""
        if X.shape[0] < 10:
            return False
        try:
            scaler = RobustScaler() if self.use_robust_scaler else StandardScaler()
            X_scaled = scaler.fit_transform(X)

            iso_forest = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=n_estimators_if,
                n_jobs=-1,
            )
            iso_forest.fit(X_scaled)

            lof = LocalOutlierFactor(
                n_neighbors=min(n_neighbors_lof, X.shape[0] - 1),
                contamination=contamination,
                novelty=True,
                n_jobs=-1,
            )
            lof.fit(X_scaled)

            elliptic = EllipticEnvelope(
                contamination=contamination,
                random_state=42,
            )
            elliptic.fit(X_scaled)

            self.detectors[pump_id] = {
                "if": iso_forest,
                "lof": lof,
                "ee": elliptic,
                "scaler": scaler,
            }
            return True
        except Exception as e:
            logger.warning("AnomalyEnsemble train failed for %s: %s", pump_id, e)
            return False

    def predict(self, pump_id: str, X: np.ndarray) -> Dict[str, Any]:
        """Return ensemble anomaly score and per-model scores."""
        if pump_id not in self.detectors:
            return {
                "anomaly_score": 0.0,
                "is_anomaly": False,
                "confidence": 0.0,
                "models": {},
            }
        d = self.detectors[pump_id]
        scaler, iso_forest, lof, ee = d["scaler"], d["if"], d["lof"], d["ee"]
        X_scaled = scaler.transform(X)

        # Isolation Forest: score_samples more negative -> anomaly
        if_score = iso_forest.score_samples(X_scaled)[0]
        if_prob = score_to_probability_01(if_score, is_lof=False)
        if_label = iso_forest.predict(X_scaled)[0]
        if_anomaly = if_label == -1

        # LOF: decision_scores (negative = anomaly). For novelty, use score_samples.
        lof_scores = lof.score_samples(X_scaled)
        lof_score = lof_scores[0]
        lof_prob = score_to_probability_01(-lof_score, is_lof=True)  # more negative -> higher prob
        lof_pred = lof.predict(X_scaled)[0]
        lof_anomaly = lof_pred == -1

        # Elliptic Envelope: score_samples more negative -> anomaly
        ee_score = ee.score_samples(X_scaled)[0]
        ee_prob = score_to_probability_01(ee_score, is_lof=False)
        ee_pred = ee.predict(X_scaled)[0]
        ee_anomaly = ee_pred == -1

        w = self.weights
        ensemble_prob = (
            w.get("isolation_forest", 0.45) * if_prob
            + w.get("lof", 0.35) * lof_prob
            + w.get("elliptic", 0.2) * ee_prob
        )
        ensemble_anomaly = ensemble_prob >= 0.5
        confidence = ensemble_prob if ensemble_anomaly else (1 - ensemble_prob)

        return {
            "anomaly_score": float(ensemble_prob),
            "is_anomaly": bool(ensemble_anomaly),
            "confidence": float(min(0.99, max(0.01, confidence))),
            "models": {
                "isolation_forest": {"score": float(if_prob), "is_anomaly": bool(if_anomaly)},
                "lof": {"score": float(lof_prob), "is_anomaly": bool(lof_anomaly)},
                "elliptic_envelope": {"score": float(ee_prob), "is_anomaly": bool(ee_anomaly)},
            },
        }


def rul_linear_and_exponential(
    time_index: np.ndarray,
    efficiency: np.ndarray,
    critical_threshold: float = 50.0,
    interval_minutes: float = 5.0,
) -> Dict[str, Any]:
    """
    Compute RUL using linear and exponential degradation; return point estimate and confidence interval.
    time_index: 0,1,2,... (reading index)
    efficiency: array of efficiency values (e.g. %)
    """
    if len(efficiency) < 3:
        return {"rul_hours": 500, "rul_lower": 200, "rul_upper": 800, "method": "fallback"}

    current_eff = float(efficiency[-1])
    n = len(efficiency)

    # Linear: eff = a + b * t
    coefs_lin = np.polyfit(time_index, efficiency, 1)
    slope_lin = coefs_lin[0]
    pred_lin = np.polyval(coefs_lin, time_index)
    resid_lin = efficiency - pred_lin
    std_lin = np.std(resid_lin) if n > 3 else 1.0

    if slope_lin >= 0:
        rul_lin_hours = 2000
    else:
        readings_to_critical = (current_eff - critical_threshold) / abs(slope_lin)
        rul_lin_hours = max(24, readings_to_critical * interval_minutes / 60)

    # Exponential: log(eff - E_min) = a + b*t -> eff = E_min + exp(a+b*t). Use E_min = 30.
    e_min = 30.0
    y = efficiency - e_min
    y = np.maximum(y, 0.5)
    log_y = np.log(y)
    coefs_exp = np.polyfit(time_index, log_y, 1)
    slope_exp = coefs_exp[0]
    pred_log = np.polyval(coefs_exp, time_index)
    pred_eff_exp = e_min + np.exp(pred_log)
    resid_exp = efficiency - pred_eff_exp
    std_exp = np.std(resid_exp) if n > 3 else 1.0

    if slope_exp >= 0:
        rul_exp_hours = 2000
    else:
        # time to reach critical: log(critical - e_min) = a + b*t -> t = (log(...) - a) / b
        from math import log
        log_crit = log(critical_threshold - e_min)
        t_crit = (log_crit - coefs_exp[0]) / coefs_exp[1]
        t_current = time_index[-1]
        readings_to_critical_exp = max(0, t_crit - t_current)
        rul_exp_hours = max(24, readings_to_critical_exp * interval_minutes / 60)

    # Combine: use linear as primary; exponential if it suggests earlier failure
    rul_hours = min(rul_lin_hours, rul_exp_hours)
    if rul_hours >= 1500:
        rul_hours = (rul_lin_hours + rul_exp_hours) / 2

    # Simple CI from residual std: assume ~30% uncertainty
    spread = max(100, rul_hours * 0.35)
    rul_lower = max(24, rul_hours - spread)
    rul_upper = min(2000, rul_hours + spread)

    return {
        "rul_hours": int(rul_hours),
        "rul_lower": int(rul_lower),
        "rul_upper": int(rul_upper),
        "method": "linear_and_exponential",
        "degradation_rate_linear": float(slope_lin),
        "degradation_rate_exponential": float(slope_exp),
        "current_efficiency": float(current_eff),
    }


def tree_feature_importance(model, feature_names: List[str]) -> List[Dict[str, Any]]:
    """Get feature importance from tree-based model (Isolation Forest)."""
    if not hasattr(model, 'feature_importances_'):
        return [{"feature": name, "importance": 1.0 / len(feature_names)} for name in feature_names]
    imp = model.feature_importances_
    n = min(len(imp), len(feature_names))
    return [{"feature": feature_names[i], "importance": float(imp[i])} for i in range(n)]


def permutation_importance_pump(
    model,
    scaler,
    X: np.ndarray,
    feature_names: List[str],
    n_repeats: int = 3,
    random_state: int = 42,
) -> List[Dict[str, Any]]:
    """Compute permutation importance: shuffle each feature and measure change in mean anomaly score."""
    if X.shape[0] < 5 or X.shape[1] != len(feature_names):
        return tree_feature_importance(model, feature_names)
    try:
        rng = np.random.default_rng(random_state)
        base_score = -np.mean(model.score_samples(scaler.transform(X)))
        importances = np.zeros(X.shape[1])
        for _ in range(n_repeats):
            for j in range(X.shape[1]):
                X_perm = X.copy()
                X_perm[:, j] = rng.permutation(X_perm[:, j])
                perm_score = -np.mean(model.score_samples(scaler.transform(X_perm)))
                importances[j] += max(0, perm_score - base_score)
        importances /= n_repeats
        total = float(np.sum(importances)) or 1.0
        importances = importances / total
        return [{"feature": feature_names[i], "importance": float(importances[i])} for i in range(len(feature_names))]
    except Exception as e:
        logger.warning("Permutation importance failed: %s", e)
        return tree_feature_importance(model, feature_names)
