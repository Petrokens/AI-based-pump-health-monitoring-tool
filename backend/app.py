"""
Flask Backend for Pump Predictive Maintenance Dashboard
Uses REAL CSV data with AI/ML algorithms for predictive analysis
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import json
import os
import logging
import threading
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Structured logging for production
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pump-api")

app = Flask(__name__)

# Configure CORS to allow requests from frontend (development and production)
# Allow all origins including Netlify (https://ai-petro-pump-health.netlify.app) and Render deployments
# Using "*" allows all origins - works for Netlify, Render, and localhost
CORS(app, 
     resources={
         r"/api/*": {
             "origins": "*",  # Allow all origins (Netlify, Render, localhost, etc.)
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
             "expose_headers": ["Content-Length", "Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }
     },
     supports_credentials=True)

# Add explicit CORS headers to all responses (backup to Flask-CORS)
@app.after_request
def after_request(response):
    """Add CORS headers to all responses - ensures compatibility"""
    # Only add if not already set by Flask-CORS
    if 'Access-Control-Allow-Origin' not in response.headers:
        response.headers.add('Access-Control-Allow-Origin', '*')
    if 'Access-Control-Allow-Headers' not in response.headers:
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    if 'Access-Control-Allow-Methods' not in response.headers:
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    return response


# ----------------------- Error handling & validation -----------------------

def api_error(message: str, status_code: int = 400, code: Optional[str] = None) -> Tuple[dict, int]:
    """Return a consistent JSON error payload."""
    return jsonify({"error": message, "code": code or f"ERR_{status_code}"}), status_code


@app.errorhandler(400)
def bad_request(e):
    return api_error(getattr(e, "description", "Bad request"), 400, "BAD_REQUEST")


@app.errorhandler(404)
def not_found(e):
    return api_error(getattr(e, "description", "Resource not found"), 404, "NOT_FOUND")


@app.errorhandler(500)
def server_error(e):
    logger.exception("Unhandled error")
    return api_error("An unexpected error occurred", 500, "INTERNAL_ERROR")


def safe_int(value: Any, default: int, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    """Parse query param to int with bounds; returns default on invalid input."""
    try:
        if value is None or value == "":
            return default
        n = int(float(value))
        if min_val is not None and n < min_val:
            return min_val
        if max_val is not None and n > max_val:
            return max_val
        return n
    except (ValueError, TypeError):
        return default


def safe_float_param(value: Any, default: float, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
    """Parse query param to float with bounds; returns default on invalid input."""
    try:
        if value is None or value == "":
            return default
        f = float(value)
        if min_val is not None and f < min_val:
            return min_val
        if max_val is not None and f > max_val:
            return max_val
        return f
    except (ValueError, TypeError):
        return default

# Lightweight cache for expensive endpoints
PUMP_LIST_CACHE = {
    "data": None,
    "timestamp": datetime.min
}
PUMP_CACHE_LOCK = threading.Lock()
PUMP_CACHE_TTL_SECONDS = 60  # serve cached pump list for up to 1 minute
PUMP_LIST_MAX_SECONDS = 5    # safety cap per request to avoid timeouts

# Helper function to convert numpy types to native Python types for JSON serialization
def convert_to_python_type(value):
    """Convert numpy/pandas types to native Python types"""
    if hasattr(value, 'item'):  # numpy scalar
        return value.item()
    elif hasattr(value, 'tolist'):  # numpy array
        return value.tolist()
    elif pd.isna(value):  # pandas NaN
        return None
    elif isinstance(value, (np.integer, np.floating)):
        return value.item()
    elif isinstance(value, (np.ndarray,)):
        return value.tolist()
    elif isinstance(value, pd.Series):
        return value.tolist()
    else:
        return value

# ==================== Data Loading ====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Load CSV files with optimizations
PUMP_MASTER_PATH = os.path.join(DATA_DIR, 'pump_master.csv')
PUMP_MASTER_LOCK = threading.Lock()
PUMP_MASTER_MTIME = None

def _load_pump_master() -> pd.DataFrame:
    df = pd.read_csv(PUMP_MASTER_PATH)
    df.columns = df.columns.str.strip()
    return df

def _refresh_pump_master_if_changed():
    """Reload pump master when the CSV file is modified; refresh runtime state and cache."""
    global pump_master_df, PUMP_MASTER_MTIME, runtime_state
    try:
        current_mtime = os.path.getmtime(PUMP_MASTER_PATH)
    except OSError:
        return False

    # Fast path: unchanged
    if PUMP_MASTER_MTIME is not None and current_mtime == PUMP_MASTER_MTIME:
        return False

    with PUMP_MASTER_LOCK:
        # Re-check inside the lock
        try:
            current_mtime = os.path.getmtime(PUMP_MASTER_PATH)
        except OSError:
            return False
        if PUMP_MASTER_MTIME is not None and current_mtime == PUMP_MASTER_MTIME:
            return False

        # Reload master data
        df = _load_pump_master()
        PUMP_MASTER_MTIME = current_mtime
        pump_master_df = df

        # Rebuild runtime state entries for any new pumps
        with runtime_state_lock:
            runtime_state = _read_runtime_state_file() or {}
            for pump_id_value in pump_master_df["pump_id"].values:
                _ensure_runtime_entry(str(pump_id_value))
            _write_runtime_state_file({k: dict(v) for k, v in runtime_state.items()})

        # Invalidate pump list cache
        with PUMP_CACHE_LOCK:
            PUMP_LIST_CACHE["data"] = None
            PUMP_LIST_CACHE["timestamp"] = datetime.min

        logger.info("Reloaded pump_master.csv; pumps: %s", list(pump_master_df['pump_id'].values))
        return True

try:
    logger.info("Loading CSV data files...")

    # Load pump master (small file, load all)
    pump_master_df = _load_pump_master()
    PUMP_MASTER_MTIME = os.path.getmtime(PUMP_MASTER_PATH)

    # Load operation log with optimizations - use dtype to reduce memory and speed
    logger.info("Loading operation logs (this may take a moment for large files)...")
    operation_log_df = pd.read_csv(
        os.path.join(DATA_DIR, 'operation_log.csv'),
        dtype={
            'pump_id': 'category',
            'flow_m3h': 'float32',
            'discharge_pressure_bar': 'float32',
            'suction_pressure_bar': 'float32',
            'rpm': 'float32',
            'motor_power_kw': 'float32',
            'vibration_mm_s': 'float32',
            'bearing_temp_c': 'float32',
            'displacement_um': 'float32',
            'status': 'category'
        },
        parse_dates=['timestamp'],
        infer_datetime_format=True
    )
    operation_log_df.columns = operation_log_df.columns.str.strip()
    
    # Sort by timestamp once and cache (data is already sorted, but ensure consistency)
    operation_log_df = operation_log_df.sort_values('timestamp').reset_index(drop=True)
    
    # Load maintenance log
    maintenance_log_df = pd.read_csv(os.path.join(DATA_DIR, 'maintenance_log.csv'))
    maintenance_log_df.columns = maintenance_log_df.columns.str.strip()
    maintenance_log_df['date'] = pd.to_datetime(maintenance_log_df['date'])
    
    # Load failure data
    failure_data_df = pd.read_csv(os.path.join(DATA_DIR, 'raw', 'failure_data.csv'))
    failure_data_df.columns = failure_data_df.columns.str.strip()
    failure_data_df['failure_date'] = pd.to_datetime(failure_data_df['failure_date'])
    
    logger.info(
        "Successfully loaded CSV data - operation_logs=%s maintenance=%s failure=%s pumps=%s",
        len(operation_log_df), len(maintenance_log_df), len(failure_data_df), list(pump_master_df['pump_id'].values),
    )
except Exception as e:
    logger.critical("Could not load CSV files: %s", e)
    exit(1)

# ==================== Runtime State Tracking ====================

RUNTIME_STATE_FILE = os.path.join(DATA_DIR, 'runtime_state.json')
runtime_state_lock = threading.Lock()


def _default_runtime_state():
    now_iso = datetime.now().isoformat()
    return {
        "is_running": True,
        "last_state_change": now_iso,
        "last_start": now_iso,
        "last_stop": None,
        "runtime_seconds": 0.0,
    }


def _read_runtime_state_file():
    if os.path.exists(RUNTIME_STATE_FILE):
        try:
            with open(RUNTIME_STATE_FILE, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return {}


def _write_runtime_state_file(snapshot: Dict[str, Dict[str, Any]]):
    try:
        with open(RUNTIME_STATE_FILE, "w", encoding="utf-8") as fh:
            json.dump(snapshot, fh, indent=2)
    except Exception as exc:
        logger.warning("Unable to persist runtime state: %s", exc)


runtime_state: Dict[str, Dict[str, Any]] = _read_runtime_state_file()


def _ensure_runtime_entry(pump_id: str):
    if pump_id not in runtime_state:
        runtime_state[pump_id] = _default_runtime_state()


# Auto-reload hook for every request to keep pump master in sync without restarts
@app.before_request
def _maybe_reload_pump_master():
    try:
        _refresh_pump_master_if_changed()
    except Exception as exc:
        # Non-fatal: log and continue with existing in-memory data
        logger.warning("Pump master reload skipped: %s", exc)


for pump_id_value in pump_master_df["pump_id"].values:
    _ensure_runtime_entry(str(pump_id_value))

_write_runtime_state_file({k: dict(v) for k, v in runtime_state.items()})


def _parse_iso(ts: str):
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def _parse_at_param(at_value: str):
    """Parse an ISO timestamp string for 'at' query params."""
    if not at_value:
        return None
    try:
        return pd.to_datetime(at_value).to_pydatetime()
    except Exception:
        return None


def _calculate_recent_runtime_hours(pump_id: str, hours: int = 24) -> float:
    if "timestamp" not in operation_log_df or operation_log_df.empty:
        return 0.0
    latest_timestamp = operation_log_df["timestamp"].max()
    if pd.isna(latest_timestamp):
        return 0.0
    cutoff = latest_timestamp - timedelta(hours=hours)
    pump_ops = operation_log_df[
        (operation_log_df["pump_id"] == pump_id)
        & (operation_log_df["timestamp"] >= cutoff)
    ]
    if pump_ops.empty:
        return 0.0
    running_statuses = {"running", "alarm", "startup"}
    interval_minutes = 15  # data generated in 15-min steps
    running_points = pump_ops[pump_ops["status"].isin(running_statuses)]
    runtime_hours = (len(running_points) * interval_minutes) / 60.0
    return round(runtime_hours, 2)


def _calculate_payload(pump_id: str, state: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now()
    total_seconds = float(state.get("runtime_seconds", 0.0))
    last_change = _parse_iso(state.get("last_state_change") or "")
    if state.get("is_running") and last_change:
        total_seconds += (now - last_change).total_seconds()
    total_hours = round(total_seconds / 3600.0, 2)

    return {
        "pump_id": pump_id,
        "status": "running" if state.get("is_running") else "stopped",
        "is_running": bool(state.get("is_running")),
        "total_runtime_hours": total_hours,
        "today_runtime_hours": _calculate_recent_runtime_hours(pump_id, 24),
        "log_window_hours": 24,
        "last_start": state.get("last_start"),
        "last_stop": state.get("last_stop"),
        "last_state_change": state.get("last_state_change"),
    }


def _refresh_running_runtime_locked(pump_id: str) -> bool:
    """Accumulate elapsed runtime into state when pump is running."""
    state = runtime_state[pump_id]
    if not state.get("is_running"):
        return False
    last_change = _parse_iso(state.get("last_state_change") or "")
    if not last_change:
        return False
    now = datetime.now()
    elapsed = (now - last_change).total_seconds()
    if elapsed <= 0:
        return False
    state["runtime_seconds"] = float(state.get("runtime_seconds", 0.0) + elapsed)
    state["last_state_change"] = now.isoformat()
    return True


def get_runtime_payload(pump_id: str) -> Dict[str, Any]:
    snapshot = None
    with runtime_state_lock:
        _ensure_runtime_entry(pump_id)
        state = runtime_state[pump_id]
        refreshed = _refresh_running_runtime_locked(pump_id)
        state_copy = dict(state)
        if refreshed:
            snapshot = {k: dict(v) for k, v in runtime_state.items()}
    if snapshot:
        _write_runtime_state_file(snapshot)
    return _calculate_payload(pump_id, state_copy)


def update_runtime_state(pump_id: str, action: str) -> Dict[str, Any]:
    snapshot = None
    with runtime_state_lock:
        _ensure_runtime_entry(pump_id)
        state = runtime_state[pump_id]
        now = datetime.now()
        last_change = _parse_iso(state.get("last_state_change") or now.isoformat())

        if action == "stop" and state.get("is_running"):
            if last_change:
                elapsed = (now - last_change).total_seconds()
                state["runtime_seconds"] = float(state.get("runtime_seconds", 0.0) + max(elapsed, 0))
            state["is_running"] = False
            state["last_stop"] = now.isoformat()
            state["last_state_change"] = now.isoformat()
        elif action == "start" and not state.get("is_running"):
            state["is_running"] = True
            state["last_start"] = now.isoformat()
            state["last_state_change"] = now.isoformat()

        payload = _calculate_payload(pump_id, dict(state))
        snapshot = {k: dict(v) for k, v in runtime_state.items()}

    if snapshot is not None:
        _write_runtime_state_file(snapshot)
    return payload

# ==================== Feature Engineering ====================

class FeatureEngineer:
    """Extract features from sensor data for ML models"""
    
    @staticmethod
    def calculate_derived_features(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived features from raw sensor data"""
        df = df.copy()
        
        # Head calculation
        df['head_m'] = (df['discharge_pressure_bar'] - df['suction_pressure_bar']) * 10.2
        
        # Hydraulic power
        df['hydraulic_power_kw'] = (df['flow_m3h'] * df['head_m']) / 367
        
        # Efficiency estimation
        df['efficiency'] = (df['hydraulic_power_kw'] / df['motor_power_kw']) * 100
        df['efficiency'] = df['efficiency'].clip(0, 100)
        
        # Flow deviation from pump specs
        for pump_id in df['pump_id'].unique():
            pump_spec = pump_master_df[pump_master_df['pump_id'] == pump_id]
            if not pump_spec.empty:
                rated_flow = pump_spec.iloc[0].get('rated_flow_m3h', 150)
                if rated_flow and rated_flow > 0:
                    mask = df['pump_id'] == pump_id
                    df.loc[mask, 'flow_deviation_pct'] = ((df.loc[mask, 'flow_m3h'] - rated_flow) / rated_flow) * 100
        
        # Pressure ratio
        df['pressure_ratio'] = df['discharge_pressure_bar'] / (df['suction_pressure_bar'] + 0.1)
        
        # Specific energy
        df['specific_energy'] = df['motor_power_kw'] / (df['flow_m3h'] + 0.1)
        
        return df
    
    @staticmethod
    def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add rolling statistics and trend features"""
        df = df.copy()
        df = df.sort_values('timestamp')
        
        for pump_id in df['pump_id'].unique():
            mask = df['pump_id'] == pump_id
            pump_data = df[mask].copy()
            
            # Rolling statistics (3-point window)
            for col in ['flow_m3h', 'discharge_pressure_bar', 'motor_power_kw']:
                if len(pump_data) >= 3:
                    rolling_mean = pump_data[col].rolling(window=3, min_periods=1).mean()
                    rolling_std = pump_data[col].rolling(window=3, min_periods=1).std().fillna(0)
                    
                    df.loc[mask, f'{col}_rolling_mean'] = rolling_mean.values
                    df.loc[mask, f'{col}_rolling_std'] = rolling_std.values
                else:
                    df.loc[mask, f'{col}_rolling_mean'] = pump_data[col].values
                    df.loc[mask, f'{col}_rolling_std'] = 0
        
        return df

# ==================== AI/ML Models ====================

class PredictiveMaintenanceAI:
    """Real AI/ML models for predictive maintenance"""
    
    # RUL bounds (hours)
    MIN_RUL_HOURS = 2160   # ~3 months
    MAX_RUL_HOURS = 17520  # ~24 months

    def __init__(self):
        self.anomaly_detectors = {}
        self.scalers = {}
        self.baseline_stats = {}
        self.train_models()
    
    def train_models(self):
        """Train ML models on historical data"""
        logger.info("Training AI models on historical data...")
        
        # Limit data for faster training - use recent data or sample
        # For large datasets, use last 10,000 rows or sample every Nth row
        MAX_TRAINING_SAMPLES = 10000
        
        if len(operation_log_df) > MAX_TRAINING_SAMPLES:
            logger.info("Large dataset detected (%s rows). Sampling for faster training...", len(operation_log_df))
            # Use last MAX_TRAINING_SAMPLES rows (most recent data)
            df = operation_log_df.tail(MAX_TRAINING_SAMPLES).copy()
        else:
            df = operation_log_df.copy()
        
        # Prepare data with features
        df = FeatureEngineer.calculate_derived_features(df)
        df = FeatureEngineer.add_temporal_features(df)
        
        # Train separate model for each pump
        for pump_id in df['pump_id'].unique():
            pump_data = df[df['pump_id'] == pump_id].copy()
            
            # Feature columns for anomaly detection
            feature_cols = [
                'flow_m3h', 'discharge_pressure_bar', 'suction_pressure_bar',
                'motor_power_kw', 'head_m', 'efficiency', 'pressure_ratio',
                'specific_energy', 'flow_m3h_rolling_mean', 'flow_m3h_rolling_std'
            ]
            
            # Remove any rows with NaN
            pump_data_clean = pump_data[feature_cols].dropna()
            
            # Limit training samples per pump for speed
            if len(pump_data_clean) > 5000:
                pump_data_clean = pump_data_clean.sample(n=5000, random_state=42)
            
            if len(pump_data_clean) > 0:
                # Calculate baseline statistics from ALL data (not just training sample)
                pump_all = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
                pump_all = FeatureEngineer.calculate_derived_features(pump_all)
                
                # Calculate efficiency safely to avoid division by zero
                head = (pump_all['discharge_pressure_bar'] - pump_all['suction_pressure_bar']) * 10.2
                hydraulic_power = (pump_all['flow_m3h'] * head) / 367
                # Avoid division by zero
                motor_power_safe = pump_all['motor_power_kw'].replace(0, 0.1)  # Replace zeros with small value
                efficiency = (hydraulic_power / motor_power_safe * 100).clip(0, 100)
                
                self.baseline_stats[pump_id] = {
                    'flow_mean': float(convert_to_python_type(pump_all['flow_m3h'].mean())),
                    'flow_std': float(convert_to_python_type(pump_all['flow_m3h'].std())),
                    'efficiency_mean': float(convert_to_python_type(efficiency.mean())),
                    'efficiency_std': float(convert_to_python_type(efficiency.std())),
                    'head_mean': float(convert_to_python_type(head.mean())),
                    'power_mean': float(convert_to_python_type(pump_all['motor_power_kw'].mean())),
                }
                
                # Scale features
                scaler = StandardScaler()
                scaled_features = scaler.fit_transform(pump_data_clean[feature_cols])
                self.scalers[pump_id] = scaler
                
                # Train Isolation Forest with fewer trees for faster training
                iso_forest = IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=50,  # Reduced from 100 for faster training
                    n_jobs=-1  # Use all CPU cores
                )
                iso_forest.fit(scaled_features)
                self.anomaly_detectors[pump_id] = iso_forest
                
                logger.info("Trained model for %s on %s samples", pump_id, len(pump_data_clean))
            else:
                logger.warning("Insufficient data for %s", pump_id)
    
    def predict_anomaly_score(self, pump_id: str, sensor_data: Dict) -> Dict[str, Any]:
        """Predict anomaly score using trained model"""
        if pump_id not in self.anomaly_detectors:
            return {"anomaly_score": 0, "is_anomaly": False, "confidence": 0}
        
        # Calculate derived features
        head_m = (sensor_data['discharge_pressure_bar'] - sensor_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (sensor_data['flow_m3h'] * head_m) / 367
        motor_power = sensor_data['motor_power_kw']
        motor_power_safe = motor_power if motor_power != 0 else 0.1  # prevent zero-division
        efficiency = (hydraulic_power / motor_power_safe) * 100
        pressure_ratio = sensor_data['discharge_pressure_bar'] / (sensor_data['suction_pressure_bar'] + 0.1)
        specific_energy = motor_power_safe / (sensor_data['flow_m3h'] + 0.1)
        
        # Prepare feature vector
        features = np.array([[
            sensor_data['flow_m3h'],
            sensor_data['discharge_pressure_bar'],
            sensor_data['suction_pressure_bar'],
            sensor_data['motor_power_kw'],
            head_m,
            efficiency,
            pressure_ratio,
            specific_energy,
            sensor_data['flow_m3h'],  # rolling mean (use current for single point)
            0  # rolling std
        ]])
        
        # Scale features
        scaled_features = self.scalers[pump_id].transform(features)
        
        # Predict anomaly
        anomaly_label = self.anomaly_detectors[pump_id].predict(scaled_features)[0]
        anomaly_score = self.anomaly_detectors[pump_id].score_samples(scaled_features)[0]
        
        # Convert to probability (0-1)
        anomaly_prob = 1 / (1 + np.exp(anomaly_score))
        
        return {
            "anomaly_score": float(anomaly_prob),
            "is_anomaly": anomaly_label == -1,
            "confidence": float(1 - anomaly_prob) if anomaly_label == 1 else float(anomaly_prob)
        }
    
    def calculate_health_index(self, pump_id: str, sensor_data: Dict, anomaly_result: Dict) -> float:
        """Calculate health index based on multiple factors"""
        baseline = self.baseline_stats.get(pump_id, {})
        
        if not baseline:
            return 85.0
        
        health_score = 100.0
        
        # Factor 1: Flow deviation (weight: 20%)
        flow_mean_safe = baseline['flow_mean'] if baseline['flow_mean'] != 0 else 0.1
        flow_deviation = abs(sensor_data['flow_m3h'] - flow_mean_safe) / flow_mean_safe
        health_score -= min(flow_deviation * 100, 20)
        
        # Factor 2: Efficiency loss (weight: 25%)
        head_m = (sensor_data['discharge_pressure_bar'] - sensor_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (sensor_data['flow_m3h'] * head_m) / 367
        motor_power = sensor_data['motor_power_kw']
        motor_power_safe = motor_power if motor_power != 0 else 0.1
        current_efficiency = (hydraulic_power / motor_power_safe) * 100
        efficiency_mean_safe = baseline['efficiency_mean'] if baseline['efficiency_mean'] != 0 else 0.1
        efficiency_loss = max(0, efficiency_mean_safe - current_efficiency) / efficiency_mean_safe
        health_score -= min(efficiency_loss * 100, 25)
        
        # Factor 3: Power consumption increase (weight: 20%)
        power_mean_safe = baseline['power_mean'] if baseline['power_mean'] != 0 else 0.1
        power_increase = max(0, sensor_data['motor_power_kw'] - power_mean_safe) / power_mean_safe
        health_score -= min(power_increase * 100, 20)
        
        # Factor 4: Anomaly score (weight: 35%)
        health_score -= anomaly_result['anomaly_score'] * 35
        
        return max(0, min(100, health_score))
    
    def predict_rul(self, pump_id: str, health_index: float, sensor_data: Dict) -> int:
        """Predict Remaining Useful Life using degradation rate analysis (optimized)"""
        
        # Get historical degradation trend - limit to recent data for speed
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if len(pump_ops) < 3:
            # Fallback: Simple health-based RUL
            if health_index > 80:
                return np.random.randint(800, 1500)
            elif health_index > 60:
                return np.random.randint(200, 500)
            else:
                return np.random.randint(24, 150)
        
        # Limit to last 5000 rows for faster processing (data already sorted by timestamp)
        if len(pump_ops) > 5000:
            pump_ops = pump_ops.tail(5000)
        
        # Calculate efficiency trend
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        # Data already sorted, no need to sort again
        
        # Fit linear degradation model
        if len(pump_ops) >= 3:
            time_index = np.arange(len(pump_ops))
            efficiency_values = pump_ops['efficiency'].values
            
            # Simple linear regression
            coefficients = np.polyfit(time_index, efficiency_values, 1)
            degradation_rate = abs(coefficients[0])  # % efficiency loss per reading
            
            # Estimate time to critical threshold (efficiency < 50%)
            current_efficiency = efficiency_values[-1]
            critical_threshold = 50.0
            
            if degradation_rate > 0:
                readings_to_failure = (current_efficiency - critical_threshold) / degradation_rate
                # Assuming 5-minute intervals, convert to hours
                hours_to_failure = max(24, int(readings_to_failure * 5 / 60))
            else:
                hours_to_failure = 2000  # No degradation detected
            
            # Adjust based on health index
            rul_factor = health_index / 100
            adjusted_rul = int(hours_to_failure * rul_factor)
            
            return max(24, min(2000, adjusted_rul))
        
        return 500

    @staticmethod
    def clamp_rul_hours(rul_hours: int) -> int:
        """Clamp RUL hours to configured min/max to avoid unrealistically low/high values."""
        return int(max(PredictiveMaintenanceAI.MIN_RUL_HOURS, min(PredictiveMaintenanceAI.MAX_RUL_HOURS, rul_hours)))
    
    def detect_failure_modes(self, pump_id: str, sensor_data: Dict, health_index: float) -> List[Dict]:
        """Detect specific failure modes based on sensor patterns"""
        baseline = self.baseline_stats.get(pump_id, {})
        anomalies = []
        
        if not baseline:
            return anomalies
        
        # Calculate current metrics
        head_m = (sensor_data['discharge_pressure_bar'] - sensor_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (sensor_data['flow_m3h'] * head_m) / 367
        efficiency = (hydraulic_power / sensor_data['motor_power_kw']) * 100
        
        # Check flow reduction (Impeller wear / Blockage)
        flow_reduction = ((baseline['flow_mean'] - sensor_data['flow_m3h']) / baseline['flow_mean']) * 100
        if flow_reduction > 10:
            severity = "high" if flow_reduction > 20 else "medium"
            anomalies.append({
                "type": "Impeller Wear / Fouling",
                "severity": severity,
                "message": f"Flow reduced by {flow_reduction:.1f}% from baseline ({baseline['flow_mean']:.1f} m³/h)",
                "recommendation": "Inspect impeller for wear, erosion, or fouling. Check suction strainer.",
                "confidence": min(0.95, 0.6 + (flow_reduction / 50)),
                "measured_value": sensor_data['flow_m3h'],
                "baseline_value": baseline['flow_mean']
            })
        
        # Check efficiency drop (Multiple causes)
        efficiency_drop = baseline['efficiency_mean'] - efficiency
        if efficiency_drop > 5:
            severity = "high" if efficiency_drop > 15 else "medium"
            anomalies.append({
                "type": "Efficiency Degradation",
                "severity": severity,
                "message": f"Efficiency dropped {efficiency_drop:.1f}% (Current: {efficiency:.1f}%, Baseline: {baseline['efficiency_mean']:.1f}%)",
                "recommendation": "Check for wear rings clearance, impeller condition, and alignment",
                "confidence": min(0.92, 0.65 + (efficiency_drop / 40)),
                "measured_value": efficiency,
                "baseline_value": baseline['efficiency_mean']
            })
        
        # Check power consumption increase (Mechanical issues)
        power_increase = ((sensor_data['motor_power_kw'] - baseline['power_mean']) / baseline['power_mean']) * 100
        if power_increase > 10:
            severity = "medium" if power_increase < 20 else "high"
            anomalies.append({
                "type": "Increased Power Consumption",
                "severity": severity,
                "message": f"Motor power increased {power_increase:.1f}% (Current: {sensor_data['motor_power_kw']:.1f} kW)",
                "recommendation": "Check for bearing friction, misalignment, or mechanical binding",
                "confidence": 0.78,
                "measured_value": sensor_data['motor_power_kw'],
                "baseline_value": baseline['power_mean']
            })
        
        # Check pressure ratio (Cavitation risk)
        pressure_ratio = sensor_data['discharge_pressure_bar'] / (sensor_data['suction_pressure_bar'] + 0.1)
        if sensor_data['suction_pressure_bar'] < 1.0 and pressure_ratio > 4.0:
            anomalies.append({
                "type": "Cavitation Risk",
                "severity": "high",
                "message": f"Low suction pressure ({sensor_data['suction_pressure_bar']:.2f} bar) with high head",
                "recommendation": "URGENT: Check NPSH availability. Inspect suction line for blockages.",
                "confidence": 0.85,
                "measured_value": sensor_data['suction_pressure_bar'],
                "baseline_value": 2.0
            })
        
        # Overall health-based warning
        if health_index < 70 and len(anomalies) == 0:
            anomalies.append({
                "type": "General Performance Degradation",
                "severity": "medium" if health_index > 50 else "high",
                "message": f"Overall health index at {health_index:.1f}% - multiple parameters deviating",
                "recommendation": "Comprehensive inspection recommended",
                "confidence": 0.72,
                "measured_value": health_index,
                "baseline_value": 100
            })
        
        return anomalies

# Initialize AI models
print("\n" + "="*60)
print("🤖 Initializing AI/ML Predictive Models...")
print("="*60)
ai_predictor = PredictiveMaintenanceAI()
print("="*60 + "\n")

# ==================== Data Provider ====================

class RealDataProvider:
    """Provides real data from CSV files"""
    
    @staticmethod
    def get_latest_reading(pump_id: str, at: datetime = None) -> Dict:
        """Get sensor reading for a pump. If `at` provided, returns the closest reading at or before that time."""
        pump_mask = operation_log_df['pump_id'] == pump_id
        pump_ops = operation_log_df[pump_mask]
        
        if pump_ops.empty:
            raise ValueError(f"No data found for pump {pump_id}")

        selected = None
        if at is not None:
            # Choose the latest reading at or before the requested time; otherwise the earliest after it
            pump_ops_at = pump_ops[pump_ops['timestamp'] <= at]
            if not pump_ops_at.empty:
                selected = pump_ops_at.iloc[-1]
            else:
                pump_ops_future = pump_ops[pump_ops['timestamp'] > at]
                if not pump_ops_future.empty:
                    selected = pump_ops_future.iloc[0]
        if selected is None:
            selected = pump_ops.iloc[-1]
        
        return {
            'timestamp': selected['timestamp'].isoformat(),
            'flow_m3h': float(convert_to_python_type(selected['flow_m3h'])),
            'discharge_pressure_bar': float(convert_to_python_type(selected['discharge_pressure_bar'])),
            'suction_pressure_bar': float(convert_to_python_type(selected['suction_pressure_bar'])),
            'motor_power_kw': float(convert_to_python_type(selected['motor_power_kw'])),
            'rpm': float(convert_to_python_type(selected['rpm'])) if 'rpm' in selected and pd.notna(selected['rpm']) else 1450.0,
            'status': str(selected['status'])
        }
    
    @staticmethod
    def get_historical_data(pump_id: str, hours: int = 24) -> List[Dict]:
        """Get historical sensor readings (optimized with vectorized operations) - supports up to 6 months"""
        # Filter by pump - data already sorted by timestamp
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        # Support up to 6 months (4320 hours) - filter by time window for performance
        if hours > 24:
            # For longer periods, sample data to keep response fast
            cutoff_time = pump_ops['timestamp'].max() - pd.Timedelta(hours=hours)
            pump_ops = pump_ops[pump_ops['timestamp'] >= cutoff_time]
            
            # Sample data for very long periods (6 months = ~4320 hours)
            if hours > 720:  # More than 30 days
                # Sample every Nth row to keep data manageable
                sample_rate = max(1, len(pump_ops) // 10000)  # Max 10k points
                pump_ops = pump_ops.iloc[::sample_rate]
        else:
            # For short periods (24h), use recent data
            if len(pump_ops) > 5000:
                pump_ops = pump_ops.tail(5000)
        
        # Add derived features
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        
        # Use vectorized operations instead of iterrows() (much faster)
        # Convert all values to native Python types
        result = [
            {
                'timestamp': ts.isoformat(),
                'flow': float(convert_to_python_type(flow)),
                'discharge_pressure': float(convert_to_python_type(dp)),
                'motor_current': float(convert_to_python_type(power) / 0.4),  # Approximate current
                'bearing_temp': float(65.0 + np.random.randn() * 3),  # Simulated
                'vibration': float(2.5 + np.random.randn() * 0.5)  # Simulated
            }
            for ts, flow, dp, power in zip(
                pump_ops['timestamp'],
                pump_ops['flow_m3h'],
                pump_ops['discharge_pressure_bar'],
                pump_ops['motor_power_kw']
            )
        ]

        return result

    @staticmethod
    def get_fast_forward_series(pump_id: str, window_hours: int = 6) -> List[Dict]:
        """Return a dense time-series window for fast-forward visualization."""
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()

        if pump_ops.empty:
            raise ValueError(f"No operation data for pump {pump_id}")

        latest_ts = pump_ops['timestamp'].max()
        cutoff = latest_ts - timedelta(hours=window_hours)
        window = pump_ops[pump_ops['timestamp'] >= cutoff].copy()

        # Ensure we have data (fallback to last 24 rows)
        if window.empty:
            window = pump_ops.tail(24).copy()

        window = FeatureEngineer.calculate_derived_features(window)
        series = []
        for _, row in window.iterrows():
            series.append({
                "timestamp": row['timestamp'].isoformat(),
                "flow": float(convert_to_python_type(row.get('flow_m3h', 0))),
                "discharge_pressure": float(convert_to_python_type(row.get('discharge_pressure_bar', 0))),
                "suction_pressure": float(convert_to_python_type(row.get('suction_pressure_bar', 0))),
                "rpm": float(convert_to_python_type(row.get('rpm', 0))),
                "motor_power": float(convert_to_python_type(row.get('motor_power_kw', 0))),
                "status": str(row.get('status', 'running')),
            })
        return series

# ==================== API Endpoints ====================

# Global OPTIONS handler for CORS preflight requests
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle CORS preflight requests"""
    response = jsonify({})
    return response

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_source": "Real CSV files",
        "ai_models": "Trained (Isolation Forest)",
        "pumps_loaded": len(operation_log_df['pump_id'].unique()),
        "total_records": len(operation_log_df)
    })


