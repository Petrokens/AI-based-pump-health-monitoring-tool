"""
Tests for data loader module
"""

import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))


def test_imports():
    """Test that all modules can be imported"""
    try:
        from data_ingestion.data_loader import PumpDataLoader
        from feature_engineering.feature_builder import PumpFeatureBuilder
        from rul_prediction.predictor import RULPredictor
        import config
        print("✓ All modules imported successfully")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False


def test_data_loader():
    """Test data loader functionality"""
    try:
        from data_ingestion.data_loader import PumpDataLoader
        
        loader = PumpDataLoader()
        df = loader.generate_synthetic_data(n_samples=100, n_pumps=2)
        
        assert len(df) == 100, "Generated data size mismatch"
        assert 'pump_id' in df.columns, "Missing pump_id column"
        assert 'flow_rate' in df.columns, "Missing flow_rate column"
        assert 'rul' in df.columns, "Missing rul column"
        
        print("✓ Data loader test passed")
        return True
    except Exception as e:
        print(f"✗ Data loader test failed: {e}")
        return False


def test_feature_builder():
    """Test feature engineering"""
    try:
        from data_ingestion.data_loader import PumpDataLoader
        from feature_engineering.feature_builder import PumpFeatureBuilder
        from config import SENSOR_COLUMNS
        
        # Generate test data
        loader = PumpDataLoader()
        df = loader.generate_synthetic_data(n_samples=100, n_pumps=1)
        
        # Build features
        builder = PumpFeatureBuilder(window_size=5)
        df_features = builder.build_all_features(df, SENSOR_COLUMNS)
        
        assert len(df_features) == len(df), "Feature data size mismatch"
        assert len(df_features.columns) > len(df.columns), "No new features created"
        
        print(f"✓ Feature builder test passed (created {len(df_features.columns)} features)")
        return True
    except Exception as e:
        print(f"✗ Feature builder test failed: {e}")
        return False


if __name__ == "__main__":
    print("Running tests...\n")
    
    results = []
    results.append(test_imports())
    
    if results[0]:  # Only run other tests if imports work
        results.append(test_data_loader())
        results.append(test_feature_builder())
    
    print(f"\n{'='*50}")
    print(f"Tests passed: {sum(results)}/{len(results)}")
    print(f"{'='*50}")
