"""
Main script to run the complete pump health monitoring pipeline
"""
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from src.data_ingestion import PumpDataIngestion
from src.feature_engineering import PumpFeatureEngineering
from src.rul_prediction import RULPredictor


def main():
    """Run the complete pipeline"""
    
    print("="*60)
    print("Pump Health Monitoring - Digital Twin Pipeline")
    print("="*60)
    
    # Step 1: Data Ingestion
    print("\n[1/4] Data Ingestion...")
    ingestion = PumpDataIngestion()
    
    try:
        # Try to load existing data
        df = ingestion.load_sensor_data("pump_sensor_data.csv")
        print(f"Loaded existing data: {df.shape[0]} samples")
    except FileNotFoundError:
        # Generate synthetic data if not exists
        print("No existing data found. Generating synthetic sensor data...")
        df = ingestion.generate_sample_data(n_samples=10000)
    
    # Validate data
    is_valid, issues = ingestion.validate_data(df)
    if not is_valid:
        print(f"Data validation issues: {issues}")
        df = ingestion.clean_data(df)
        print("Data cleaned successfully")
    
    # Step 2: Feature Engineering
    print("\n[2/4] Feature Engineering...")
    fe = PumpFeatureEngineering()
    df_features = fe.engineer_all_features(df)
    
    print(f"Original features: {df.shape[1]}")
    print(f"After feature engineering: {df_features.shape[1]}")
    print(f"New features created: {df_features.shape[1] - df.shape[1]}")
    
    # Save processed data
    ingestion.save_processed_data(df_features, "pump_features.csv")
    
    # Step 3: Model Training
    print("\n[3/4] Model Training...")
    predictor = RULPredictor()
    metrics = predictor.train_all_models(df_features)
    
    # Save models
    predictor.save_models()
    print("\nAll models saved successfully")
    
    # Step 4: Feature Importance
    print("\n[4/4] Feature Importance Analysis...")
    importance = predictor.get_feature_importance(top_n=10)
    print("\nTop 10 most important features:")
    print(importance.to_string(index=False))
    
    print("\n" + "="*60)
    print("Pipeline completed successfully!")
    print("="*60)
    print("\nNext steps:")
    print("1. Run the dashboard: streamlit run src/dashboard.py")
    print("2. Explore the data: jupyter notebook notebooks/01_exploratory_data_analysis.ipynb")
    print("="*60)


if __name__ == "__main__":
    main()