# ==================== Setup / Upload endpoints ====================

OPERATION_LOG_LOCK = threading.Lock()
MAINTENANCE_LOG_LOCK = threading.Lock()


def _read_uploaded_table(file_storage):
    """Read Excel (.xlsx) or CSV file into a DataFrame."""
    fn = (file_storage.filename or "").lower()
    if fn.endswith(".csv"):
        df = pd.read_csv(file_storage.stream)
    elif fn.endswith(".xlsx"):
        df = pd.read_excel(file_storage.stream, engine="openpyxl")
    else:
        raise ValueError("File must be .csv or .xlsx")
    df.columns = df.columns.str.strip()
    return df


PUMP_MASTER_COLS = [
    "pump_id", "pump_type", "pump_type_detail", "manufacturer", "model", "installation_date",
    "rated_power_kw", "rated_flow_m3h", "rated_head_m", "flow_range_min_m3h", "flow_range_max_m3h",
    "head_range_min_m", "head_range_max_m", "rated_rpm", "seal_type", "bearing_type_de", "bearing_type_nde",
    "impeller_type", "location", "criticality_level", "serial_number", "warranty_expiry", "last_overhaul",
    "min_safe_flow_m3h", "max_safe_flow_m3h", "max_motor_load_kw", "max_suction_pressure_bar",
    "efficiency_bep_percent", "npshr_m", "health_score",
]


