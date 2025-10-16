"""
Feature engineering module for creating predictive features from pump sensor data
"""

import pandas as pd
import numpy as np
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PumpFeatureBuilder:
    """Build features for pump health prediction"""
    
    def __init__(self, window_size: int = 10):
        """
        Initialize feature builder
        
        Args:
            window_size: Size of rolling window for feature calculation
        """
        self.window_size = window_size
        
    def create_rolling_features(self, df: pd.DataFrame, 
                               columns: List[str]) -> pd.DataFrame:
        """
        Create rolling statistical features
        
        Args:
            df: Input DataFrame
            columns: Columns to create rolling features for
            
        Returns:
            DataFrame with rolling features
        """
        df_features = df.copy()
        
        for col in columns:
            # Rolling mean
            df_features[f'{col}_rolling_mean'] = df[col].rolling(
                window=self.window_size, min_periods=1
            ).mean()
            
            # Rolling standard deviation
            df_features[f'{col}_rolling_std'] = df[col].rolling(
                window=self.window_size, min_periods=1
            ).std()
            
            # Rolling min
            df_features[f'{col}_rolling_min'] = df[col].rolling(
                window=self.window_size, min_periods=1
            ).min()
            
            # Rolling max
            df_features[f'{col}_rolling_max'] = df[col].rolling(
                window=self.window_size, min_periods=1
            ).max()
        
        logger.info(f"Created rolling features for {len(columns)} columns")
        return df_features
    
    def create_lag_features(self, df: pd.DataFrame, 
                           columns: List[str], 
                           lags: List[int]) -> pd.DataFrame:
        """
        Create lag features
        
        Args:
            df: Input DataFrame
            columns: Columns to create lag features for
            lags: List of lag periods
            
        Returns:
            DataFrame with lag features
        """
        df_features = df.copy()
        
        for col in columns:
            for lag in lags:
                df_features[f'{col}_lag_{lag}'] = df[col].shift(lag)
        
        logger.info(f"Created lag features for {len(columns)} columns with {len(lags)} lags")
        return df_features
    
    def create_derivative_features(self, df: pd.DataFrame, 
                                   columns: List[str]) -> pd.DataFrame:
        """
        Create rate of change features
        
        Args:
            df: Input DataFrame
            columns: Columns to create derivative features for
            
        Returns:
            DataFrame with derivative features
        """
        df_features = df.copy()
        
        for col in columns:
            # First derivative (rate of change)
            df_features[f'{col}_rate_of_change'] = df[col].diff()
            
            # Second derivative (acceleration)
            df_features[f'{col}_acceleration'] = df[col].diff().diff()
        
        logger.info(f"Created derivative features for {len(columns)} columns")
        return df_features
    
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction features between sensors
        
        Args:
            df: Input DataFrame
            
        Returns:
            DataFrame with interaction features
        """
        df_features = df.copy()
        
        # Efficiency metric: flow_rate / power_consumption
        if 'flow_rate' in df.columns and 'power_consumption' in df.columns:
            df_features['efficiency'] = df['flow_rate'] / (df['power_consumption'] + 1e-6)
        
        # Pressure differential
        if 'pressure_out' in df.columns and 'pressure_in' in df.columns:
            df_features['pressure_differential'] = df['pressure_out'] - df['pressure_in']
        
        # Vibration to temperature ratio
        if 'vibration' in df.columns and 'temperature' in df.columns:
            df_features['vibration_temp_ratio'] = df['vibration'] / (df['temperature'] + 1e-6)
        
        # Power per RPM
        if 'power_consumption' in df.columns and 'rpm' in df.columns:
            df_features['power_per_rpm'] = df['power_consumption'] / (df['rpm'] + 1e-6)
        
        logger.info("Created interaction features")
        return df_features
    
    def create_health_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create pump health indicator features
        
        Args:
            df: Input DataFrame
            
        Returns:
            DataFrame with health indicators
        """
        df_features = df.copy()
        
        # Normalized features (0-1 scale)
        if 'vibration' in df.columns:
            df_features['vibration_norm'] = (
                (df['vibration'] - df['vibration'].min()) / 
                (df['vibration'].max() - df['vibration'].min() + 1e-6)
            )
        
        if 'temperature' in df.columns:
            df_features['temperature_norm'] = (
                (df['temperature'] - df['temperature'].min()) / 
                (df['temperature'].max() - df['temperature'].min() + 1e-6)
            )
        
        # Combined health score (lower is better)
        if 'vibration_norm' in df_features.columns and 'temperature_norm' in df_features.columns:
            df_features['degradation_index'] = (
                df_features['vibration_norm'] * 0.5 + 
                df_features['temperature_norm'] * 0.5
            )
        
        logger.info("Created health indicator features")
        return df_features
    
    def build_all_features(self, df: pd.DataFrame, 
                          sensor_columns: List[str]) -> pd.DataFrame:
        """
        Build all features for modeling
        
        Args:
            df: Input DataFrame
            sensor_columns: List of sensor column names
            
        Returns:
            DataFrame with all engineered features
        """
        logger.info("Building all features...")
        
        # Create rolling features
        df_features = self.create_rolling_features(df, sensor_columns)
        
        # Create lag features
        df_features = self.create_lag_features(df_features, sensor_columns, [1, 5, 10])
        
        # Create derivative features
        df_features = self.create_derivative_features(df_features, sensor_columns)
        
        # Create interaction features
        df_features = self.create_interaction_features(df_features)
        
        # Create health indicators
        df_features = self.create_health_indicators(df_features)
        
        # Fill any remaining NaN values
        df_features = df_features.fillna(method='bfill').fillna(0)
        
        logger.info(f"Feature engineering complete. Total features: {len(df_features.columns)}")
        return df_features
