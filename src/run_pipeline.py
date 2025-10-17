#!/usr/bin/env python3
"""
AI-based Pump Health Monitoring Tool - Pipeline Runner

This script orchestrates the different stages of the pump health monitoring pipeline:
- data: Load and preprocess raw data
- features: Extract degradation features from operational data
- models: Train machine learning models for pump health prediction
- dashboard: Launch the monitoring dashboard
"""

import argparse
import pandas as pd
import json
import os
import sys
from pathlib import Path

from sklearn.metrics import mean_absolute_error, roc_auc_score

# Add src directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from data_processing import load_pump_master, pump_performance
from features import compute_degradation_features
from models import train_xgb_regression, train_xgb_classifier


def load_data():
    """Load raw data files"""
    print("Loading data...")
    data_dir = Path(__file__).parent.parent / "data"
    
    # Load pump master data
    pump_master_df = pd.read_csv(data_dir / "pump_master.csv")
    pump_master_map = {}
    for _, row in pump_master_df.iterrows():
        pump_master_map[row['pump_id']] = load_pump_master(row.to_dict())
    
    # Load operational data
    operation_df = pd.read_csv(data_dir / "operation_log.csv")
    
    # Load maintenance data
    maintenance_df = pd.read_csv(data_dir / "maintenance_log.csv")
    
    print(f"Loaded {len(pump_master_df)} pumps, {len(operation_df)} operations, {len(maintenance_df)} maintenance records")
    
    return pump_master_map, operation_df, maintenance_df


def run_data_stage():
    """Stage 1: Data loading and preprocessing"""
    print("=" * 50)
    print("STAGE: DATA LOADING AND PREPROCESSING")
    print("=" * 50)
    
    pump_master_map, operation_df, maintenance_df = load_data()
    
    # Basic data validation
    print("\nData Summary:")
    print(f"Pump Master: {len(pump_master_map)} pumps")
    print(f"Operation Log: {len(operation_df)} records")
    print(f"Maintenance Log: {len(maintenance_df)} records")
    
    print("\nOperation data columns:", operation_df.columns.tolist())
    print("Maintenance data columns:", maintenance_df.columns.tolist())
    
    # Save processed data
    output_dir = Path(__file__).parent.parent / "data" / "processed"
    output_dir.mkdir(exist_ok=True)
    
    # Save pump master map as JSON for later use
    pump_master_serializable = {}
    for pump_id, pump_data in pump_master_map.items():
        pump_master_serializable[pump_id] = {
            k: v.tolist() if hasattr(v, 'tolist') else v 
            for k, v in pump_data.items()
        }
    
    with open(output_dir / "pump_master_map.json", "w") as f:
        json.dump(pump_master_serializable, f, indent=2)
    
    operation_df.to_csv(output_dir / "operation_log_clean.csv", index=False)
    maintenance_df.to_csv(output_dir / "maintenance_log_clean.csv", index=False)
    
    print(f"\nProcessed data saved to {output_dir}")
    return pump_master_map, operation_df, maintenance_df


def run_features_stage():
    """Stage 2: Feature extraction"""
    print("=" * 50)
    print("STAGE: FEATURE EXTRACTION")
    print("=" * 50)
    
    # Load processed data
    data_dir = Path(__file__).parent.parent / "data"
    processed_dir = data_dir / "processed"
    
    if not processed_dir.exists():
        print("Processed data not found. Running data stage first...")
        pump_master_map, operation_df, maintenance_df = run_data_stage()
    else:
        # Load from processed files
        with open(processed_dir / "pump_master_map.json", "r") as f:
            pump_master_serializable = json.load(f)
        
        # Convert back to proper format
        pump_master_map = {}
        for pump_id, pump_data in pump_master_serializable.items():
            pump_master_map[pump_id] = {
                k: pd.Series(v) if isinstance(v, list) and k.endswith(('_flow', '_head', '_eff')) else v
                for k, v in pump_data.items()
            }
        
        operation_df = pd.read_csv(processed_dir / "operation_log_clean.csv")
        maintenance_df = pd.read_csv(processed_dir / "maintenance_log_clean.csv")
    
    print("Computing degradation features...")
    features_df = compute_degradation_features(operation_df, pump_master_map, maintenance_df)
    
    print(f"\nFeature extraction complete. Generated {len(features_df)} feature records")
    print("Feature columns:", features_df.columns.tolist())
    
    # Save features
    features_df.to_csv(processed_dir / "features.csv", index=False)
    print(f"Features saved to {processed_dir / 'features.csv'}")
    
    return features_df


