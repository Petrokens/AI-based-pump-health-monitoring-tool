"""
Configuration file for the pump health monitoring system
"""

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "src" / "models"

# Create directories if they don't exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Model configuration
MODEL_CONFIG = {
    "test_size": 0.2,
    "random_state": 42,
    "xgboost_params": {
        "n_estimators": 100,
        "max_depth": 6,
        "learning_rate": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": 42
    }
}

# Feature engineering configuration
FEATURE_CONFIG = {
    "window_size": 10,
    "rolling_features": ["mean", "std", "min", "max"],
    "lag_features": [1, 5, 10]
}

# Pump health thresholds
HEALTH_THRESHOLDS = {
    "excellent": 0.9,
    "good": 0.7,
    "fair": 0.5,
    "poor": 0.3,
    "critical": 0.0
}

# Sensor columns
SENSOR_COLUMNS = [
    "flow_rate",
    "pressure_in",
    "pressure_out",
    "temperature",
    "vibration",
    "power_consumption",
    "rpm"
]

# Target column
TARGET_COLUMN = "rul"  # Remaining Useful Life in hours
