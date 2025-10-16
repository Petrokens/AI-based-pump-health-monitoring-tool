"""
RUL (Remaining Useful Life) prediction module using XGBoost and Scikit-learn
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
from pathlib import Path
from typing import Tuple, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RULPredictor:
    """Predict Remaining Useful Life of pumps"""
    
    def __init__(self, model_type: str = 'xgboost'):
        """
        Initialize RUL predictor
        
        Args:
            model_type: Type of model ('xgboost' or 'random_forest')
        """
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = None
        
    def prepare_data(self, df: pd.DataFrame, 
                    target_column: str = 'rul',
                    test_size: float = 0.2,
                    random_state: int = 42) -> Tuple:
        """
        Prepare data for training
        
        Args:
            df: Input DataFrame
            target_column: Name of target column
            test_size: Proportion of test set
            random_state: Random seed
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        # Separate features and target
        feature_cols = [col for col in df.columns 
                       if col not in [target_column, 'timestamp', 'pump_id']]
        
        X = df[feature_cols]
        y = df[target_column]
        
        # Store feature columns
        self.feature_columns = feature_cols
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        logger.info(f"Data prepared: {X_train.shape[0]} training samples, "
                   f"{X_test.shape[0]} test samples")
        
        return X_train_scaled, X_test_scaled, y_train.values, y_test.values
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
             xgb_params: Optional[Dict] = None) -> None:
        """
        Train the RUL prediction model
        
        Args:
            X_train: Training features
            y_train: Training target
            xgb_params: XGBoost parameters (if using XGBoost)
        """
        if self.model_type == 'xgboost':
            if xgb_params is None:
                xgb_params = {
                    'n_estimators': 100,
                    'max_depth': 6,
                    'learning_rate': 0.1,
                    'subsample': 0.8,
                    'colsample_bytree': 0.8,
                    'random_state': 42
                }
            
            self.model = xgb.XGBRegressor(**xgb_params)
            logger.info("Training XGBoost model...")
        else:
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            logger.info("Training Random Forest model...")
        
        self.model.fit(X_train, y_train)
        logger.info("Model training complete")
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """
        Evaluate model performance
        
        Args:
            X_test: Test features
            y_test: Test target
            
        Returns:
            Dictionary of evaluation metrics
        """
        y_pred = self.model.predict(X_test)
        
        metrics = {
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'mae': mean_absolute_error(y_test, y_pred),
            'r2': r2_score(y_test, y_pred)
        }
        
        logger.info(f"Model Evaluation - RMSE: {metrics['rmse']:.2f}, "
                   f"MAE: {metrics['mae']:.2f}, R2: {metrics['r2']:.3f}")
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make RUL predictions
        
        Args:
            X: Features for prediction
            
        Returns:
            Array of RUL predictions
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        return predictions
    
    def predict_health_index(self, rul: np.ndarray, 
                            max_rul: float = 1000) -> np.ndarray:
        """
        Convert RUL to health index (0-1 scale)
        
        Args:
            rul: Array of RUL predictions
            max_rul: Maximum expected RUL
            
        Returns:
            Array of health indices
        """
        health_index = np.clip(rul / max_rul, 0, 1)
        return health_index
    
    def get_feature_importance(self, top_n: int = 10) -> pd.DataFrame:
        """
        Get feature importance from trained model
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            DataFrame with feature importance
        """
        if self.model is None:
            raise ValueError("Model not trained")
        
        if hasattr(self.model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': self.feature_columns,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False).head(top_n)
            
            return importance_df
        else:
            logger.warning("Model does not support feature importance")
            return pd.DataFrame()
    
    def save_model(self, filepath: Path) -> None:
        """
        Save trained model to disk
        
        Args:
            filepath: Path to save model
        """
        if self.model is None:
            raise ValueError("No model to save")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'model_type': self.model_type
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: Path) -> None:
        """
        Load trained model from disk
        
        Args:
            filepath: Path to load model from
        """
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.model_type = model_data['model_type']
        logger.info(f"Model loaded from {filepath}")
