"""
Main training pipeline for pump health monitoring model
"""

import pandas as pd
from pathlib import Path
import sys

# Add src to path
sys.path.append(str(Path(__file__).parent))

from data_ingestion.data_loader import PumpDataLoader
from feature_engineering.feature_builder import PumpFeatureBuilder
from rul_prediction.predictor import RULPredictor
from config import (
    RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR,
    SENSOR_COLUMNS, TARGET_COLUMN, MODEL_CONFIG
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Main training pipeline"""
    logger.info("Starting pump health monitoring model training pipeline...")
    
    # Step 1: Load data
    logger.info("Step 1: Loading data...")
    data_loader = PumpDataLoader()
    
    # Check if raw data exists, otherwise generate synthetic data
    raw_data_file = RAW_DATA_DIR / "pump_sensor_data.csv"
    df = data_loader.load_and_prepare(
        file_path=raw_data_file if raw_data_file.exists() else None,
        generate_synthetic=True
    )
    
    # Save raw data if generated
    if not raw_data_file.exists():
        df.to_csv(raw_data_file, index=False)
        logger.info(f"Saved synthetic data to {raw_data_file}")
    
    # Step 2: Feature engineering
    logger.info("Step 2: Engineering features...")
    feature_builder = PumpFeatureBuilder(window_size=10)
    df_features = feature_builder.build_all_features(df, SENSOR_COLUMNS)
    
    # Save processed data
    processed_data_file = PROCESSED_DATA_DIR / "pump_features.csv"
    df_features.to_csv(processed_data_file, index=False)
    logger.info(f"Saved processed features to {processed_data_file}")
    
    # Step 3: Train model
    logger.info("Step 3: Training RUL prediction model...")
    predictor = RULPredictor(model_type='xgboost')
    
    X_train, X_test, y_train, y_test = predictor.prepare_data(
        df_features,
        target_column=TARGET_COLUMN,
        test_size=MODEL_CONFIG['test_size'],
        random_state=MODEL_CONFIG['random_state']
    )
    
    predictor.train(X_train, y_train, xgb_params=MODEL_CONFIG['xgboost_params'])
    
    # Step 4: Evaluate model
    logger.info("Step 4: Evaluating model...")
    metrics = predictor.evaluate(X_test, y_test)
    
    # Get feature importance
    feature_importance = predictor.get_feature_importance(top_n=15)
    logger.info(f"Top features:\n{feature_importance}")
    
    # Step 5: Save model
    logger.info("Step 5: Saving model...")
    model_file = MODELS_DIR / "pump_rul_model.pkl"
    predictor.save_model(model_file)
    
    # Save metrics
    import json
    metrics_file = MODELS_DIR / "model_metrics.json"
    with open(metrics_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved metrics to {metrics_file}")
    
    logger.info("Training pipeline complete!")
    return predictor, metrics


if __name__ == "__main__":
    main()
