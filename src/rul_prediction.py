"""
RUL (Remaining Useful Life) Prediction Module
Implements machine learning models for predictive maintenance
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
from typing import Dict, Tuple, Optional


class RULPredictor:
    """Handles RUL prediction using multiple ML models"""
    
    def __init__(self, model_path: str = "models"):
        """
        Initialize RUL predictor
        
        Args:
            model_path: Path to save/load models
        """
        self.model_path = Path(model_path)
        self.model_path.mkdir(parents=True, exist_ok=True)
        
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.best_model_name = None
        
    def prepare_data(self, df: pd.DataFrame, target_col: str = 'rul', 
                    test_size: float = 0.2, random_state: int = 42) -> Tuple:
        """
        Prepare data for training
        
        Args:
            df: Input dataframe with features and target
            target_col: Name of target column
            test_size: Proportion of test set
            random_state: Random seed
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        # Separate features and target
        exclude_cols = ['timestamp', target_col, 'health_status']
        self.feature_columns = [col for col in df.columns if col not in exclude_cols]
        
        X = df[self.feature_columns]
        y = df[target_col]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, shuffle=False
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        return X_train_scaled, X_test_scaled, y_train.values, y_test.values
    
    def train_linear_regression(self, X_train, y_train) -> LinearRegression:
        """
        Train Linear Regression model
        
        Args:
            X_train: Training features
            y_train: Training target
            
        Returns:
            Trained model
        """
        print("Training Linear Regression...")
        model = LinearRegression()
        model.fit(X_train, y_train)
        return model
    
    def train_random_forest(self, X_train, y_train) -> RandomForestRegressor:
        """
        Train Random Forest model
        
        Args:
            X_train: Training features
            y_train: Training target
            
        Returns:
            Trained model
        """
        print("Training Random Forest...")
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        return model
    
    def train_gradient_boosting(self, X_train, y_train) -> GradientBoostingRegressor:
        """
        Train Gradient Boosting model
        
        Args:
            X_train: Training features
            y_train: Training target
            
        Returns:
            Trained model
        """
        print("Training Gradient Boosting...")
        model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        model.fit(X_train, y_train)
        return model
    
    def train_xgboost(self, X_train, y_train) -> xgb.XGBRegressor:
        """
        Train XGBoost model
        
        Args:
            X_train: Training features
            y_train: Training target
            
        Returns:
            Trained model
        """
        print("Training XGBoost...")
        model = xgb.XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            min_child_weight=1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        return model
    
    def evaluate_model(self, model, X_test, y_test, model_name: str) -> Dict:
        """
        Evaluate model performance
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Test target
            model_name: Name of the model
            
        Returns:
            Dictionary with evaluation metrics
        """
        y_pred = model.predict(X_test)
        
        metrics = {
            'model_name': model_name,
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'mae': mean_absolute_error(y_test, y_pred),
            'r2': r2_score(y_test, y_pred),
            'mape': np.mean(np.abs((y_test - y_pred) / (y_test + 1e-6))) * 100
        }
        
        print(f"\n{model_name} Performance:")
        print(f"  RMSE: {metrics['rmse']:.2f} days")
        print(f"  MAE: {metrics['mae']:.2f} days")
        print(f"  R²: {metrics['r2']:.4f}")
        print(f"  MAPE: {metrics['mape']:.2f}%")
        
        return metrics
    
    def train_all_models(self, df: pd.DataFrame) -> Dict:
        """
        Train all models and compare performance
        
        Args:
            df: Input dataframe with features and target
            
        Returns:
            Dictionary with all evaluation metrics
        """
        # Prepare data
        X_train, X_test, y_train, y_test = self.prepare_data(df)
        
        # Train models
        self.models['linear_regression'] = self.train_linear_regression(X_train, y_train)
        self.models['random_forest'] = self.train_random_forest(X_train, y_train)
        self.models['gradient_boosting'] = self.train_gradient_boosting(X_train, y_train)
        self.models['xgboost'] = self.train_xgboost(X_train, y_train)
        
        # Evaluate all models
        all_metrics = {}
        for name, model in self.models.items():
            metrics = self.evaluate_model(model, X_test, y_test, name)
            all_metrics[name] = metrics
        
        # Find best model based on RMSE
        best_model = min(all_metrics.items(), key=lambda x: x[1]['rmse'])
        self.best_model_name = best_model[0]
        print(f"\nBest model: {self.best_model_name} (RMSE: {best_model[1]['rmse']:.2f})")
        
        return all_metrics
    
    def save_models(self):
        """Save all trained models and scaler"""
        # Save scaler
        scaler_path = self.model_path / "scaler.joblib"
        joblib.dump(self.scaler, scaler_path)
        print(f"Scaler saved to {scaler_path}")
        
        # Save all models
        for name, model in self.models.items():
            model_path = self.model_path / f"{name}.joblib"
            joblib.dump(model, model_path)
            print(f"{name} saved to {model_path}")
        
        # Save feature columns
        feature_path = self.model_path / "feature_columns.joblib"
        joblib.dump(self.feature_columns, feature_path)
        
        # Save best model name
        best_model_path = self.model_path / "best_model.txt"
        with open(best_model_path, 'w') as f:
            f.write(self.best_model_name)
    
    def load_models(self):
        """Load all trained models and scaler"""
        # Load scaler
        scaler_path = self.model_path / "scaler.joblib"
        if scaler_path.exists():
            self.scaler = joblib.load(scaler_path)
        
        # Load models
        model_files = {
            'linear_regression': 'linear_regression.joblib',
            'random_forest': 'random_forest.joblib',
            'gradient_boosting': 'gradient_boosting.joblib',
            'xgboost': 'xgboost.joblib'
        }
        
        for name, filename in model_files.items():
            model_path = self.model_path / filename
            if model_path.exists():
                self.models[name] = joblib.load(model_path)
        
        # Load feature columns
        feature_path = self.model_path / "feature_columns.joblib"
        if feature_path.exists():
            self.feature_columns = joblib.load(feature_path)
        
        # Load best model name
        best_model_path = self.model_path / "best_model.txt"
        if best_model_path.exists():
            with open(best_model_path, 'r') as f:
                self.best_model_name = f.read().strip()
        
        print(f"Loaded {len(self.models)} models")
    
    def predict(self, df: pd.DataFrame, model_name: Optional[str] = None) -> np.ndarray:
        """
        Predict RUL for new data
        
        Args:
            df: Input dataframe with features
            model_name: Name of model to use (default: best model)
            
        Returns:
            Array of predictions
        """
        if not self.models:
            raise ValueError("No models loaded. Train or load models first.")
        
        # Use best model if not specified
        if model_name is None:
            model_name = self.best_model_name or list(self.models.keys())[0]
        
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        
        # Prepare features
        X = df[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.models[model_name].predict(X_scaled)
        
        # Ensure non-negative predictions
        predictions = np.maximum(predictions, 0)
        
        return predictions
    
    def get_feature_importance(self, model_name: Optional[str] = None, top_n: int = 20) -> pd.DataFrame:
        """
        Get feature importance for tree-based models
        
        Args:
            model_name: Name of model (default: best model)
            top_n: Number of top features to return
            
        Returns:
            DataFrame with feature importance
        """
        if model_name is None:
            model_name = self.best_model_name or 'random_forest'
        
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        
        model = self.models[model_name]
        
        # Check if model has feature_importances_
        if not hasattr(model, 'feature_importances_'):
            print(f"Model {model_name} does not support feature importance")
            return pd.DataFrame()
        
        importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False).head(top_n)
        
        return importance_df


if __name__ == "__main__":
    # Test RUL prediction
    from data_ingestion import PumpDataIngestion
    from feature_engineering import PumpFeatureEngineering
    
    # Load and prepare data
    ingestion = PumpDataIngestion()
    df = ingestion.load_sensor_data("pump_sensor_data.csv")
    
    # Apply feature engineering
    fe = PumpFeatureEngineering()
    df_features = fe.engineer_all_features(df)
    
    # Train models
    predictor = RULPredictor()
    metrics = predictor.train_all_models(df_features)
    
    # Save models
    predictor.save_models()
    
    # Get feature importance
    importance = predictor.get_feature_importance()
    print(f"\nTop features:\n{importance}")