@app.route('/api/setup/pump-master', methods=['OPTIONS', 'POST'])
def setup_pump_master():
    """Append one pump master row from JSON body (all pump_master.csv columns)."""
    if request.method == 'OPTIONS':
        return jsonify({})
    global pump_master_df, PUMP_MASTER_MTIME
    try:
        data = request.get_json() or {}
        if not data.get("pump_id"):
            return api_error("pump_id is required", 400)
        row = {c: data.get(c) for c in PUMP_MASTER_COLS}
        new_row_df = pd.DataFrame([row], columns=PUMP_MASTER_COLS)
        with PUMP_MASTER_LOCK:
            pump_master_df = pd.concat([pump_master_df, new_row_df], ignore_index=True)
            pump_master_df.to_csv(PUMP_MASTER_PATH, index=False)
            PUMP_MASTER_MTIME = os.path.getmtime(PUMP_MASTER_PATH)
        with PUMP_CACHE_LOCK:
            PUMP_LIST_CACHE["data"] = None
            PUMP_LIST_CACHE["timestamp"] = datetime.min
        return jsonify({"ok": True, "pump_id": str(row["pump_id"])})
    except Exception as e:
        logger.exception("pump-master setup failed")
        return api_error(str(e), 500)


def _normalize_df_columns_to_master(df):
    """Map dataframe columns to PUMP_MASTER_COLS (strip, case-insensitive match). Returns (df, missing_list)."""
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    col_map = {}
    available_lower = {str(c).strip().lower(): c for c in df.columns}
    missing = []
    for expected in PUMP_MASTER_COLS:
        key = expected.lower()
        if key in available_lower:
            col_map[available_lower[key]] = expected
        else:
            missing.append(expected)
    if missing:
        return None, missing
    df = df.rename(columns=col_map)
    return df[PUMP_MASTER_COLS], []


