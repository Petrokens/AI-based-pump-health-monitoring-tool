"""
Feature Engineering Module for Pump Health Monitoring
Creates derived features for ML models
"""
import pandas as pd
import numpy as np
from typing import List, Optional


class PumpFeatureEngineering:
    """Handles feature engineering for pump sensor data"""
    
    def __init__(self):
        """Initialize feature engineering"""
        self.feature_columns = []
        
    def create_rolling_features(self, df: pd.DataFrame, window_sizes: List[int] = [24, 168]) -> pd.DataFrame:
        """
        Create rolling statistical features
        
        Args:
            df: Input dataframe with time series data
            window_sizes: List of window sizes in hours (default: 24h, 168h/1week)
            
        Returns:
            DataFrame with rolling features
        """
        df = df.copy()
        
        numeric_cols = ['vibration', 'temperature', 'pressure', 'flow_rate', 'current', 'rpm']
        
        for col in numeric_cols:
            if col not in df.columns:
                continue
                
            for window in window_sizes:
                # Rolling mean
                df[f'{col}_rolling_mean_{window}h'] = df[col].rolling(window=window, min_periods=1).mean()
                
                # Rolling std
                df[f'{col}_rolling_std_{window}h'] = df[col].rolling(window=window, min_periods=1).std()
                
                # Rolling min/max
                df[f'{col}_rolling_min_{window}h'] = df[col].rolling(window=window, min_periods=1).min()
                df[f'{col}_rolling_max_{window}h'] = df[col].rolling(window=window, min_periods=1).max()
        
        return df
    
    def create_lag_features(self, df: pd.DataFrame, lags: List[int] = [1, 6, 12, 24]) -> pd.DataFrame:
        """
        Create lag features for time series
        
        Args:
            df: Input dataframe
            lags: List of lag periods in hours
            
        Returns:
            DataFrame with lag features
        """
        df = df.copy()
        
        numeric_cols = ['vibration', 'temperature', 'pressure', 'flow_rate', 'current']
        
        for col in numeric_cols:
            if col not in df.columns:
                continue
                
            for lag in lags:
                df[f'{col}_lag_{lag}h'] = df[col].shift(lag)
        
        return df
    
    def create_rate_of_change_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create rate of change features
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with rate of change features
        """
        df = df.copy()
        
        numeric_cols = ['vibration', 'temperature', 'pressure', 'flow_rate']
        
        for col in numeric_cols:
            if col not in df.columns:
                continue
                
            # First order difference (rate of change)
            df[f'{col}_diff'] = df[col].diff()
            
            # Percentage change
            df[f'{col}_pct_change'] = df[col].pct_change()
        
        return df
    
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction and ratio features
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with interaction features
        """
        df = df.copy()
        
        # Efficiency indicator: flow_rate / current (higher is better)
        if 'flow_rate' in df.columns and 'current' in df.columns:
            df['efficiency_indicator'] = df['flow_rate'] / (df['current'] + 1e-6)
        
        # Thermal stress: temperature * vibration
        if 'temperature' in df.columns and 'vibration' in df.columns:
            df['thermal_stress'] = df['temperature'] * df['vibration']
        
        # Pressure deviation from nominal
        if 'pressure' in df.columns:
            df['pressure_deviation'] = np.abs(df['pressure'] - df['pressure'].median())
        
        # Power consumption proxy: current * rpm
        if 'current' in df.columns and 'rpm' in df.columns:
            df['power_proxy'] = df['current'] * df['rpm'] / 1000
        
        # Vibration to RPM ratio (normalized vibration)
        if 'vibration' in df.columns and 'rpm' in df.columns:
            df['vibration_rpm_ratio'] = df['vibration'] / (df['rpm'] / 1750)
        
        return df
    
    def create_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create time-based features
        
        Args:
            df: Input dataframe with timestamp column
            
        Returns:
            DataFrame with time features
        """
        df = df.copy()
        
        if 'timestamp' not in df.columns:
            return df
        
        # Ensure timestamp is datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Extract time components
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['day_of_month'] = df['timestamp'].dt.day
        df['month'] = df['timestamp'].dt.month
        df['quarter'] = df['timestamp'].dt.quarter
        
        # Cyclical encoding for hour (to capture daily patterns)
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        
        # Cyclical encoding for day of week
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Operating hours (cumulative)
        df['operating_hours'] = (df['timestamp'] - df['timestamp'].min()).dt.total_seconds() / 3600
        
        return df
    
    def create_health_index(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create composite health index from multiple sensors
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with health index
        """
        df = df.copy()
        
        # Normalize features to 0-1 scale (lower is better for health)
        health_components = {}
        
        if 'vibration' in df.columns:
            # Higher vibration = worse health
            vib_norm = (df['vibration'] - df['vibration'].min()) / (df['vibration'].max() - df['vibration'].min() + 1e-6)
            health_components['vibration_health'] = 1 - vib_norm
        
        if 'temperature' in df.columns:
            # Higher temperature = worse health
            temp_norm = (df['temperature'] - df['temperature'].min()) / (df['temperature'].max() - df['temperature'].min() + 1e-6)
            health_components['temperature_health'] = 1 - temp_norm
        
        if 'pressure' in df.columns:
            # Deviation from median pressure = worse health
            pressure_dev = np.abs(df['pressure'] - df['pressure'].median())
            pressure_dev_norm = pressure_dev / (pressure_dev.max() + 1e-6)
            health_components['pressure_health'] = 1 - pressure_dev_norm
        
        # Composite health index (0-100 scale)
        if health_components:
            df['health_index'] = pd.DataFrame(health_components).mean(axis=1) * 100
        
        return df
    
    def engineer_all_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all feature engineering steps
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with all engineered features
        """
        print("Creating time features...")
        df = self.create_time_features(df)
        
        print("Creating rolling features...")
        df = self.create_rolling_features(df)
        
        print("Creating lag features...")
        df = self.create_lag_features(df)
        
        print("Creating rate of change features...")
        df = self.create_rate_of_change_features(df)
        
        print("Creating interaction features...")
        df = self.create_interaction_features(df)
        
        print("Creating health index...")
        df = self.create_health_index(df)
        
        # Remove rows with NaN values introduced by rolling/lag features
        df = df.fillna(method='bfill').fillna(method='ffill')
        
        # Store feature columns (exclude timestamp, rul, health_status)
        exclude_cols = ['timestamp', 'rul', 'health_status']
        self.feature_columns = [col for col in df.columns if col not in exclude_cols]
        
        print(f"Feature engineering complete. Total features: {len(self.feature_columns)}")
        return df
    
    def get_feature_columns(self) -> List[str]:
        """
        Get list of feature column names
        
        Returns:
            List of feature column names
        """
        return self.feature_columns


if __name__ == "__main__":
    # Test feature engineering
    from data_ingestion import PumpDataIngestion
    
    # Load sample data
    ingestion = PumpDataIngestion()
    df = ingestion.load_sensor_data("pump_sensor_data.csv")
    
    # Apply feature engineering
    fe = PumpFeatureEngineering()
    df_features = fe.engineer_all_features(df)
    
    print(f"\nOriginal shape: {df.shape}")
    print(f"After feature engineering: {df_features.shape}")
    print(f"\nSample features:\n{df_features.head()}")
    print(f"\nFeature columns: {len(fe.get_feature_columns())}")
