"""
Data Ingestion Module for Pump Health Monitoring
Handles loading, validation, and initial processing of sensor data
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Tuple


class PumpDataIngestion:
    """Handles ingestion of pump sensor data"""
    
    def __init__(self, data_path: str = "data/raw"):
        """
        Initialize data ingestion
        
        Args:
            data_path: Path to raw data directory
        """
        self.data_path = Path(data_path)
        self.data_path.mkdir(parents=True, exist_ok=True)
        
    def load_sensor_data(self, filename: str) -> pd.DataFrame:
        """
        Load sensor data from CSV file
        
        Args:
            filename: Name of the CSV file
            
        Returns:
            DataFrame with sensor data
        """
        filepath = self.data_path / filename
        if not filepath.exists():
            raise FileNotFoundError(f"Data file not found: {filepath}")
            
        df = pd.read_csv(filepath, parse_dates=['timestamp'] if 'timestamp' in pd.read_csv(filepath, nrows=0).columns else None)
        return df
    
    def validate_data(self, df: pd.DataFrame) -> Tuple[bool, list]:
        """
        Validate sensor data quality
        
        Args:
            df: Input dataframe
            
        Returns:
            Tuple of (is_valid, list of issues)
        """
        issues = []
        
        # Check for missing values
        missing = df.isnull().sum()
        if missing.any():
            issues.append(f"Missing values found: {missing[missing > 0].to_dict()}")
        
        # Check for duplicates
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            issues.append(f"Duplicate rows found: {duplicates}")
        
        # Check data types
        required_numeric_cols = ['vibration', 'temperature', 'pressure', 'flow_rate']
        for col in required_numeric_cols:
            if col in df.columns and not pd.api.types.is_numeric_dtype(df[col]):
                issues.append(f"Column '{col}' is not numeric")
        
        is_valid = len(issues) == 0
        return is_valid, issues
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and preprocess raw sensor data
        
        Args:
            df: Raw dataframe
            
        Returns:
            Cleaned dataframe
        """
        df = df.copy()
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values with forward fill then backward fill
        df = df.fillna(method='ffill').fillna(method='bfill')
        
        # Remove outliers using IQR method
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 3 * IQR
            upper_bound = Q3 + 3 * IQR
            df[col] = df[col].clip(lower_bound, upper_bound)
        
        return df
    
    def save_processed_data(self, df: pd.DataFrame, filename: str, output_path: str = "data/processed"):
        """
        Save processed data to CSV
        
        Args:
            df: Processed dataframe
            filename: Output filename
            output_path: Output directory path
        """
        output_dir = Path(output_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        filepath = output_dir / filename
        df.to_csv(filepath, index=False)
        print(f"Processed data saved to {filepath}")
    
    def generate_sample_data(self, n_samples: int = 10000, output_filename: str = "pump_sensor_data.csv") -> pd.DataFrame:
        """
        Generate synthetic pump sensor data for demonstration
        
        Args:
            n_samples: Number of samples to generate
            output_filename: Name of output file
            
        Returns:
            DataFrame with synthetic sensor data
        """
        np.random.seed(42)
        
        # Time series
        timestamps = pd.date_range(start='2023-01-01', periods=n_samples, freq='1H')
        
        # Generate synthetic sensor data with realistic patterns
        time_idx = np.arange(n_samples)
        
        # Vibration: increases over time with noise (sign of wear)
        vibration = 0.5 + 0.0001 * time_idx + np.random.normal(0, 0.1, n_samples)
        vibration = np.clip(vibration, 0.3, 2.0)
        
        # Temperature: seasonal pattern + gradual increase
        temperature = 60 + 10 * np.sin(2 * np.pi * time_idx / (24*30)) + 0.001 * time_idx + np.random.normal(0, 2, n_samples)
        temperature = np.clip(temperature, 50, 90)
        
        # Pressure: stable with occasional drops (anomalies)
        pressure = 100 + np.random.normal(0, 5, n_samples)
        anomaly_indices = np.random.choice(n_samples, size=int(n_samples * 0.01), replace=False)
        pressure[anomaly_indices] -= np.random.uniform(10, 30, len(anomaly_indices))
        pressure = np.clip(pressure, 60, 120)
        
        # Flow rate: correlated with pressure
        flow_rate = 50 + 0.3 * (pressure - 100) + np.random.normal(0, 2, n_samples)
        flow_rate = np.clip(flow_rate, 30, 70)
        
        # Current: increases with load
        current = 15 + 0.1 * vibration + 0.05 * temperature + np.random.normal(0, 1, n_samples)
        current = np.clip(current, 10, 25)
        
        # RPM: relatively stable
        rpm = 1750 + np.random.normal(0, 50, n_samples)
        rpm = np.clip(rpm, 1600, 1900)
        
        # RUL (Remaining Useful Life in days): decreases over time
        rul = np.maximum(365 - time_idx / (24), 0)
        
        # Health status: based on RUL
        health_status = pd.cut(rul, bins=[0, 30, 90, 365], labels=['Critical', 'Warning', 'Healthy'])
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'vibration': vibration,
            'temperature': temperature,
            'pressure': pressure,
            'flow_rate': flow_rate,
            'current': current,
            'rpm': rpm,
            'rul': rul,
            'health_status': health_status
        })
        
        # Save to file
        filepath = self.data_path / output_filename
        df.to_csv(filepath, index=False)
        print(f"Generated {n_samples} samples and saved to {filepath}")
        
        return df


if __name__ == "__main__":
    # Generate sample data for demonstration
    ingestion = PumpDataIngestion()
    df = ingestion.generate_sample_data(n_samples=10000)
    print(f"\nGenerated data shape: {df.shape}")
    print(f"\nFirst few rows:\n{df.head()}")
    print(f"\nData info:\n{df.info()}")