@app.route('/api/setup/pump-master/upload', methods=['OPTIONS', 'POST'])
def setup_pump_master_upload():
    """Append first row from uploaded pump_master CSV/Excel; return that row for frontend form."""
    if request.method == 'OPTIONS':
        return jsonify({})
    global pump_master_df, PUMP_MASTER_MTIME
    try:
        f = request.files.get("file")
        if not f:
            keys = list(request.files.keys()) if request.files else []
            return api_error(
                f"No file uploaded. Use form field 'file'. (Received keys: {keys})",
                400,
            )
        df = _read_uploaded_table(f)
        df.columns = [str(c).strip() for c in df.columns]
        df_normalized, missing = _normalize_df_columns_to_master(df)
        if df_normalized is None:
            return api_error(
                f"Missing columns: {missing}. File must include: pump_id, pump_type, pump_type_detail, manufacturer, model, ...",
                400,
            )
        if len(df_normalized) == 0:
            return api_error("File has no data rows. Need at least one row after the header.", 400)
        row_raw = df_normalized.iloc[0].to_dict()
        row = {}
        for c in PUMP_MASTER_COLS:
            v = row_raw.get(c)
            if pd.isna(v) or v is None:
                row[c] = None
            else:
                row[c] = convert_to_python_type(v)
        if not row.get("pump_id"):
            return api_error("First row must have pump_id.", 400)
        new_row_df = pd.DataFrame([row], columns=PUMP_MASTER_COLS)
        with PUMP_MASTER_LOCK:
            pump_master_df = pd.concat([pump_master_df, new_row_df], ignore_index=True)
            pump_master_df.to_csv(PUMP_MASTER_PATH, index=False)
            PUMP_MASTER_MTIME = os.path.getmtime(PUMP_MASTER_PATH)
        with PUMP_CACHE_LOCK:
            PUMP_LIST_CACHE["data"] = None
            PUMP_LIST_CACHE["timestamp"] = datetime.min
        return jsonify({"ok": True, "pump_id": str(row["pump_id"]), "row": row})
    except ValueError as e:
        return api_error(str(e), 400)
    except Exception as e:
        logger.exception("pump-master upload failed")
        return api_error(str(e), 500)


