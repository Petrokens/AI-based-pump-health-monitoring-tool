"""
Example usage script demonstrating the pump health monitoring system
This script shows how to use all major components of the system
"""

import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

print("="*70)
print("Pump Health Monitoring System - Example Usage")
print("="*70)

# Import components
try:
    from data_ingestion.data_loader import PumpDataLoader
    from feature_engineering.feature_builder import PumpFeatureBuilder
    from rul_prediction.predictor import RULPredictor
    from config import (
        SENSOR_COLUMNS, TARGET_COLUMN, MODEL_CONFIG,
        HEALTH_THRESHOLDS, RAW_DATA_DIR, MODELS_DIR
    )
    print("✓ All modules imported successfully\n")
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nPlease install required packages:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

# Step 1: Generate/Load Data
print("\n" + "="*70)
print("STEP 1: Data Loading")
print("="*70)

data_loader = PumpDataLoader()
print("Generating synthetic pump sensor data...")
df = data_loader.generate_synthetic_data(n_samples=1000, n_pumps=3)

print(f"\nData generated:")
print(f"  - Total samples: {len(df)}")
print(f"  - Number of pumps: {df['pump_id'].nunique()}")
print(f"  - Time range: {df['timestamp'].min()} to {df['timestamp'].max()}")
print(f"  - Sensors: {', '.join(SENSOR_COLUMNS)}")

print("\nFirst few rows:")
print(df.head(3)[['pump_id', 'timestamp', 'flow_rate', 'temperature', 'vibration', 'rul']])

# Step 2: Feature Engineering
print("\n" + "="*70)
print("STEP 2: Feature Engineering")
print("="*70)

feature_builder = PumpFeatureBuilder(window_size=10)
print("Building features (rolling stats, lags, interactions, health indicators)...")
df_features = feature_builder.build_all_features(df, SENSOR_COLUMNS)

print(f"\nFeatures created:")
print(f"  - Original features: {len(df.columns)}")
print(f"  - Total features: {len(df_features.columns)}")
print(f"  - New features added: {len(df_features.columns) - len(df.columns)}")

# Show some example features
example_features = [col for col in df_features.columns if 'rolling_mean' in col][:3]
print(f"\nExample features: {', '.join(example_features)}")

# Step 3: Model Training
print("\n" + "="*70)
print("STEP 3: Model Training")
print("="*70)

predictor = RULPredictor(model_type='xgboost')
print("Preparing data for training...")

X_train, X_test, y_train, y_test = predictor.prepare_data(
    df_features,
    target_column=TARGET_COLUMN,
    test_size=MODEL_CONFIG['test_size'],
    random_state=MODEL_CONFIG['random_state']
)

print(f"  - Training samples: {len(X_train)}")
print(f"  - Test samples: {len(X_test)}")
print(f"  - Features used: {len(predictor.feature_columns)}")

print("\nTraining XGBoost model...")
predictor.train(X_train, y_train, xgb_params=MODEL_CONFIG['xgboost_params'])

# Step 4: Model Evaluation
print("\n" + "="*70)
print("STEP 4: Model Evaluation")
print("="*70)

print("Evaluating model performance...")
metrics = predictor.evaluate(X_test, y_test)

print(f"\nModel Performance:")
print(f"  - RMSE: {metrics['rmse']:.2f} hours")
print(f"  - MAE: {metrics['mae']:.2f} hours")
print(f"  - R² Score: {metrics['r2']:.3f}")

if metrics['r2'] > 0.8:
    print("  ✓ Excellent model performance!")
elif metrics['r2'] > 0.6:
    print("  ✓ Good model performance")
else:
    print("  ⚠ Model could be improved")

# Step 5: Feature Importance
print("\n" + "="*70)
print("STEP 5: Feature Importance")
print("="*70)

importance_df = predictor.get_feature_importance(top_n=10)
print("\nTop 10 Most Important Features:")
for idx, row in importance_df.iterrows():
    bar = "█" * int(row['importance'] * 50)
    print(f"  {row['feature']:30s} {bar} {row['importance']:.4f}")

# Step 6: Making Predictions
print("\n" + "="*70)
print("STEP 6: Making Predictions")
print("="*70)

# Get latest data for each pump
print("Predicting RUL for each pump...")
predictions = []

for pump_id in df_features['pump_id'].unique():
    df_pump = df_features[df_features['pump_id'] == pump_id].tail(1)
    
    feature_cols = [col for col in df_features.columns 
                   if col not in [TARGET_COLUMN, 'timestamp', 'pump_id']]
    X_pump = df_pump[feature_cols]
    
    rul_pred = predictor.predict(X_pump.values)[0]
    health_index = predictor.predict_health_index([rul_pred], max_rul=1000)[0]
    
    # Determine health status
    if health_index >= HEALTH_THRESHOLDS['excellent']:
        status = "🟢 Excellent"
    elif health_index >= HEALTH_THRESHOLDS['good']:
        status = "🟡 Good"
    elif health_index >= HEALTH_THRESHOLDS['fair']:
        status = "🟠 Fair"
    elif health_index >= HEALTH_THRESHOLDS['poor']:
        status = "🔴 Poor"
    else:
        status = "🔴 Critical"
    
    predictions.append({
        'pump_id': pump_id,
        'rul': rul_pred,
        'health_index': health_index,
        'status': status
    })
    
    print(f"\nPump {pump_id}:")
    print(f"  Status: {status}")
    print(f"  Health Index: {health_index*100:.1f}%")
    print(f"  Predicted RUL: {rul_pred:.0f} hours")
    
    if health_index < HEALTH_THRESHOLDS['fair']:
        print(f"  ⚠ Action Required: Schedule maintenance soon!")
    elif health_index < HEALTH_THRESHOLDS['good']:
        print(f"  ℹ Recommendation: Plan preventive maintenance")
    else:
        print(f"  ✓ Status: No immediate action required")

# Step 7: Summary
print("\n" + "="*70)
print("SUMMARY")
print("="*70)

total_pumps = len(predictions)
critical_pumps = sum(1 for p in predictions if p['health_index'] < HEALTH_THRESHOLDS['fair'])
good_pumps = sum(1 for p in predictions if p['health_index'] >= HEALTH_THRESHOLDS['good'])

print(f"\nFleet Overview:")
print(f"  Total pumps monitored: {total_pumps}")
print(f"  Pumps in good condition: {good_pumps}")
print(f"  Pumps requiring attention: {critical_pumps}")

avg_health = sum(p['health_index'] for p in predictions) / total_pumps
avg_rul = sum(p['rul'] for p in predictions) / total_pumps

print(f"\nFleet Averages:")
print(f"  Average health index: {avg_health*100:.1f}%")
print(f"  Average RUL: {avg_rul:.0f} hours")

# Step 8: Saving Results
print("\n" + "="*70)
print("STEP 8: Saving Model and Results")
print("="*70)

model_path = MODELS_DIR / "pump_rul_model_example.pkl"
predictor.save_model(model_path)
print(f"✓ Model saved to: {model_path}")

# Save predictions
import json
predictions_file = MODELS_DIR / "predictions_example.json"
with open(predictions_file, 'w') as f:
    json.dump(predictions, f, indent=2, default=str)
print(f"✓ Predictions saved to: {predictions_file}")

print("\n" + "="*70)
print("Example Complete!")
print("="*70)
print("\nNext steps:")
print("  1. Run 'cd src && python train_model.py' to train on full dataset")
print("  2. Run 'cd src && streamlit run dashboard.py' to launch the dashboard")
print("  3. Explore 'notebooks/pump_analysis.ipynb' for detailed analysis")
print("="*70)
