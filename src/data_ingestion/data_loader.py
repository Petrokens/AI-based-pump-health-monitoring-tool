"""
Data loader module for pump sensor data ingestion
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PumpDataLoader:
    """Load and validate pump sensor data"""
    
    def __init__(self, data_path: Optional[Path] = None):
        """
        Initialize data loader
        
        Args:
            data_path: Path to the data file
        """
        self.data_path = data_path
        self.data = None
        
    def load_csv(self, file_path: Path) -> pd.DataFrame:
        """
        Load data from CSV file
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            DataFrame with loaded data
        """
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Loaded {len(df)} records from {file_path}")
            return df
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def validate_data(self, df: pd.DataFrame, required_columns: list) -> bool:
        """
        Validate that data contains required columns
        
        Args:
            df: DataFrame to validate
            required_columns: List of required column names
            
        Returns:
            True if valid, raises exception otherwise
        """
        missing_cols = set(required_columns) - set(df.columns)
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        # Check for null values
        null_counts = df[required_columns].isnull().sum()
        if null_counts.any():
            logger.warning(f"Null values found:\n{null_counts[null_counts > 0]}")
        
        return True
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean data by handling missing values and outliers
        
        Args:
            df: DataFrame to clean
            
        Returns:
            Cleaned DataFrame
        """
        df_clean = df.copy()
        
        # Handle missing values with forward fill, then backward fill
        df_clean = df_clean.fillna(method='ffill').fillna(method='bfill')
        
        # Remove duplicate timestamps if present
        if 'timestamp' in df_clean.columns:
            df_clean = df_clean.drop_duplicates(subset=['timestamp'])
            df_clean = df_clean.sort_values('timestamp').reset_index(drop=True)
        
        logger.info(f"Data cleaned: {len(df_clean)} records")
        return df_clean
    
    def generate_synthetic_data(self, n_samples: int = 10000, 
                                n_pumps: int = 5) -> pd.DataFrame:
        """
        Generate synthetic pump sensor data for testing
        
        Args:
            n_samples: Number of samples to generate
            n_pumps: Number of pumps to simulate
            
        Returns:
            DataFrame with synthetic data
        """
        np.random.seed(42)
        
        data = []
        for pump_id in range(n_pumps):
            # Generate time series data
            time_steps = n_samples // n_pumps
            
            # Simulate degradation over time
            degradation = np.linspace(1.0, 0.3, time_steps)
            noise = np.random.normal(0, 0.05, time_steps)
            
            for t in range(time_steps):
                health_factor = degradation[t] + noise[t]
                health_factor = np.clip(health_factor, 0.1, 1.0)
                
                # Generate sensor readings based on health factor
                record = {
                    'pump_id': pump_id,
                    'timestamp': pd.Timestamp('2024-01-01') + pd.Timedelta(hours=t),
                    'flow_rate': 100 * health_factor + np.random.normal(0, 5),
                    'pressure_in': 50 + np.random.normal(0, 2),
                    'pressure_out': 150 * health_factor + np.random.normal(0, 10),
                    'temperature': 60 + (40 * (1 - health_factor)) + np.random.normal(0, 3),
                    'vibration': 1.0 * (1 - health_factor) + np.random.normal(0, 0.1),
                    'power_consumption': 50 + (20 * (1 - health_factor)) + np.random.normal(0, 3),
                    'rpm': 1500 * health_factor + np.random.normal(0, 50),
                    'rul': max(0, (time_steps - t) * health_factor)  # Remaining useful life
                }
                data.append(record)
        
        df = pd.DataFrame(data)
        logger.info(f"Generated {len(df)} synthetic records for {n_pumps} pumps")
        return df
    
    def load_and_prepare(self, file_path: Optional[Path] = None,
                        generate_synthetic: bool = True) -> pd.DataFrame:
        """
        Load and prepare data for modeling
        
        Args:
            file_path: Path to data file (if None and generate_synthetic=True, generates synthetic data)
            generate_synthetic: Whether to generate synthetic data
            
        Returns:
            Prepared DataFrame
        """
        if file_path and file_path.exists():
            df = self.load_csv(file_path)
        elif generate_synthetic:
            df = self.generate_synthetic_data()
        else:
            raise ValueError("No data file provided and synthetic generation disabled")
        
        df = self.clean_data(df)
        self.data = df
        return df