def run_models_stage():
    """Stage 3: Model training"""
    print("=" * 50)
    print("STAGE: MODEL TRAINING")
    print("=" * 50)
    
    # Load features
    processed_dir = Path(__file__).parent.parent / "data" / "processed"
    
    if not (processed_dir / "features.csv").exists():
        print("Features not found. Running feature extraction first...")
        features_df = run_features_stage()
    else:
        features_df = pd.read_csv(processed_dir / "features.csv")
    
    print(f"Loaded {len(features_df)} feature records for training")
    
    # Prepare data for modeling
    # Remove rows with missing critical features
    model_df = features_df.dropna(subset=['delta_eff', 'power_increase_pct', 'days_since_last_maint'])
    
    if len(model_df) == 0:
        print("No valid data for model training. Check feature extraction.")
        return
    
    print(f"Using {len(model_df)} records for training after removing missing values")
    
    # Feature selection for modeling
    feature_cols = [
        'flow_m3h', 'motor_power_kw', 'delta_eff', 'power_increase_pct', 
        'days_since_last_maint', 'delta_eff_roll7', 'motor_pow_std30'
    ]
    
    # Remove any columns that don't exist
    available_cols = [col for col in feature_cols if col in model_df.columns]
    X = model_df[available_cols].fillna(0)
    
    print(f"Using features: {available_cols}")
    
    # Create target variables for demonstration
    # In a real scenario, you'd have actual failure/health labels
    
    # Regression target: predict efficiency degradation
    y_regression = model_df['delta_eff']
    
    # Classification target: predict maintenance need (simplified rule-based)
    y_classification = (
        (model_df['delta_eff'] < -0.05) | 
        (model_df['power_increase_pct'] > 0.1) |
        (model_df['days_since_last_maint'] > 365)
    ).astype(int)
    
    # Simple train/validation split (last 20% as validation)
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_reg_train, y_reg_val = y_regression[:split_idx], y_regression[split_idx:]
    y_clf_train, y_clf_val = y_classification[:split_idx], y_classification[split_idx:]
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Validation set: {len(X_val)} samples")
    
    # Train regression model (efficiency degradation prediction)
    print("\nTraining efficiency degradation model...")
    reg_model = train_xgb_regression(X_train, y_reg_train, X_val, y_reg_val)
    reg_predictions = reg_model.predict(X_val)
    reg_mae = mean_absolute_error(y_reg_val, reg_predictions) 
    print(f"Regression MAE: {reg_mae:.4f}")
    
    # Train classification model (maintenance need prediction)
    print("\nTraining maintenance need prediction model...")
    clf_model = train_xgb_classifier(X_train, y_clf_train, X_val, y_clf_val)
    clf_predictions = clf_model.predict_proba(X_val)[:, 1]
    
    if len(set(y_clf_val)) > 1:  # Check if we have both classes
        clf_auc = roc_auc_score(y_clf_val, clf_predictions)
        print(f"Classification AUC: {clf_auc:.4f}")
    else:
        print("Classification: Only one class in validation set")
    
    # Save models
    models_dir = processed_dir / "models"
    models_dir.mkdir(exist_ok=True)
    
    reg_model.save_model(models_dir / "efficiency_degradation_model.json")
    clf_model.save_model(models_dir / "maintenance_need_model.json")
    
    # Save feature names for later use
    with open(models_dir / "feature_columns.json", "w") as f:
        json.dump(available_cols, f)
    
    print(f"\nModels saved to {models_dir}")
    
    return reg_model, clf_model


def run_dashboard_stage():
    """Stage 4: Launch dashboard"""
    print("=" * 50)
    print("STAGE: LAUNCHING DASHBOARD")
    print("=" * 50)
    
    try:
        from dashboard import main as dashboard_main
        print("Starting pump health monitoring dashboard...")
        dashboard_main()
    except ImportError:
        print("Dashboard module not found or has issues. Please check dashboard.py")
    except Exception as e:
        print(f"Error launching dashboard: {e}")


def main():
    """Main pipeline orchestrator"""
    parser = argparse.ArgumentParser(description="AI-based Pump Health Monitoring Pipeline")
    parser.add_argument(
        "--stage", 
        choices=["data", "features", "models", "dashboard", "all"],
        default="all",
        help="Which stage to run (default: all)"
    )
    
    args = parser.parse_args()
    
    print("AI-based Pump Health Monitoring Tool")
    print("=" * 50)
    
    if args.stage == "data":
        run_data_stage()
    elif args.stage == "features":
        run_features_stage()
    elif args.stage == "models":
        run_models_stage()
    elif args.stage == "dashboard":
        run_dashboard_stage()
    elif args.stage == "all":
        print("Running complete pipeline...")
        run_data_stage()
        run_features_stage()
        run_models_stage()
        print("\nPipeline complete! Use --stage dashboard to launch the monitoring interface.")
    
    print("\nPipeline execution finished.")


if __name__ == "__main__":
    main()