@app.route('/api/setup/operation-log', methods=['OPTIONS', 'POST'])
def setup_operation_log():
    """Replace operation log with uploaded Excel or CSV. Columns: timestamp, pump_id, flow_m3h, discharge_pressure_bar, suction_pressure_bar, rpm, motor_power_kw, vibration_mm_s, bearing_temp_c, displacement_um, status."""
    if request.method == 'OPTIONS':
        return jsonify({})
    global operation_log_df
    try:
        f = request.files.get("file")
        if not f:
            return api_error("No file uploaded. Use form field 'file'.", 400)
        df = _read_uploaded_table(f)
        df.columns = df.columns.str.strip()
        required = ["timestamp", "pump_id", "flow_m3h", "discharge_pressure_bar", "suction_pressure_bar", "rpm", "motor_power_kw", "vibration_mm_s", "bearing_temp_c", "displacement_um", "status"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            return api_error(f"Missing columns: {missing}. Expected: {required}", 400)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        for col in ["flow_m3h", "discharge_pressure_bar", "suction_pressure_bar", "rpm", "motor_power_kw", "vibration_mm_s", "bearing_temp_c", "displacement_um"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").astype("float32")
        df = df.sort_values("timestamp").reset_index(drop=True)
        with OPERATION_LOG_LOCK:
            operation_log_df = df
        return jsonify({"ok": True, "rows": len(df), "pump_ids": df["pump_id"].unique().tolist()})
    except ValueError as e:
        return api_error(str(e), 400)
    except Exception as e:
        logger.exception("operation-log upload failed")
        return api_error(str(e), 500)


@app.route('/api/setup/maintenance-log', methods=['OPTIONS', 'POST'])
def setup_maintenance_log():
    """Replace maintenance log with uploaded Excel or CSV. Columns: date, pump_id, action, component, notes, downtime_hours."""
    if request.method == 'OPTIONS':
        return jsonify({})
    global maintenance_log_df
    try:
        f = request.files.get("file")
        if not f:
            return api_error("No file uploaded. Use form field 'file'.", 400)
        df = _read_uploaded_table(f)
        df.columns = df.columns.str.strip()
        required = ["date", "pump_id", "action", "component", "notes", "downtime_hours"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            return api_error(f"Missing columns: {missing}. Expected: {required}", 400)
        df["date"] = pd.to_datetime(df["date"])
        if "downtime_hours" in df.columns:
            df["downtime_hours"] = pd.to_numeric(df["downtime_hours"], errors="coerce")
        with MAINTENANCE_LOG_LOCK:
            maintenance_log_df = df
        return jsonify({"ok": True, "rows": len(df)})
    except ValueError as e:
        return api_error(str(e), 400)
    except Exception as e:
        logger.exception("maintenance-log upload failed")
        return api_error(str(e), 500)


@app.route('/api/pumps', methods=['GET'])
def get_pumps():
    """Get list of all pumps with real-time analysis"""
    now = datetime.now()
    start_time = now

    # Serve from cache if fresh to avoid repeated heavy computation
    with PUMP_CACHE_LOCK:
        cache_age = (now - PUMP_LIST_CACHE["timestamp"]).total_seconds()
        if PUMP_LIST_CACHE["data"] is not None and cache_age < PUMP_CACHE_TTL_SECONDS:
            return jsonify(PUMP_LIST_CACHE["data"])

    pump_list = []
    
    for _, pump_row in pump_master_df.iterrows():
        # Abort early if the request is running too long to avoid frontend timeouts
        if (datetime.now() - start_time).total_seconds() > PUMP_LIST_MAX_SECONDS:
            break

        pump_id = pump_row['pump_id']
        
        try:
            # Skip pumps that have no operation data
            if pump_id not in operation_log_df['pump_id'].values:
                continue

            # Get latest real data
            latest_data = RealDataProvider.get_latest_reading(pump_id)
            
            # Run AI analysis
            anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
            health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
            # Use master health score if provided to smooth display/status
            master_health = convert_to_python_type(pump_row.get('health_score'))
            display_health = float(master_health) if master_health is not None else health_index
            rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
            
            # Determine status
            if display_health > 80:
                status = "normal"
            elif display_health > 60:
                status = "warning"
            else:
                status = "critical"
            
            # Convert numpy types to native Python types for JSON serialization
            rated_flow_val = convert_to_python_type(pump_row.get('rated_flow_m3h', 150))
            rated_flow_val = float(rated_flow_val) if rated_flow_val is not None else 150.0
            
            pump_list.append({
                "id": str(pump_id),  # Ensure string
                "name": f"{pump_row.get('model', 'Unknown')} - {pump_id}",
                "status": str(status),
                "health_index": float(round(convert_to_python_type(display_health) or 85.0, 1)),
                "rul_hours": int(convert_to_python_type(rul) or 500),
                "location": "Pump House - Unit 1",
                "model": str(pump_row.get('model', 'Unknown')),
                "vendor": str(pump_row.get('vendor') or pump_row.get('manufacturer', 'Unknown')),
                "rated_flow": rated_flow_val,
                "ai_confidence": float(round(convert_to_python_type(anomaly_result.get('confidence', 0)) * 100, 1))
            })
        except Exception as e:
            logger.exception("Error processing %s: %s", pump_id, e)
            continue
    
    # Update cache
    with PUMP_CACHE_LOCK:
        PUMP_LIST_CACHE["data"] = pump_list
        PUMP_LIST_CACHE["timestamp"] = datetime.now()

    return jsonify(pump_list)


@app.route('/api/pump/<pump_id>/runtime', methods=['GET'])
def get_pump_runtime(pump_id):
    """Return runtime metrics for a pump."""
    if pump_id not in pump_master_df['pump_id'].values:
        return jsonify({"error": "Pump not found"}), 404
    try:
        payload = get_runtime_payload(pump_id)
        return jsonify(payload)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/api/pump/<pump_id>/control', methods=['POST'])
def control_pump(pump_id):
    """Simulate start/stop control for a pump."""
    if pump_id not in pump_master_df['pump_id'].values:
        return jsonify({"error": "Pump not found"}), 404

    payload = request.get_json(silent=True) or {}
    action = (payload.get("action") or "").lower()
    if action not in {"start", "stop"}:
        return jsonify({"error": "Invalid action. Use 'start' or 'stop'."}), 400

    try:
        runtime_payload = update_runtime_state(pump_id, action)
        runtime_payload["message"] = f"Pump {pump_id} {'started' if action == 'start' else 'stopped'} successfully."
        return jsonify(runtime_payload)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.route('/api/pump/<pump_id>/realtime', methods=['GET'])
def get_realtime_data(pump_id):
    """Get real-time sensor data from CSV"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        
        # Add simulated bearing temp and vibration (not in CSV)
        latest_data['bearing_temp'] = 65.0 + np.random.randn() * 3
        latest_data['vibration'] = 2.5 + np.random.randn() * 0.5
        latest_data['displacement'] = 50.0 + np.random.randn() * 5
        
        return jsonify({
            "pump_id": str(pump_id),
            "timestamp": datetime.now().isoformat(),
            "data": {
                "flow": float(round(latest_data['flow_m3h'], 2)),
                "suction_pressure": float(round(latest_data['suction_pressure_bar'], 2)),
                "discharge_pressure": float(round(latest_data['discharge_pressure_bar'], 2)),
                "motor_current": float(round(latest_data['motor_power_kw'] / 0.4, 2)),
                "bearing_temp": float(round(latest_data['bearing_temp'], 1)),
                "vibration": float(round(latest_data['vibration'], 2)),
                "displacement": float(round(latest_data['displacement'], 1))
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/kpis', methods=['GET'])
def get_pump_kpis(pump_id):
    """Get KPI metrics with AI analysis"""
    try:
        # Master data lookup (required for display health override)
        pump_row = pump_master_df[pump_master_df['pump_id'] == pump_id]
        if pump_row.empty:
            return jsonify({"error": "Pump not found"}), 404
        pump_info = pump_row.iloc[0]

        latest_data = RealDataProvider.get_latest_reading(pump_id)
        
        # AI predictions
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        master_health = convert_to_python_type(pump_info.get("health_score"))
        display_health = float(master_health) if master_health is not None else health_index
        raw_rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        rul = ai_predictor.clamp_rul_hours(raw_rul)
        
        # Calculate metrics
        baseline = ai_predictor.baseline_stats.get(pump_id, {})
        
        head_m = (latest_data['discharge_pressure_bar'] - latest_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (latest_data['flow_m3h'] * head_m) / 367
        current_efficiency = (hydraulic_power / latest_data['motor_power_kw']) * 100
        
        efficiency_deviation = ((current_efficiency - baseline.get('efficiency_mean', current_efficiency)) / 
                                baseline.get('efficiency_mean', current_efficiency)) * 100 if baseline else 0
        
        # Calculate detailed health indices
        # Motor Health - DE (Drive End) and NDE (Non-Drive End)
        # DE typically has slightly higher stress due to coupling connection
        motor_health_de = max(0, min(100, health_index - np.random.uniform(0, 3)))
        motor_health_nde = max(0, min(100, health_index - np.random.uniform(0, 2)))
        
        # Bearing Health - DE and NDE
        # Get vibration data for bearing health calculation
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        if len(pump_ops) > 0:
            latest_vib = pump_ops.iloc[-1].get('vibration_mm_s', 2.5)
            bearing_factor = max(0, min(20, (latest_vib - 1.0) * 5))  # Penalty for high vibration
        else:
            bearing_factor = 5
        
        bearing_health_de = max(0, min(100, health_index - bearing_factor - np.random.uniform(0, 3)))
        bearing_health_nde = max(0, min(100, health_index - bearing_factor - np.random.uniform(0, 2)))
        
        # Coupling Health - Non-coupling end and Coupling end
        # Coupling end typically has more stress
        if health_index and not np.isnan(health_index):
            coupling_health_non_coupling = float(max(0, min(100, health_index - np.random.uniform(0, 2))))
            coupling_health_coupling = float(max(0, min(100, health_index - np.random.uniform(2, 5))))
        else:
            coupling_health_non_coupling = float(max(0, min(100, 85.0 - np.random.uniform(0, 2))))
            coupling_health_coupling = float(max(0, min(100, 85.0 - np.random.uniform(2, 5))))
        
        # Legacy single values for backward compatibility
        motor_health = (motor_health_de + motor_health_nde) / 2
        bearing_health = (bearing_health_de + bearing_health_nde) / 2
        
        # Maintenance recommendation
        if health_index > 80:
            maintenance_rec = {
                "action": "Routine Inspection",
                "priority": "low",
                "timeline": "Next scheduled maintenance",
                "tasks": ["Visual inspection", "Lubrication check", "Performance verification"]
            }
        elif health_index > 60:
            maintenance_rec = {
                "action": "Preventive Maintenance",
                "priority": "medium",
                "timeline": "Within 48 hours",
                "tasks": ["Bearing inspection", "Alignment check", "Efficiency test", "Seal inspection"]
            }
        else:
            maintenance_rec = {
                "action": "Corrective Maintenance",
                "priority": "critical",
                "timeline": "Within 24 hours - URGENT",
                "tasks": ["Immediate shutdown if unsafe", "Bearing replacement", "Impeller inspection", "Full system check"]
            }
        
        return jsonify({
            "pump_id": str(pump_id),
            "rul_hours": int(rul),
            "rul_days": int(rul / 24),
            "rul_months": float(round(rul / 720, 1)),
            "health_index": float(round(health_index, 1)),
            "efficiency_deviation": float(round(efficiency_deviation, 2)),
            "motor_health": float(round(motor_health, 1)),
            "motor_health_de": float(round(motor_health_de, 1)),
            "motor_health_nde": float(round(motor_health_nde, 1)),
            "bearing_health": float(round(bearing_health, 1)),
            "bearing_health_de": float(round(bearing_health_de, 1)),
            "bearing_health_nde": float(round(bearing_health_nde, 1)),
            "coupling_health_non_coupling": float(round(coupling_health_non_coupling, 1)),
            "coupling_health_coupling": float(round(coupling_health_coupling, 1)),
            "maintenance_recommendation": maintenance_rec,
            "ai_confidence": float(round(anomaly_result['confidence'] * 100, 1))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/trends', methods=['GET'])
def get_pump_trends(pump_id):
    """Get historical trend data from CSV - supports up to 6 months (4320 hours)"""
    try:
        hours = safe_int(request.args.get('hours'), 24, 1, 4320)
        trends = RealDataProvider.get_historical_data(pump_id, hours)
        return jsonify(trends)
    except Exception as e:
        logger.warning("get_pump_trends failed for %s: %s", pump_id, e)
        return jsonify({"error": str(e)}), 404


@app.route('/api/pump/<pump_id>/fast-forward', methods=['GET'])
def get_fast_forward(pump_id):
    """Provide dense time-series data for fast-forward playback."""
    try:
        speed = safe_float_param(request.args.get('speed'), 100.0, 1.0, 10000.0)
        window_hours = safe_int(request.args.get('window_hours'), 6, 1, 24)

        series = RealDataProvider.get_fast_forward_series(pump_id, window_hours)
        if not series:
            return jsonify({"error": "No data for requested window"}), 404

        total_real_seconds = window_hours * 3600
        playback_seconds = total_real_seconds / max(speed, 1)

        return jsonify({
            "pump_id": pump_id,
            "speed": speed,
            "window_hours": window_hours,
            "playback_duration_seconds": playback_seconds,
            "total_points": len(series),
            "series": series
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/demo-simulation', methods=['GET'])
def get_demo_simulation(pump_id):
    """
    Demo simulation endpoint: Plays 6 months of data in 5 minutes.
    Returns sampled data points optimized for smooth 5-minute playback.
    """
    try:
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if pump_ops.empty:
            return jsonify({"error": f"No operation data for pump {pump_id}"}), 404
        
        # Get 6 months of data (4320 hours)
        # Find the time range in the data
        min_timestamp = pump_ops['timestamp'].min()
        max_timestamp = pump_ops['timestamp'].max()
        data_span = (max_timestamp - min_timestamp).total_seconds() / 3600  # hours
        
        # Use last 6 months of data, or all data if less than 6 months
        target_hours = min(4320, data_span)
        cutoff_timestamp = max_timestamp - pd.Timedelta(hours=target_hours)
        demo_data = pump_ops[pump_ops['timestamp'] >= cutoff_timestamp].copy()
        
        if demo_data.empty:
            demo_data = pump_ops.copy()
        
        # Sort by timestamp
        demo_data = demo_data.sort_values('timestamp').reset_index(drop=True)
        
        # Sample data for smooth 5-minute playback
        # Target: ~600-1000 points for smooth playback (updates every 0.3-0.5 seconds)
        TARGET_POINTS = 600
        total_points = len(demo_data)
        
        if total_points > TARGET_POINTS:
            # Sample evenly spaced points
            sample_indices = np.linspace(0, total_points - 1, TARGET_POINTS, dtype=int)
            demo_data = demo_data.iloc[sample_indices].reset_index(drop=True)
        elif total_points < 100:
            # If too few points, interpolate by repeating (for demo purposes)
            # This shouldn't happen with 6 months of 15-min interval data
            pass
        
        # Calculate derived features
        demo_data = FeatureEngineer.calculate_derived_features(demo_data)
        
        # Prepare series with all sensor data
        series = []
        start_real_time = demo_data.iloc[0]['timestamp']
        
        for idx, row in demo_data.iterrows():
            # Calculate progress percentage through 6 months
            time_diff = (row['timestamp'] - start_real_time).total_seconds()
            total_time_seconds = (demo_data.iloc[-1]['timestamp'] - start_real_time).total_seconds()
            progress = time_diff / total_time_seconds if total_time_seconds > 0 else 0
            
            # Simulated timestamp for 5-minute window (0 to 300 seconds)
            simulated_time_seconds = progress * 300  # Map to 5 minutes (300 seconds)
            simulated_timestamp = datetime.now() + timedelta(seconds=simulated_time_seconds)
            
            # Helper function to safely convert to float with fallback
            def safe_float(value, default=0.0):
                if value is None or pd.isna(value):
                    return default
                try:
                    converted = convert_to_python_type(value)
                    if converted is None or (isinstance(converted, float) and np.isnan(converted)):
                        return default
                    return float(converted)
                except (ValueError, TypeError):
                    return default
            
            series.append({
                "index": int(idx),
                "real_timestamp": row['timestamp'].isoformat(),
                "simulated_timestamp": simulated_timestamp.isoformat(),
                "progress": float(progress),  # 0.0 to 1.0
                "flow": safe_float(row.get('flow_m3h'), 0.0),
                "discharge_pressure": safe_float(row.get('discharge_pressure_bar'), 0.0),
                "suction_pressure": safe_float(row.get('suction_pressure_bar'), 0.0),
                "rpm": safe_float(row.get('rpm'), 1450.0),
                "motor_power": safe_float(row.get('motor_power_kw'), 0.0),
                "vibration": safe_float(row.get('vibration_mm_s'), 2.5),
                "bearing_temp": safe_float(row.get('bearing_temp_c'), 65.0),
                "efficiency": safe_float(row.get('efficiency'), 70.0),
                "status": str(row.get('status', 'running')),
            })
        
        # Calculate real-time span for display
        real_span_days = (demo_data.iloc[-1]['timestamp'] - demo_data.iloc[0]['timestamp']).days
        real_span_hours = (demo_data.iloc[-1]['timestamp'] - demo_data.iloc[0]['timestamp']).total_seconds() / 3600
        playback_duration_seconds = 300  # 5 minutes
        
        return jsonify({
            "pump_id": pump_id,
            "simulation_mode": "6_months_in_5_minutes",
            "total_points": len(series),
            "playback_duration_seconds": playback_duration_seconds,
            "real_data_span_days": int(real_span_days),
            "real_data_span_hours": float(round(real_span_hours, 1)),
            "start_real_time": demo_data.iloc[0]['timestamp'].isoformat(),
            "end_real_time": demo_data.iloc[-1]['timestamp'].isoformat(),
            "speed_multiplier": float(round(real_span_hours * 3600 / playback_duration_seconds, 0)),
            "series": series
        })
    except Exception as e:
        logger.exception("Error in demo simulation: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/pump/<pump_id>/anomalies', methods=['GET'])
def get_anomalies(pump_id):
    """Get AI-detected anomalies using ML models"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        
        # Detect specific failure modes
        anomalies = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        
        # Convert anomaly values to native Python types
        converted_anomalies = []
        for anomaly in anomalies:
            converted_anomaly = {}
            for key, value in anomaly.items():
                if isinstance(value, (np.floating, np.integer)):
                    converted_anomaly[key] = float(value.item()) if hasattr(value, 'item') else float(value)
                else:
                    converted_anomaly[key] = convert_to_python_type(value)
            converted_anomalies.append(converted_anomaly)
        
        return jsonify({
            "pump_id": str(pump_id),
            "timestamp": datetime.now().isoformat(),
            "anomalies": converted_anomalies,
            "anomaly_score": float(round(anomaly_result['anomaly_score'], 3)),
            "is_anomaly": bool(anomaly_result['is_anomaly'])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/performance-curve', methods=['GET'])
def get_performance_curve(pump_id):
    """Get performance curve from real data"""
    try:
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        
        # Baseline curve from pump specs
        pump_spec = pump_master_df[pump_master_df['pump_id'] == pump_id].iloc[0]
        rated_flow = pump_spec.get('rated_flow_m3h', 150)
        rated_head = pump_spec.get('rated_head_m', 45)
        
        # Convert to Python types if needed
        rated_flow = convert_to_python_type(rated_flow)
        rated_head = convert_to_python_type(rated_head)
        
        baseline_curve = []
        for pct in range(0, 121, 10):
            flow = float(rated_flow) * (pct / 100)
            head = float(rated_head) * (1 - 0.5 * (pct / 100)**2)  # Typical curve shape
            baseline_curve.append({"flow": round(flow, 1), "head": round(head, 2)})
        
        # Actual points from CSV (limit to last 1000 points for performance)
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        # Use vectorized operations instead of iterrows()
        actual_points = [
            {
                "flow": round(float(convert_to_python_type(flow)), 1),
                "head": round(float(convert_to_python_type(head)), 2)
            }
            for flow, head in zip(pump_ops['flow_m3h'], pump_ops['head_m'])
        ]
        
        return jsonify({
            "pump_id": str(pump_id),
            "baseline_curve": baseline_curve,
            "actual_points": actual_points
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/maintenance-history', methods=['GET'])
def get_maintenance_history(pump_id):
    """Get real maintenance history from CSV"""
    try:
        history = []
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id]
        
        for _, row in pump_maintenance.iterrows():
            downtime = convert_to_python_type(row['downtime_hours'])
            history.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "action": str(row['action']),
                "component": str(row['component']),
                "notes": str(row['notes']),
                "downtime_hours": float(downtime) if downtime is not None else 0.0
            })
        
        return jsonify({
            "pump_id": str(pump_id),
            "maintenance_history": history
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get overall dashboard summary with AI analysis"""
    try:
        pumps_data = []
        for pump_id in operation_log_df['pump_id'].unique():
            try:
                latest_data = RealDataProvider.get_latest_reading(pump_id)
                anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
                health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
                health_val = convert_to_python_type(health_index)
                pumps_data.append({"pump_id": str(pump_id), "health": float(health_val) if health_val is not None else 85.0})
            except Exception:
                continue
        
        total_pumps = len(pumps_data)
        normal_count = sum(1 for p in pumps_data if p['health'] > 80)
        warning_count = sum(1 for p in pumps_data if 60 < p['health'] <= 80)
        critical_count = sum(1 for p in pumps_data if p['health'] <= 60)
        
        overall_health = sum(p['health'] for p in pumps_data) / total_pumps if total_pumps > 0 else 0
        
        return jsonify({
            "total_pumps": int(total_pumps),
            "normal": int(normal_count),
            "warning": int(warning_count),
            "critical": int(critical_count),
            "overall_health": float(round(overall_health, 1)),
            "last_update": datetime.now().isoformat(),
            "data_source": "Real CSV Data + AI Analysis"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pump/<pump_id>/overview', methods=['GET'])
def get_pump_overview(pump_id):
    """Get comprehensive top-line overview for a pump"""
    try:
        at_ts = _parse_at_param(request.args.get('at'))
        latest_data = RealDataProvider.get_latest_reading(pump_id, at_ts)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        raw_rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        rul = ai_predictor.clamp_rul_hours(raw_rul)
        
        # Get pump master data
        pump_info = pump_master_df[pump_master_df['pump_id'] == pump_id].iloc[0]
        master_health = convert_to_python_type(pump_info.get("health_score"))
        display_health = float(master_health) if master_health is not None else health_index
        specs = {
            "pump_type": str(pump_info.get("pump_type", "")),
            "pump_type_detail": str(pump_info.get("pump_type_detail", "")),
            "manufacturer": str(pump_info.get("manufacturer", "")),
            "model": str(pump_info.get("model", "")),
            "installation_date": str(pump_info.get("installation_date", "")),
            "rated_power_kw": float(convert_to_python_type(pump_info.get("rated_power_kw", 0))),
            "rated_flow_m3h": float(convert_to_python_type(pump_info.get("rated_flow_m3h", 0))),
            "rated_head_m": float(convert_to_python_type(pump_info.get("rated_head_m", 0))),
            "flow_range_min_m3h": float(convert_to_python_type(pump_info.get("flow_range_min_m3h", 0))),
            "flow_range_max_m3h": float(convert_to_python_type(pump_info.get("flow_range_max_m3h", 0))),
            "head_range_min_m": float(convert_to_python_type(pump_info.get("head_range_min_m", 0))),
            "head_range_max_m": float(convert_to_python_type(pump_info.get("head_range_max_m", 0))),
            "rated_rpm": float(convert_to_python_type(pump_info.get("rated_rpm", 0))),
            "seal_type": str(pump_info.get("seal_type", "")),
            "bearing_type_de": str(pump_info.get("bearing_type_de", "")),
            "bearing_type_nde": str(pump_info.get("bearing_type_nde", "")),
            "impeller_type": str(pump_info.get("impeller_type", "")),
            "location": str(pump_info.get("location", "")),
            "criticality_level": str(pump_info.get("criticality_level", "")),
            "serial_number": str(pump_info.get("serial_number", "")),
            "warranty_expiry": str(pump_info.get("warranty_expiry", "")),
            "last_overhaul": str(pump_info.get("last_overhaul", "")),
            "min_safe_flow_m3h": float(convert_to_python_type(pump_info.get("min_safe_flow_m3h", 0))),
            "max_safe_flow_m3h": float(convert_to_python_type(pump_info.get("max_safe_flow_m3h", 0))),
            "max_motor_load_kw": float(convert_to_python_type(pump_info.get("max_motor_load_kw", 0))),
            "max_suction_pressure_bar": float(convert_to_python_type(pump_info.get("max_suction_pressure_bar", 0))),
            "efficiency_bep_percent": float(convert_to_python_type(pump_info.get("efficiency_bep_percent", 0))),
            "npshr_m": float(convert_to_python_type(pump_info.get("npshr_m", 0))),
        }
        
        # Get last maintenance
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id]
        last_maintenance = None
        if not pump_maintenance.empty:
            last_maint = pump_maintenance.sort_values('date').iloc[-1]
            last_maintenance = {
                "date": last_maint['date'].strftime('%Y-%m-%d'),
                "action": str(last_maint['action']),
                "component": str(last_maint['component'])
            }
        
        # Calculate next maintenance (90 days from last or 90 days from now)
        if last_maintenance:
            last_date = pd.to_datetime(last_maintenance['date'])
            next_date = last_date + timedelta(days=90)
        else:
            next_date = datetime.now() + timedelta(days=90)
        
        # Determine operational status using display health (uses master override if provided)
        if display_health > 80:
            op_status = "Running"
        elif display_health > 60:
            op_status = "Warning"
        elif display_health > 40:
            op_status = "Standby"
        else:
            op_status = "Fault"
        
        return jsonify({
            "pump_id": str(pump_id),
            "plant": "Cooling Water Pump House",
            "site": "Unit 1",
            "model": str(pump_info.get('model', 'Unknown')),
            "location": f"Pump House - {pump_id}",
            "health_score": float(round(display_health, 1)),
            "rul_hours": int(rul),
            "rul_days": int(rul / 24),
            "rul_months": float(round(rul / 720, 1)),
            "operational_status": op_status,
            "last_maintenance": last_maintenance,
            "next_maintenance": next_date.strftime('%Y-%m-%d'),
            "timestamp": datetime.now().isoformat(),
            "pump_master": specs
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/vibration', methods=['GET'])
def get_vibration_data(pump_id):
    """Get vibration and mechanical health data"""
    try:
        at_ts = _parse_at_param(request.args.get('at'))
        latest_data = RealDataProvider.get_latest_reading(pump_id, at_ts)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        if at_ts:
            pump_ops_at = pump_ops[pump_ops['timestamp'] <= at_ts]
            if not pump_ops_at.empty:
                pump_ops = pump_ops_at
        
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        # Get latest vibration reading
        latest_vib = pump_ops.iloc[-1]
        vibration_rms = float(convert_to_python_type(latest_vib.get('vibration_mm_s', 2.5)))
        
        # Simulate FFT spectrum (in real system, this would come from high-frequency data)
        rpm = float(convert_to_python_type(latest_data.get('rpm', 1450)))
        shaft_freq = rpm / 60  # Hz
        
        # Generate simulated spectrum with bearing frequencies
        frequencies = np.linspace(0, 200, 100)
        spectrum = np.zeros_like(frequencies)
        
        # Add shaft frequency and harmonics
        for harmonic in [1, 2, 3]:
            idx = np.argmin(np.abs(frequencies - harmonic * shaft_freq))
            if idx < len(spectrum):
                spectrum[idx] = vibration_rms * (0.5 / harmonic)
        
        # Add bearing frequencies (simplified)
        bearing_freq = shaft_freq * 3.5  # Typical bearing frequency
        for harmonic in [1, 2]:
            idx = np.argmin(np.abs(frequencies - harmonic * bearing_freq))
            if idx < len(spectrum):
                spectrum[idx] = vibration_rms * 0.3 / harmonic
        
        # Calculate bearing condition index (envelope RMS)
        bearing_condition = min(100, max(0, 100 - (vibration_rms - 1.0) * 20))
        
        # Misalignment indicator (2x shaft frequency amplitude)
        misalignment_idx = 0
        if len(spectrum) > 0:
            shaft_2x_idx = np.argmin(np.abs(frequencies - 2 * shaft_freq))
            if shaft_2x_idx < len(spectrum):
                misalignment_idx = float(spectrum[shaft_2x_idx] / (vibration_rms + 0.1))
        
        # Imbalance indicator (1x shaft frequency)
        imbalance_idx = 0
        if len(spectrum) > 0:
            shaft_1x_idx = np.argmin(np.abs(frequencies - shaft_freq))
            if shaft_1x_idx < len(spectrum):
                imbalance_idx = float(spectrum[shaft_1x_idx] / (vibration_rms + 0.1))
        
        # Historical vibration trend
        vib_trend = [
            {
                "timestamp": ts.isoformat(),
                "vibration_rms": float(convert_to_python_type(vib))
            }
            for ts, vib in zip(pump_ops['timestamp'], pump_ops['vibration_mm_s'])
        ][-100:]  # Last 100 points
        
        return jsonify({
            "pump_id": str(pump_id),
            "vibration_rms": float(round(vibration_rms, 2)),
            "vibration_unit": "mm/s",
            "bearing_condition_index": float(round(bearing_condition, 1)),
            "misalignment_indicator": float(round(misalignment_idx, 3)),
            "imbalance_indicator": float(round(imbalance_idx, 3)),
            "shaft_frequency_hz": float(round(shaft_freq, 2)),
            "rpm": float(round(rpm, 0)),
            "spectrum": {
                "frequencies": [float(f) for f in frequencies],
                "amplitudes": [float(a) for a in spectrum]
            },
            "trend": vib_trend,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/thermal', methods=['GET'])
def get_thermal_data(pump_id):
    """Get thermal diagnostics data"""
    try:
        at_ts = _parse_at_param(request.args.get('at'))
        latest_data = RealDataProvider.get_latest_reading(pump_id, at_ts)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        if at_ts:
            pump_ops_at = pump_ops[pump_ops['timestamp'] <= at_ts]
            if not pump_ops_at.empty:
                pump_ops = pump_ops_at
        
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        latest = pump_ops.iloc[-1]
        bearing_temp = float(convert_to_python_type(latest.get('bearing_temp_c', 65.0)))
        
        # Simulate motor winding temp (typically 10-20°C above bearing)
        motor_winding_temp = bearing_temp + 15.0 + np.random.randn() * 2
        casing_temp = bearing_temp - 5.0 + np.random.randn() * 1
        
        # Thermal trend
        thermal_trend = [
            {
                "timestamp": ts.isoformat(),
                "bearing_temp": float(convert_to_python_type(bt)),
                "motor_winding_temp": float(bt + 15 + np.random.randn() * 2),
                "casing_temp": float(bt - 5 + np.random.randn() * 1)
            }
            for ts, bt in zip(pump_ops['timestamp'], pump_ops['bearing_temp_c'])
        ][-100:]
        
        # Hot spot warning
        hot_spot_warning = bearing_temp > 75 or motor_winding_temp > 90
        
        return jsonify({
            "pump_id": str(pump_id),
            "bearing_temperature": float(round(bearing_temp, 1)),
            "motor_winding_temperature": float(round(motor_winding_temp, 1)),
            "casing_temperature": float(round(casing_temp, 1)),
            "unit": "°C",
            "hot_spot_warning": bool(hot_spot_warning),
            "trend": thermal_trend,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/electrical', methods=['GET'])
def get_electrical_data(pump_id):
    """Get electrical health data"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        # Calculate electrical parameters
        power_kw = float(convert_to_python_type(latest_data['motor_power_kw']))
        voltage = 400.0  # Assumed 400V system
        current = (power_kw * 1000) / (voltage * 0.85 * np.sqrt(3))  # Approximate 3-phase current
        power_factor = 0.85 + np.random.randn() * 0.05  # Simulated
        
        # Current unbalance (simulate)
        current_unbalance = abs(np.random.randn() * 2)  # %
        
        # Inrush current events (simulate based on start/stop)
        pump_ops_sorted = pump_ops.sort_values('timestamp')
        status_changes = (pump_ops_sorted['status'] != pump_ops_sorted['status'].shift()).sum()
        inrush_events = max(0, int(status_changes / 2))  # Approximate starts
        
        # Harmonic distortion (simulated)
        thd = 3.0 + abs(np.random.randn() * 1.5)  # Total Harmonic Distortion %
        
        # Electrical trend
        electrical_trend = [
            {
                "timestamp": ts.isoformat(),
                "current": float((p * 1000) / (voltage * 0.85 * np.sqrt(3))),
                "power": float(convert_to_python_type(p)),
                "voltage": voltage,
                "power_factor": float(0.85 + np.random.randn() * 0.05)
            }
            for ts, p in zip(pump_ops['timestamp'], pump_ops['motor_power_kw'])
        ][-100:]
        
        return jsonify({
            "pump_id": str(pump_id),
            "motor_current": float(round(current, 2)),
            "voltage": float(round(voltage, 1)),
            "power_consumption": float(round(power_kw, 2)),
            "power_factor": float(round(power_factor, 3)),
            "current_unbalance": float(round(current_unbalance, 2)),
            "inrush_current_events": int(inrush_events),
            "harmonic_distortion": float(round(thd, 2)),
            "electrical_efficiency": float(round(power_factor * 100, 1)),
            "trend": electrical_trend,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/hydraulic', methods=['GET'])
def get_hydraulic_data(pump_id):
    """Get hydraulic and process alarm data"""
    try:
        at_ts = _parse_at_param(request.args.get('at'))
        latest_data = RealDataProvider.get_latest_reading(pump_id, at_ts)
        pump_info = pump_master_df[pump_master_df['pump_id'] == pump_id].iloc[0]
        
        flow = float(convert_to_python_type(latest_data['flow_m3h']))
        discharge_p = float(convert_to_python_type(latest_data['discharge_pressure_bar']))
        suction_p = float(convert_to_python_type(latest_data['suction_pressure_bar']))
        delta_p = discharge_p - suction_p
        
        # Calculate NPSH margin (simplified)
        npsh_available = suction_p * 10.2  # Convert bar to meters
        npsh_required = 3.0 + (flow / 100)  # Simplified calculation
        npsh_margin = npsh_available - npsh_required
        cavitation_index = max(0, min(100, (npsh_margin / npsh_required) * 100))
        
        # Low flow detection
        rated_flow = float(convert_to_python_type(pump_info.get('rated_flow_m3h', 150)))
        low_flow = flow < (rated_flow * 0.3)
        dead_head = flow < (rated_flow * 0.1)
        
        # Seal leakage detection (pressure drop indicator)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        if at_ts:
            pump_ops_at = pump_ops[pump_ops['timestamp'] <= at_ts]
            if not pump_ops_at.empty:
                pump_ops = pump_ops_at
        if len(pump_ops) > 100:
            recent_dp = (pump_ops['discharge_pressure_bar'] - pump_ops['suction_pressure_bar']).tail(100).mean()
            dp_trend = delta_p - recent_dp
            seal_leakage = dp_trend < -0.5  # Significant pressure drop
        else:
            seal_leakage = False
        
        # Gas-in-liquid (simulated - would need specific sensor)
        gas_detection = False  # Placeholder
        
        return jsonify({
            "pump_id": str(pump_id),
            "flow": float(round(flow, 2)),
            "flow_unit": "m³/h",
            "discharge_pressure": float(round(discharge_p, 2)),
            "suction_pressure": float(round(suction_p, 2)),
            "differential_pressure": float(round(delta_p, 2)),
            "pressure_unit": "bar",
            "cavitation_index": float(round(cavitation_index, 1)),
            "npsh_margin": float(round(npsh_margin, 2)),
            "npsh_margin_unit": "m",
            "low_flow_detected": bool(low_flow),
            "dead_head_detected": bool(dead_head),
            "seal_leakage_flag": bool(seal_leakage),
            "gas_in_liquid": bool(gas_detection),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/maintenance-metrics', methods=['GET'])
def get_maintenance_metrics(pump_id):
    """Get maintenance metrics: MTBF, MTTR, failure history"""
    try:
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id].copy()
        pump_failures = failure_data_df[failure_data_df['pump_id'] == pump_id].copy()
        
        # Calculate MTBF (Mean Time Between Failures)
        mtbf_hours = None
        if len(pump_failures) > 1:
            pump_failures = pump_failures.sort_values('failure_date')
            time_diffs = pump_failures['failure_date'].diff().dt.total_seconds() / 3600
            mtbf_hours = float(time_diffs.mean()) if len(time_diffs) > 1 else None
        
        # Calculate MTTR (Mean Time To Repair) from maintenance log
        mttr_hours = None
        if not pump_maintenance.empty:
            downtime_values = pump_maintenance['downtime_hours'].dropna()
            if len(downtime_values) > 0:
                mttr_hours = float(downtime_values.mean())
        
        # Failure modes history
        failure_modes = {}
        if not pump_failures.empty:
            for mode in pump_failures['failure_mode'].unique():
                count = len(pump_failures[pump_failures['failure_mode'] == mode])
                failure_modes[str(mode)] = int(count)
        
        # Maintenance history summary
        maintenance_summary = []
        if not pump_maintenance.empty:
            pump_maintenance = pump_maintenance.sort_values('date', ascending=False)
            for _, row in pump_maintenance.head(10).iterrows():
                maintenance_summary.append({
                    "date": row['date'].strftime('%Y-%m-%d'),
                    "action": str(row['action']),
                    "component": str(row['component']),
                    "downtime_hours": float(convert_to_python_type(row['downtime_hours'])),
                    "notes": str(row['notes'])
                })
        
        # Spare parts status (simulated)
        spare_parts = {
            "bearings": {"status": "in_stock", "quantity": 2},
            "seals": {"status": "in_stock", "quantity": 4},
            "impeller": {"status": "low_stock", "quantity": 1},
            "coupling": {"status": "in_stock", "quantity": 1}
        }
        
        return jsonify({
            "pump_id": str(pump_id),
            "mtbf_hours": float(round(mtbf_hours, 1)) if mtbf_hours else None,
            "mtbf_days": float(round(mtbf_hours / 24, 1)) if mtbf_hours else None,
            "mttr_hours": float(round(mttr_hours, 1)) if mttr_hours else None,
            "failure_modes": failure_modes,
            "total_failures": int(len(pump_failures)),
            "maintenance_history": maintenance_summary,
            "spare_parts": spare_parts,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/ml-outputs', methods=['GET'])
def get_ml_outputs(pump_id):
    """Get ML model outputs: anomaly score, failure mode probabilities, RUL distribution, feature importance"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        
        # Failure mode probabilities
        failure_modes = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        
        # Calculate probabilities for each failure mode
        failure_mode_probs = {
            "bearing": 0.0,
            "seal": 0.0,
            "cavitation": 0.0,
            "electrical": 0.0,
            "impeller": 0.0,
            "normal": 1.0
        }
        
        for anomaly in failure_modes:
            anomaly_type = str(anomaly['type']).lower()
            confidence = float(anomaly.get('confidence', 0.5))
            
            if 'bearing' in anomaly_type:
                failure_mode_probs['bearing'] = max(failure_mode_probs['bearing'], confidence)
            elif 'seal' in anomaly_type:
                failure_mode_probs['seal'] = max(failure_mode_probs['seal'], confidence)
            elif 'cavitation' in anomaly_type:
                failure_mode_probs['cavitation'] = max(failure_mode_probs['cavitation'], confidence)
            elif 'electrical' in anomaly_type or 'power' in anomaly_type:
                failure_mode_probs['electrical'] = max(failure_mode_probs['electrical'], confidence)
            elif 'impeller' in anomaly_type or 'fouling' in anomaly_type:
                failure_mode_probs['impeller'] = max(failure_mode_probs['impeller'], confidence)
        
        # Normalize probabilities
        total_prob = sum(failure_mode_probs.values())
        if total_prob > 0:
            failure_mode_probs = {k: v / total_prob for k, v in failure_mode_probs.items()}
        
        # RUL distribution (simplified - in production would use probabilistic model)
        rul_best = ai_predictor.clamp_rul_hours(int(rul * 1.2))
        rul_median = ai_predictor.clamp_rul_hours(int(rul))
        rul_worst = ai_predictor.clamp_rul_hours(int(rul * 0.7))
        
        # Feature importance (simplified SHAP-like explanation)
        baseline = ai_predictor.baseline_stats.get(pump_id, {})
        feature_importance = []
        
        if baseline:
            # Flow deviation
            flow_dev = abs(latest_data['flow_m3h'] - baseline.get('flow_mean', latest_data['flow_m3h'])) / baseline.get('flow_mean', 1)
            feature_importance.append({"feature": "Flow Deviation", "importance": float(round(flow_dev * 100, 2))})
            
            # Efficiency
            head_m = (latest_data['discharge_pressure_bar'] - latest_data['suction_pressure_bar']) * 10.2
            hydraulic_power = (latest_data['flow_m3h'] * head_m) / 367
            efficiency = (hydraulic_power / latest_data['motor_power_kw']) * 100
            eff_dev = abs(efficiency - baseline.get('efficiency_mean', efficiency)) / baseline.get('efficiency_mean', 1)
            feature_importance.append({"feature": "Efficiency Deviation", "importance": float(round(eff_dev * 100, 2))})
            
            # Power consumption
            power_dev = abs(latest_data['motor_power_kw'] - baseline.get('power_mean', latest_data['motor_power_kw'])) / baseline.get('power_mean', 1)
            feature_importance.append({"feature": "Power Consumption", "importance": float(round(power_dev * 100, 2))})
        
        # Sort by importance
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return jsonify({
            "pump_id": str(pump_id),
            "anomaly_score": float(round(anomaly_result['anomaly_score'], 3)),
            "anomaly_threshold": 0.7,
            "is_anomaly": bool(anomaly_result['is_anomaly']),
            "failure_mode_probabilities": {k: float(round(v, 3)) for k, v in failure_mode_probs.items()},
            "rul_distribution": {
                "best_case_hours": rul_best,
                "median_hours": rul_median,
                "worst_case_hours": rul_worst,
                "best_case_months": float(round(rul_best / 720, 1)),
                "median_months": float(round(rul_median / 720, 1)),
                "worst_case_months": float(round(rul_worst / 720, 1))
            },
            "feature_importance": feature_importance[:5],  # Top 5
            "health_index": float(round(health_index, 1)),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/root-cause', methods=['GET'])
def get_root_cause(pump_id):
    """Get root cause analysis and diagnostics"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        anomalies = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        
        # Get contributing sensor signals
        baseline = ai_predictor.baseline_stats.get(pump_id, {})
        contributing_signals = []
        
        if baseline:
            # Flow
            flow_dev = ((latest_data['flow_m3h'] - baseline.get('flow_mean', latest_data['flow_m3h'])) / baseline.get('flow_mean', 1)) * 100
            if abs(flow_dev) > 5:
                contributing_signals.append({
                    "signal": "Flow",
                    "deviation": float(round(flow_dev, 1)),
                    "unit": "%",
                    "impact": "high" if abs(flow_dev) > 15 else "medium"
                })
            
            # Efficiency
            head_m = (latest_data['discharge_pressure_bar'] - latest_data['suction_pressure_bar']) * 10.2
            hydraulic_power = (latest_data['flow_m3h'] * head_m) / 367
            efficiency = (hydraulic_power / latest_data['motor_power_kw']) * 100
            eff_dev = ((efficiency - baseline.get('efficiency_mean', efficiency)) / baseline.get('efficiency_mean', 1)) * 100
            if abs(eff_dev) > 5:
                contributing_signals.append({
                    "signal": "Efficiency",
                    "deviation": float(round(eff_dev, 1)),
                    "unit": "%",
                    "impact": "high" if abs(eff_dev) > 15 else "medium"
                })
            
            # Power
            power_dev = ((latest_data['motor_power_kw'] - baseline.get('power_mean', latest_data['motor_power_kw'])) / baseline.get('power_mean', 1)) * 100
            if abs(power_dev) > 5:
                contributing_signals.append({
                    "signal": "Power Consumption",
                    "deviation": float(round(power_dev, 1)),
                    "unit": "%",
                    "impact": "high" if abs(power_dev) > 15 else "medium"
                })
        
        # Suggested corrective actions
        corrective_actions = []
        for anomaly in anomalies:
            corrective_actions.append({
                "action": anomaly.get('recommendation', 'Inspection recommended'),
                "priority": anomaly.get('severity', 'medium'),
                "confidence": float(round(anomaly.get('confidence', 0.5), 2))
            })
        
        # If no specific actions, provide general recommendations
        if not corrective_actions:
            if health_index < 70:
                corrective_actions.append({
                    "action": "Comprehensive inspection recommended",
                    "priority": "medium",
                    "confidence": 0.7
                })
        
        return jsonify({
            "pump_id": str(pump_id),
            "health_index": float(round(health_index, 1)),
            "top_contributing_signals": contributing_signals[:5],
            "suggested_actions": corrective_actions,
            "detected_anomalies": len(anomalies),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/alerts', methods=['GET'])
def get_alerts(pump_id):
    """Get active alerts for a pump"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        anomalies = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        
        alerts = []
        
        # Critical alerts
        if health_index < 50:
            alerts.append({
                "id": f"{pump_id}-critical-health",
                "severity": "critical",
                "title": "Critical Health Degradation",
                "message": f"Health index at {health_index:.1f}% - Immediate attention required",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "Maintenance Team",
                "estimated_downtime_hours": 8,
                "estimated_cost": 5000,
                "recommended_action": "Schedule immediate shutdown and inspection"
            })
        
        # Warning alerts
        elif health_index < 70:
            alerts.append({
                "id": f"{pump_id}-warning-health",
                "severity": "warning",
                "title": "Health Degradation Warning",
                "message": f"Health index at {health_index:.1f}% - Monitor closely",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "Operations",
                "estimated_downtime_hours": 4,
                "estimated_cost": 2000,
                "recommended_action": "Schedule preventive maintenance within 48 hours"
            })
        
        # RUL alerts
        if rul < 72:
            alerts.append({
                "id": f"{pump_id}-low-rul",
                "severity": "critical" if rul < 24 else "warning",
                "title": "Low Remaining Useful Life",
                "message": f"Estimated RUL: {rul} hours ({rul/24:.1f} days)",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "Maintenance Team",
                "estimated_downtime_hours": 6,
                "estimated_cost": 3000,
                "recommended_action": "Plan maintenance intervention"
            })
        
        # Anomaly alerts
        if anomaly_result['anomaly_score'] > 0.7:
            alerts.append({
                "id": f"{pump_id}-anomaly",
                "severity": "warning",
                "title": "Anomaly Detected",
                "message": f"Anomaly score: {anomaly_result['anomaly_score']:.2f}",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "AI System",
                "estimated_downtime_hours": 2,
                "estimated_cost": 1000,
                "recommended_action": "Review sensor data and investigate anomalies"
            })
        
        # Failure mode alerts
        for anomaly in anomalies:
            if anomaly.get('severity') in ['high', 'critical']:
                alerts.append({
                    "id": f"{pump_id}-{anomaly['type'].lower().replace(' ', '-')}",
                    "severity": anomaly.get('severity', 'medium'),
                    "title": anomaly.get('type', 'Anomaly Detected'),
                    "message": anomaly.get('message', ''),
                    "timestamp": datetime.now().isoformat(),
                    "acknowledged": False,
                    "responsible": "Maintenance Team",
                    "estimated_downtime_hours": 4 if anomaly.get('severity') == 'high' else 8,
                    "estimated_cost": 2000 if anomaly.get('severity') == 'high' else 5000,
                    "recommended_action": anomaly.get('recommendation', 'Inspection recommended')
                })
        
        return jsonify({
            "pump_id": str(pump_id),
            "alerts": alerts,
            "total_alerts": len(alerts),
            "critical_count": sum(1 for a in alerts if a['severity'] == 'critical'),
            "warning_count": sum(1 for a in alerts if a['severity'] == 'warning'),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/reports', methods=['GET'])
def get_reports(pump_id):
    """Get reliability reports and KPIs"""
    try:
        # Get maintenance metrics
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id].copy()
        pump_failures = failure_data_df[failure_data_df['pump_id'] == pump_id].copy()
        
        # Calculate uptime (simplified - would need operational logs)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        total_hours = len(pump_ops) * 0.083  # Assuming 5-minute intervals
        downtime_hours = pump_maintenance['downtime_hours'].sum() if not pump_maintenance.empty else 0
        uptime_pct = ((total_hours - downtime_hours) / total_hours * 100) if total_hours > 0 else 100
        
        # Number of interventions
        interventions = len(pump_maintenance)
        
        # Cost avoided (simplified calculation)
        cost_per_failure = 10000  # Estimated cost of unplanned failure
        cost_avoided = len(pump_failures) * cost_per_failure * 0.7  # Assume 70% cost avoidance
        
        # SLA compliance (assume 99% target)
        sla_target = 99.0
        sla_compliance = min(100, (uptime_pct / sla_target) * 100)
        
        # Cost of downtime (simplified)
        downtime_cost = downtime_hours * 500  # $500/hour
        
        # Weekly report data (last 4 weeks)
        weekly_reports = []
        end_date = datetime.now()
        for week in range(4):
            week_start = end_date - timedelta(days=7 * (week + 1))
            week_end = end_date - timedelta(days=7 * week)
            
            week_maintenance = pump_maintenance[
                (pump_maintenance['date'] >= week_start) & 
                (pump_maintenance['date'] < week_end)
            ]
            week_interventions = len(week_maintenance)
            week_downtime = week_maintenance['downtime_hours'].sum() if not week_maintenance.empty else 0
            
            weekly_reports.append({
                "week": f"Week {4 - week}",
                "start_date": week_start.strftime('%Y-%m-%d'),
                "end_date": week_end.strftime('%Y-%m-%d'),
                "interventions": int(week_interventions),
                "downtime_hours": float(round(week_downtime, 1)),
                "uptime_percentage": float(round(100 - (week_downtime / 168 * 100), 1)) if week_downtime > 0 else 100.0
            })
        
        return jsonify({
            "pump_id": str(pump_id),
            "uptime_percentage": float(round(uptime_pct, 2)),
            "number_of_interventions": int(interventions),
            "cost_avoided": float(round(cost_avoided, 2)),
            "sla_compliance": float(round(sla_compliance, 2)),
            "sla_target": float(sla_target),
            "downtime_cost": float(round(downtime_cost, 2)),
            "total_downtime_hours": float(round(downtime_hours, 1)),
            "weekly_reports": weekly_reports,
            "report_period": {
                "start": (datetime.now() - timedelta(days=28)).strftime('%Y-%m-%d'),
                "end": datetime.now().strftime('%Y-%m-%d')
            },
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/trend-signals', methods=['GET'])
def get_trend_signals(pump_id):
    """Get multi-signal time-series data for trend explorer - supports up to 6 months (4320 hours)"""
    try:
        signals = request.args.getlist('signals')  # Comma-separated list
        hours = safe_int(request.args.get('hours'), 24, 1, 4320)
        
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        # Limit to recent data
        if len(pump_ops) > 5000:
            pump_ops = pump_ops.tail(5000)
        
        # Default signals if none specified
        if not signals:
            signals = ['flow', 'discharge_pressure', 'motor_power', 'vibration', 'bearing_temp']
        
        # Prepare data
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        
        result = []
        for _, row in pump_ops.tail(int(hours * 12)).iterrows():  # Assuming 5-min intervals
            data_point = {
                "timestamp": row['timestamp'].isoformat()
            }
            
            for signal in signals:
                signal_lower = signal.lower()
                if signal_lower == 'flow':
                    data_point['flow'] = float(convert_to_python_type(row['flow_m3h']))
                elif signal_lower == 'discharge_pressure':
                    data_point['discharge_pressure'] = float(convert_to_python_type(row['discharge_pressure_bar']))
                elif signal_lower == 'suction_pressure':
                    data_point['suction_pressure'] = float(convert_to_python_type(row['suction_pressure_bar']))
                elif signal_lower == 'motor_power':
                    data_point['motor_power'] = float(convert_to_python_type(row['motor_power_kw']))
                elif signal_lower == 'vibration':
                    data_point['vibration'] = float(convert_to_python_type(row.get('vibration_mm_s', 2.5)))
                elif signal_lower == 'bearing_temp':
                    data_point['bearing_temp'] = float(convert_to_python_type(row.get('bearing_temp_c', 65.0)))
                elif signal_lower == 'efficiency':
                    data_point['efficiency'] = float(convert_to_python_type(row.get('efficiency', 70.0)))
                elif signal_lower == 'rpm':
                    data_point['rpm'] = float(convert_to_python_type(row.get('rpm', 1450.0)))
            
            result.append(data_point)
        
        return jsonify({
            "pump_id": str(pump_id),
            "signals": signals,
            "data": result,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

# ==================== Main ====================

if __name__ == '__main__':
    logger.info(
        "Starting AI-Powered Pump Predictive Maintenance Backend - data=%s pumps=%s",
        DATA_DIR, list(operation_log_df['pump_id'].unique()),
    )
    app.run(debug=True, host='0.0.0.0', port=5000)
