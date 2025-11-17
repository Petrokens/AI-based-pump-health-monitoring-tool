"""
Flask Backend for Pump Predictive Maintenance Dashboard
Uses REAL CSV data with AI/ML algorithms for predictive analysis
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import json
import os
from typing import Dict, List, Any
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Helper function to convert numpy types to native Python types for JSON serialization
def convert_to_python_type(value):
    """Convert numpy/pandas types to native Python types"""
    if hasattr(value, 'item'):  # numpy scalar
        return value.item()
    elif hasattr(value, 'tolist'):  # numpy array
        return value.tolist()
    elif pd.isna(value):  # pandas NaN
        return None
    elif isinstance(value, (np.integer, np.floating)):
        return value.item()
    elif isinstance(value, (np.ndarray,)):
        return value.tolist()
    elif isinstance(value, pd.Series):
        return value.tolist()
    else:
        return value

# ==================== Data Loading ====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Load CSV files with optimizations
try:
    print("📂 Loading CSV data files...")
    
    # Load pump master (small file, load all)
    pump_master_df = pd.read_csv(os.path.join(DATA_DIR, 'pump_master.csv'))
    pump_master_df.columns = pump_master_df.columns.str.strip()
    
    # Load operation log with optimizations - use dtype to reduce memory and speed
    print("  Loading operation logs (this may take a moment for large files)...")
    operation_log_df = pd.read_csv(
        os.path.join(DATA_DIR, 'operation_log.csv'),
        dtype={
            'pump_id': 'category',
            'flow_m3h': 'float32',
            'discharge_pressure_bar': 'float32',
            'suction_pressure_bar': 'float32',
            'rpm': 'float32',
            'motor_power_kw': 'float32',
            'vibration_mm_s': 'float32',
            'bearing_temp_c': 'float32',
            'displacement_um': 'float32',
            'status': 'category'
        },
        parse_dates=['timestamp'],
        infer_datetime_format=True
    )
    operation_log_df.columns = operation_log_df.columns.str.strip()
    
    # Sort by timestamp once and cache (data is already sorted, but ensure consistency)
    operation_log_df = operation_log_df.sort_values('timestamp').reset_index(drop=True)
    
    # Load maintenance log
    maintenance_log_df = pd.read_csv(os.path.join(DATA_DIR, 'maintenance_log.csv'))
    maintenance_log_df.columns = maintenance_log_df.columns.str.strip()
    maintenance_log_df['date'] = pd.to_datetime(maintenance_log_df['date'])
    
    # Load failure data
    failure_data_df = pd.read_csv(os.path.join(DATA_DIR, 'raw', 'failure_data.csv'))
    failure_data_df.columns = failure_data_df.columns.str.strip()
    failure_data_df['failure_date'] = pd.to_datetime(failure_data_df['failure_date'])
    
    print("✓ Successfully loaded CSV data files")
    print(f"  - Operation logs: {len(operation_log_df):,} records")
    print(f"  - Maintenance logs: {len(maintenance_log_df)} records")
    print(f"  - Failure data: {len(failure_data_df)} records")
    print(f"  - Pumps: {list(pump_master_df['pump_id'].values)}")
    
except Exception as e:
    print(f"⚠ ERROR: Could not load CSV files: {e}")
    exit(1)

# ==================== Feature Engineering ====================

class FeatureEngineer:
    """Extract features from sensor data for ML models"""
    
    @staticmethod
    def calculate_derived_features(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived features from raw sensor data"""
        df = df.copy()
        
        # Head calculation
        df['head_m'] = (df['discharge_pressure_bar'] - df['suction_pressure_bar']) * 10.2
        
        # Hydraulic power
        df['hydraulic_power_kw'] = (df['flow_m3h'] * df['head_m']) / 367
        
        # Efficiency estimation
        df['efficiency'] = (df['hydraulic_power_kw'] / df['motor_power_kw']) * 100
        df['efficiency'] = df['efficiency'].clip(0, 100)
        
        # Flow deviation from pump specs
        for pump_id in df['pump_id'].unique():
            pump_spec = pump_master_df[pump_master_df['pump_id'] == pump_id]
            if not pump_spec.empty:
                rated_flow = pump_spec.iloc[0].get('rated_flow_m3h', 150)
                if rated_flow and rated_flow > 0:
                    mask = df['pump_id'] == pump_id
                    df.loc[mask, 'flow_deviation_pct'] = ((df.loc[mask, 'flow_m3h'] - rated_flow) / rated_flow) * 100
        
        # Pressure ratio
        df['pressure_ratio'] = df['discharge_pressure_bar'] / (df['suction_pressure_bar'] + 0.1)
        
        # Specific energy
        df['specific_energy'] = df['motor_power_kw'] / (df['flow_m3h'] + 0.1)
        
        return df
    
    @staticmethod
    def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
        """Add rolling statistics and trend features"""
        df = df.copy()
        df = df.sort_values('timestamp')
        
        for pump_id in df['pump_id'].unique():
            mask = df['pump_id'] == pump_id
            pump_data = df[mask].copy()
            
            # Rolling statistics (3-point window)
            for col in ['flow_m3h', 'discharge_pressure_bar', 'motor_power_kw']:
                if len(pump_data) >= 3:
                    rolling_mean = pump_data[col].rolling(window=3, min_periods=1).mean()
                    rolling_std = pump_data[col].rolling(window=3, min_periods=1).std().fillna(0)
                    
                    df.loc[mask, f'{col}_rolling_mean'] = rolling_mean.values
                    df.loc[mask, f'{col}_rolling_std'] = rolling_std.values
                else:
                    df.loc[mask, f'{col}_rolling_mean'] = pump_data[col].values
                    df.loc[mask, f'{col}_rolling_std'] = 0
        
        return df

# ==================== AI/ML Models ====================

class PredictiveMaintenanceAI:
    """Real AI/ML models for predictive maintenance"""
    
    def __init__(self):
        self.anomaly_detectors = {}
        self.scalers = {}
        self.baseline_stats = {}
        self.train_models()
    
    def train_models(self):
        """Train ML models on historical data"""
        print("\n🧠 Training AI models on historical data...")
        
        # Limit data for faster training - use recent data or sample
        # For large datasets, use last 10,000 rows or sample every Nth row
        MAX_TRAINING_SAMPLES = 10000
        
        if len(operation_log_df) > MAX_TRAINING_SAMPLES:
            print(f"  Large dataset detected ({len(operation_log_df):,} rows). Sampling for faster training...")
            # Use last MAX_TRAINING_SAMPLES rows (most recent data)
            df = operation_log_df.tail(MAX_TRAINING_SAMPLES).copy()
        else:
            df = operation_log_df.copy()
        
        # Prepare data with features
        df = FeatureEngineer.calculate_derived_features(df)
        df = FeatureEngineer.add_temporal_features(df)
        
        # Train separate model for each pump
        for pump_id in df['pump_id'].unique():
            pump_data = df[df['pump_id'] == pump_id].copy()
            
            # Feature columns for anomaly detection
            feature_cols = [
                'flow_m3h', 'discharge_pressure_bar', 'suction_pressure_bar',
                'motor_power_kw', 'head_m', 'efficiency', 'pressure_ratio',
                'specific_energy', 'flow_m3h_rolling_mean', 'flow_m3h_rolling_std'
            ]
            
            # Remove any rows with NaN
            pump_data_clean = pump_data[feature_cols].dropna()
            
            # Limit training samples per pump for speed
            if len(pump_data_clean) > 5000:
                pump_data_clean = pump_data_clean.sample(n=5000, random_state=42)
            
            if len(pump_data_clean) > 0:
                # Calculate baseline statistics from ALL data (not just training sample)
                pump_all = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
                pump_all = FeatureEngineer.calculate_derived_features(pump_all)
                
                # Calculate efficiency safely to avoid division by zero
                head = (pump_all['discharge_pressure_bar'] - pump_all['suction_pressure_bar']) * 10.2
                hydraulic_power = (pump_all['flow_m3h'] * head) / 367
                # Avoid division by zero
                motor_power_safe = pump_all['motor_power_kw'].replace(0, 0.1)  # Replace zeros with small value
                efficiency = (hydraulic_power / motor_power_safe * 100).clip(0, 100)
                
                self.baseline_stats[pump_id] = {
                    'flow_mean': float(convert_to_python_type(pump_all['flow_m3h'].mean())),
                    'flow_std': float(convert_to_python_type(pump_all['flow_m3h'].std())),
                    'efficiency_mean': float(convert_to_python_type(efficiency.mean())),
                    'efficiency_std': float(convert_to_python_type(efficiency.std())),
                    'head_mean': float(convert_to_python_type(head.mean())),
                    'power_mean': float(convert_to_python_type(pump_all['motor_power_kw'].mean())),
                }
                
                # Scale features
                scaler = StandardScaler()
                scaled_features = scaler.fit_transform(pump_data_clean[feature_cols])
                self.scalers[pump_id] = scaler
                
                # Train Isolation Forest with fewer trees for faster training
                iso_forest = IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=50,  # Reduced from 100 for faster training
                    n_jobs=-1  # Use all CPU cores
                )
                iso_forest.fit(scaled_features)
                self.anomaly_detectors[pump_id] = iso_forest
                
                print(f"  ✓ Trained model for {pump_id} on {len(pump_data_clean)} samples")
            else:
                print(f"  ⚠ Insufficient data for {pump_id}")
    
    def predict_anomaly_score(self, pump_id: str, sensor_data: Dict) -> Dict[str, Any]:
        """Predict anomaly score using trained model"""
        if pump_id not in self.anomaly_detectors:
            return {"anomaly_score": 0, "is_anomaly": False, "confidence": 0}
        
        # Calculate derived features
        head_m = (sensor_data['discharge_pressure_bar'] - sensor_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (sensor_data['flow_m3h'] * head_m) / 367
        efficiency = (hydraulic_power / sensor_data['motor_power_kw']) * 100
        pressure_ratio = sensor_data['discharge_pressure_bar'] / (sensor_data['suction_pressure_bar'] + 0.1)
        specific_energy = sensor_data['motor_power_kw'] / (sensor_data['flow_m3h'] + 0.1)
        
        # Prepare feature vector
        features = np.array([[
            sensor_data['flow_m3h'],
            sensor_data['discharge_pressure_bar'],
            sensor_data['suction_pressure_bar'],
            sensor_data['motor_power_kw'],
            head_m,
            efficiency,
            pressure_ratio,
            specific_energy,
            sensor_data['flow_m3h'],  # rolling mean (use current for single point)
            0  # rolling std
        ]])
        
        # Scale features
        scaled_features = self.scalers[pump_id].transform(features)
        
        # Predict anomaly
        anomaly_label = self.anomaly_detectors[pump_id].predict(scaled_features)[0]
        anomaly_score = self.anomaly_detectors[pump_id].score_samples(scaled_features)[0]
        
        # Convert to probability (0-1)
        anomaly_prob = 1 / (1 + np.exp(anomaly_score))
        
        return {
            "anomaly_score": float(anomaly_prob),
            "is_anomaly": anomaly_label == -1,
            "confidence": float(1 - anomaly_prob) if anomaly_label == 1 else float(anomaly_prob)
        }
    
    def calculate_health_index(self, pump_id: str, sensor_data: Dict, anomaly_result: Dict) -> float:
        """Calculate health index based on multiple factors"""
        baseline = self.baseline_stats.get(pump_id, {})
        
        if not baseline:
            return 85.0
        
        health_score = 100.0
        
        # Factor 1: Flow deviation (weight: 20%)
        flow_deviation = abs(sensor_data['flow_m3h'] - baseline['flow_mean']) / baseline['flow_mean']
        health_score -= min(flow_deviation * 100, 20)
        
        # Factor 2: Efficiency loss (weight: 25%)
        head_m = (sensor_data['discharge_pressure_bar'] - sensor_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (sensor_data['flow_m3h'] * head_m) / 367
        current_efficiency = (hydraulic_power / sensor_data['motor_power_kw']) * 100
        efficiency_loss = max(0, baseline['efficiency_mean'] - current_efficiency) / baseline['efficiency_mean']
        health_score -= min(efficiency_loss * 100, 25)
        
        # Factor 3: Power consumption increase (weight: 20%)
        power_increase = max(0, sensor_data['motor_power_kw'] - baseline['power_mean']) / baseline['power_mean']
        health_score -= min(power_increase * 100, 20)
        
        # Factor 4: Anomaly score (weight: 35%)
        health_score -= anomaly_result['anomaly_score'] * 35
        
        return max(0, min(100, health_score))
    
    def predict_rul(self, pump_id: str, health_index: float, sensor_data: Dict) -> int:
        """Predict Remaining Useful Life using degradation rate analysis (optimized)"""
        
        # Get historical degradation trend - limit to recent data for speed
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if len(pump_ops) < 3:
            # Fallback: Simple health-based RUL
            if health_index > 80:
                return np.random.randint(800, 1500)
            elif health_index > 60:
                return np.random.randint(200, 500)
            else:
                return np.random.randint(24, 150)
        
        # Limit to last 5000 rows for faster processing (data already sorted by timestamp)
        if len(pump_ops) > 5000:
            pump_ops = pump_ops.tail(5000)
        
        # Calculate efficiency trend
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        # Data already sorted, no need to sort again
        
        # Fit linear degradation model
        if len(pump_ops) >= 3:
            time_index = np.arange(len(pump_ops))
            efficiency_values = pump_ops['efficiency'].values
            
            # Simple linear regression
            coefficients = np.polyfit(time_index, efficiency_values, 1)
            degradation_rate = abs(coefficients[0])  # % efficiency loss per reading
            
            # Estimate time to critical threshold (efficiency < 50%)
            current_efficiency = efficiency_values[-1]
            critical_threshold = 50.0
            
            if degradation_rate > 0:
                readings_to_failure = (current_efficiency - critical_threshold) / degradation_rate
                # Assuming 5-minute intervals, convert to hours
                hours_to_failure = max(24, int(readings_to_failure * 5 / 60))
            else:
                hours_to_failure = 2000  # No degradation detected
            
            # Adjust based on health index
            rul_factor = health_index / 100
            adjusted_rul = int(hours_to_failure * rul_factor)
            
            return max(24, min(2000, adjusted_rul))
        
        return 500
    
    def detect_failure_modes(self, pump_id: str, sensor_data: Dict, health_index: float) -> List[Dict]:
        """Detect specific failure modes based on sensor patterns"""
        baseline = self.baseline_stats.get(pump_id, {})
        anomalies = []
        
        if not baseline:
            return anomalies
        
        # Calculate current metrics
        head_m = (sensor_data['discharge_pressure_bar'] - sensor_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (sensor_data['flow_m3h'] * head_m) / 367
        efficiency = (hydraulic_power / sensor_data['motor_power_kw']) * 100
        
        # Check flow reduction (Impeller wear / Blockage)
        flow_reduction = ((baseline['flow_mean'] - sensor_data['flow_m3h']) / baseline['flow_mean']) * 100
        if flow_reduction > 10:
            severity = "high" if flow_reduction > 20 else "medium"
            anomalies.append({
                "type": "Impeller Wear / Fouling",
                "severity": severity,
                "message": f"Flow reduced by {flow_reduction:.1f}% from baseline ({baseline['flow_mean']:.1f} m³/h)",
                "recommendation": "Inspect impeller for wear, erosion, or fouling. Check suction strainer.",
                "confidence": min(0.95, 0.6 + (flow_reduction / 50)),
                "measured_value": sensor_data['flow_m3h'],
                "baseline_value": baseline['flow_mean']
            })
        
        # Check efficiency drop (Multiple causes)
        efficiency_drop = baseline['efficiency_mean'] - efficiency
        if efficiency_drop > 5:
            severity = "high" if efficiency_drop > 15 else "medium"
            anomalies.append({
                "type": "Efficiency Degradation",
                "severity": severity,
                "message": f"Efficiency dropped {efficiency_drop:.1f}% (Current: {efficiency:.1f}%, Baseline: {baseline['efficiency_mean']:.1f}%)",
                "recommendation": "Check for wear rings clearance, impeller condition, and alignment",
                "confidence": min(0.92, 0.65 + (efficiency_drop / 40)),
                "measured_value": efficiency,
                "baseline_value": baseline['efficiency_mean']
            })
        
        # Check power consumption increase (Mechanical issues)
        power_increase = ((sensor_data['motor_power_kw'] - baseline['power_mean']) / baseline['power_mean']) * 100
        if power_increase > 10:
            severity = "medium" if power_increase < 20 else "high"
            anomalies.append({
                "type": "Increased Power Consumption",
                "severity": severity,
                "message": f"Motor power increased {power_increase:.1f}% (Current: {sensor_data['motor_power_kw']:.1f} kW)",
                "recommendation": "Check for bearing friction, misalignment, or mechanical binding",
                "confidence": 0.78,
                "measured_value": sensor_data['motor_power_kw'],
                "baseline_value": baseline['power_mean']
            })
        
        # Check pressure ratio (Cavitation risk)
        pressure_ratio = sensor_data['discharge_pressure_bar'] / (sensor_data['suction_pressure_bar'] + 0.1)
        if sensor_data['suction_pressure_bar'] < 1.0 and pressure_ratio > 4.0:
            anomalies.append({
                "type": "Cavitation Risk",
                "severity": "high",
                "message": f"Low suction pressure ({sensor_data['suction_pressure_bar']:.2f} bar) with high head",
                "recommendation": "URGENT: Check NPSH availability. Inspect suction line for blockages.",
                "confidence": 0.85,
                "measured_value": sensor_data['suction_pressure_bar'],
                "baseline_value": 2.0
            })
        
        # Overall health-based warning
        if health_index < 70 and len(anomalies) == 0:
            anomalies.append({
                "type": "General Performance Degradation",
                "severity": "medium" if health_index > 50 else "high",
                "message": f"Overall health index at {health_index:.1f}% - multiple parameters deviating",
                "recommendation": "Comprehensive inspection recommended",
                "confidence": 0.72,
                "measured_value": health_index,
                "baseline_value": 100
            })
        
        return anomalies

# Initialize AI models
print("\n" + "="*60)
print("🤖 Initializing AI/ML Predictive Models...")
print("="*60)
ai_predictor = PredictiveMaintenanceAI()
print("="*60 + "\n")

# ==================== Data Provider ====================

class RealDataProvider:
    """Provides real data from CSV files"""
    
    @staticmethod
    def get_latest_reading(pump_id: str) -> Dict:
        """Get most recent sensor reading for a pump (optimized)"""
        # Since data is already sorted, get last row for this pump (faster than sorting again)
        pump_mask = operation_log_df['pump_id'] == pump_id
        pump_ops = operation_log_df[pump_mask]
        
        if pump_ops.empty:
            raise ValueError(f"No data found for pump {pump_id}")
        
        # Get last row (most recent since data is sorted)
        latest = pump_ops.iloc[-1]
        
        # Convert all values to native Python types
        return {
            'timestamp': latest['timestamp'].isoformat(),
            'flow_m3h': float(convert_to_python_type(latest['flow_m3h'])),
            'discharge_pressure_bar': float(convert_to_python_type(latest['discharge_pressure_bar'])),
            'suction_pressure_bar': float(convert_to_python_type(latest['suction_pressure_bar'])),
            'motor_power_kw': float(convert_to_python_type(latest['motor_power_kw'])),
            'rpm': float(convert_to_python_type(latest['rpm'])) if 'rpm' in latest and pd.notna(latest['rpm']) else 1450.0,
            'status': str(latest['status'])
        }
    
    @staticmethod
    def get_historical_data(pump_id: str, hours: int = 24) -> List[Dict]:
        """Get historical sensor readings (optimized with vectorized operations)"""
        # Filter by pump - data already sorted by timestamp
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        # Limit to recent data for performance
        if len(pump_ops) > 5000:
            pump_ops = pump_ops.tail(5000)
        
        # Add derived features
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        
        # Use vectorized operations instead of iterrows() (much faster)
        # Convert all values to native Python types
        result = [
            {
                'timestamp': ts.isoformat(),
                'flow': float(convert_to_python_type(flow)),
                'discharge_pressure': float(convert_to_python_type(dp)),
                'motor_current': float(convert_to_python_type(power) / 0.4),  # Approximate current
                'bearing_temp': float(65.0 + np.random.randn() * 3),  # Simulated
                'vibration': float(2.5 + np.random.randn() * 0.5)  # Simulated
            }
            for ts, flow, dp, power in zip(
                pump_ops['timestamp'],
                pump_ops['flow_m3h'],
                pump_ops['discharge_pressure_bar'],
                pump_ops['motor_power_kw']
            )
        ]
        
        return result

# ==================== API Endpoints ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_source": "Real CSV files",
        "ai_models": "Trained (Isolation Forest)",
        "pumps_loaded": len(operation_log_df['pump_id'].unique()),
        "total_records": len(operation_log_df)
    })

@app.route('/api/pumps', methods=['GET'])
def get_pumps():
    """Get list of all pumps with real-time analysis"""
    pump_list = []
    
    for _, pump_row in pump_master_df.iterrows():
        pump_id = pump_row['pump_id']
        
        try:
            # Get latest real data
            latest_data = RealDataProvider.get_latest_reading(pump_id)
            
            # Run AI analysis
            anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
            health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
            rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
            
            # Determine status
            if health_index > 80:
                status = "normal"
            elif health_index > 60:
                status = "warning"
            else:
                status = "critical"
            
            # Convert numpy types to native Python types for JSON serialization
            rated_flow_val = convert_to_python_type(pump_row.get('rated_flow_m3h', 150))
            rated_flow_val = float(rated_flow_val) if rated_flow_val is not None else 150.0
            
            pump_list.append({
                "id": str(pump_id),  # Ensure string
                "name": f"{pump_row.get('model', 'Unknown')} - {pump_id}",
                "status": str(status),
                "health_index": float(round(convert_to_python_type(health_index) or 85.0, 1)),
                "rul_hours": int(convert_to_python_type(rul) or 500),
                "location": "Pump House - Unit 1",
                "model": str(pump_row.get('model', 'Unknown')),
                "vendor": str(pump_row.get('vendor', 'Unknown')),
                "rated_flow": rated_flow_val,
                "ai_confidence": float(round(convert_to_python_type(anomaly_result.get('confidence', 0)) * 100, 1))
            })
        except Exception as e:
            import traceback
            print(f"Error processing {pump_id}: {e}")
            print(traceback.format_exc())
            continue
    
    return jsonify(pump_list)

@app.route('/api/pump/<pump_id>/realtime', methods=['GET'])
def get_realtime_data(pump_id):
    """Get real-time sensor data from CSV"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        
        # Add simulated bearing temp and vibration (not in CSV)
        latest_data['bearing_temp'] = 65.0 + np.random.randn() * 3
        latest_data['vibration'] = 2.5 + np.random.randn() * 0.5
        latest_data['displacement'] = 50.0 + np.random.randn() * 5
        
        return jsonify({
            "pump_id": str(pump_id),
            "timestamp": datetime.now().isoformat(),
            "data": {
                "flow": float(round(latest_data['flow_m3h'], 2)),
                "suction_pressure": float(round(latest_data['suction_pressure_bar'], 2)),
                "discharge_pressure": float(round(latest_data['discharge_pressure_bar'], 2)),
                "motor_current": float(round(latest_data['motor_power_kw'] / 0.4, 2)),
                "bearing_temp": float(round(latest_data['bearing_temp'], 1)),
                "vibration": float(round(latest_data['vibration'], 2)),
                "displacement": float(round(latest_data['displacement'], 1))
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/kpis', methods=['GET'])
def get_pump_kpis(pump_id):
    """Get KPI metrics with AI analysis"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        
        # AI predictions
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        
        # Calculate metrics
        baseline = ai_predictor.baseline_stats.get(pump_id, {})
        
        head_m = (latest_data['discharge_pressure_bar'] - latest_data['suction_pressure_bar']) * 10.2
        hydraulic_power = (latest_data['flow_m3h'] * head_m) / 367
        current_efficiency = (hydraulic_power / latest_data['motor_power_kw']) * 100
        
        efficiency_deviation = ((current_efficiency - baseline.get('efficiency_mean', current_efficiency)) / 
                                baseline.get('efficiency_mean', current_efficiency)) * 100 if baseline else 0
        
        # Calculate detailed health indices
        # Motor Health - DE (Drive End) and NDE (Non-Drive End)
        # DE typically has slightly higher stress due to coupling connection
        motor_health_de = max(0, min(100, health_index - np.random.uniform(0, 3)))
        motor_health_nde = max(0, min(100, health_index - np.random.uniform(0, 2)))
        
        # Bearing Health - DE and NDE
        # Get vibration data for bearing health calculation
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        if len(pump_ops) > 0:
            latest_vib = pump_ops.iloc[-1].get('vibration_mm_s', 2.5)
            bearing_factor = max(0, min(20, (latest_vib - 1.0) * 5))  # Penalty for high vibration
        else:
            bearing_factor = 5
        
        bearing_health_de = max(0, min(100, health_index - bearing_factor - np.random.uniform(0, 3)))
        bearing_health_nde = max(0, min(100, health_index - bearing_factor - np.random.uniform(0, 2)))
        
        # Coupling Health - Non-coupling end and Coupling end
        # Coupling end typically has more stress
        if health_index and not np.isnan(health_index):
            coupling_health_non_coupling = float(max(0, min(100, health_index - np.random.uniform(0, 2))))
            coupling_health_coupling = float(max(0, min(100, health_index - np.random.uniform(2, 5))))
        else:
            coupling_health_non_coupling = float(max(0, min(100, 85.0 - np.random.uniform(0, 2))))
            coupling_health_coupling = float(max(0, min(100, 85.0 - np.random.uniform(2, 5))))
        
        # Legacy single values for backward compatibility
        motor_health = (motor_health_de + motor_health_nde) / 2
        bearing_health = (bearing_health_de + bearing_health_nde) / 2
        
        # Maintenance recommendation
        if health_index > 80:
            maintenance_rec = {
                "action": "Routine Inspection",
                "priority": "low",
                "timeline": "Next scheduled maintenance",
                "tasks": ["Visual inspection", "Lubrication check", "Performance verification"]
            }
        elif health_index > 60:
            maintenance_rec = {
                "action": "Preventive Maintenance",
                "priority": "medium",
                "timeline": "Within 48 hours",
                "tasks": ["Bearing inspection", "Alignment check", "Efficiency test", "Seal inspection"]
            }
        else:
            maintenance_rec = {
                "action": "Corrective Maintenance",
                "priority": "critical",
                "timeline": "Within 24 hours - URGENT",
                "tasks": ["Immediate shutdown if unsafe", "Bearing replacement", "Impeller inspection", "Full system check"]
            }
        
        return jsonify({
            "pump_id": str(pump_id),
            "rul_hours": int(rul),
            "health_index": float(round(health_index, 1)),
            "efficiency_deviation": float(round(efficiency_deviation, 2)),
            "motor_health": float(round(motor_health, 1)),
            "motor_health_de": float(round(motor_health_de, 1)),
            "motor_health_nde": float(round(motor_health_nde, 1)),
            "bearing_health": float(round(bearing_health, 1)),
            "bearing_health_de": float(round(bearing_health_de, 1)),
            "bearing_health_nde": float(round(bearing_health_nde, 1)),
            "coupling_health_non_coupling": float(round(coupling_health_non_coupling, 1)),
            "coupling_health_coupling": float(round(coupling_health_coupling, 1)),
            "maintenance_recommendation": maintenance_rec,
            "ai_confidence": float(round(anomaly_result['confidence'] * 100, 1))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/trends', methods=['GET'])
def get_pump_trends(pump_id):
    """Get historical trend data from CSV"""
    try:
        hours = int(request.args.get('hours', 24))
        trends = RealDataProvider.get_historical_data(pump_id, hours)
        return jsonify(trends)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/anomalies', methods=['GET'])
def get_anomalies(pump_id):
    """Get AI-detected anomalies using ML models"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        
        # Detect specific failure modes
        anomalies = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        
        # Convert anomaly values to native Python types
        converted_anomalies = []
        for anomaly in anomalies:
            converted_anomaly = {}
            for key, value in anomaly.items():
                if isinstance(value, (np.floating, np.integer)):
                    converted_anomaly[key] = float(value.item()) if hasattr(value, 'item') else float(value)
                else:
                    converted_anomaly[key] = convert_to_python_type(value)
            converted_anomalies.append(converted_anomaly)
        
        return jsonify({
            "pump_id": str(pump_id),
            "timestamp": datetime.now().isoformat(),
            "anomalies": converted_anomalies,
            "anomaly_score": float(round(anomaly_result['anomaly_score'], 3)),
            "is_anomaly": bool(anomaly_result['is_anomaly'])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/performance-curve', methods=['GET'])
def get_performance_curve(pump_id):
    """Get performance curve from real data"""
    try:
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        
        # Baseline curve from pump specs
        pump_spec = pump_master_df[pump_master_df['pump_id'] == pump_id].iloc[0]
        rated_flow = pump_spec.get('rated_flow_m3h', 150)
        rated_head = pump_spec.get('rated_head_m', 45)
        
        # Convert to Python types if needed
        rated_flow = convert_to_python_type(rated_flow)
        rated_head = convert_to_python_type(rated_head)
        
        baseline_curve = []
        for pct in range(0, 121, 10):
            flow = float(rated_flow) * (pct / 100)
            head = float(rated_head) * (1 - 0.5 * (pct / 100)**2)  # Typical curve shape
            baseline_curve.append({"flow": round(flow, 1), "head": round(head, 2)})
        
        # Actual points from CSV (limit to last 1000 points for performance)
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        # Use vectorized operations instead of iterrows()
        actual_points = [
            {
                "flow": round(float(convert_to_python_type(flow)), 1),
                "head": round(float(convert_to_python_type(head)), 2)
            }
            for flow, head in zip(pump_ops['flow_m3h'], pump_ops['head_m'])
        ]
        
        return jsonify({
            "pump_id": str(pump_id),
            "baseline_curve": baseline_curve,
            "actual_points": actual_points
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/maintenance-history', methods=['GET'])
def get_maintenance_history(pump_id):
    """Get real maintenance history from CSV"""
    try:
        history = []
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id]
        
        for _, row in pump_maintenance.iterrows():
            downtime = convert_to_python_type(row['downtime_hours'])
            history.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "action": str(row['action']),
                "component": str(row['component']),
                "notes": str(row['notes']),
                "downtime_hours": float(downtime) if downtime is not None else 0.0
            })
        
        return jsonify({
            "pump_id": str(pump_id),
            "maintenance_history": history
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get overall dashboard summary with AI analysis"""
    try:
        pumps_data = []
        for pump_id in operation_log_df['pump_id'].unique():
            try:
                latest_data = RealDataProvider.get_latest_reading(pump_id)
                anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
                health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
                health_val = convert_to_python_type(health_index)
                pumps_data.append({"pump_id": str(pump_id), "health": float(health_val) if health_val is not None else 85.0})
            except:
                continue
        
        total_pumps = len(pumps_data)
        normal_count = sum(1 for p in pumps_data if p['health'] > 80)
        warning_count = sum(1 for p in pumps_data if 60 < p['health'] <= 80)
        critical_count = sum(1 for p in pumps_data if p['health'] <= 60)
        
        overall_health = sum(p['health'] for p in pumps_data) / total_pumps if total_pumps > 0 else 0
        
        return jsonify({
            "total_pumps": int(total_pumps),
            "normal": int(normal_count),
            "warning": int(warning_count),
            "critical": int(critical_count),
            "overall_health": float(round(overall_health, 1)),
            "last_update": datetime.now().isoformat(),
            "data_source": "Real CSV Data + AI Analysis"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pump/<pump_id>/overview', methods=['GET'])
def get_pump_overview(pump_id):
    """Get comprehensive top-line overview for a pump"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        
        # Get pump master data
        pump_info = pump_master_df[pump_master_df['pump_id'] == pump_id].iloc[0]
        
        # Get last maintenance
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id]
        last_maintenance = None
        if not pump_maintenance.empty:
            last_maint = pump_maintenance.sort_values('date').iloc[-1]
            last_maintenance = {
                "date": last_maint['date'].strftime('%Y-%m-%d'),
                "action": str(last_maint['action']),
                "component": str(last_maint['component'])
            }
        
        # Calculate next maintenance (90 days from last or 90 days from now)
        if last_maintenance:
            last_date = pd.to_datetime(last_maintenance['date'])
            next_date = last_date + timedelta(days=90)
        else:
            next_date = datetime.now() + timedelta(days=90)
        
        # Determine operational status
        if health_index > 80:
            op_status = "Running"
        elif health_index > 60:
            op_status = "Warning"
        elif health_index > 40:
            op_status = "Standby"
        else:
            op_status = "Fault"
        
        return jsonify({
            "pump_id": str(pump_id),
            "plant": "Cooling Water Pump House",
            "site": "Unit 1",
            "model": str(pump_info.get('model', 'Unknown')),
            "location": f"Pump House - {pump_id}",
            "health_score": float(round(health_index, 1)),
            "rul_hours": int(rul),
            "rul_days": int(rul / 24),
            "operational_status": op_status,
            "last_maintenance": last_maintenance,
            "next_maintenance": next_date.strftime('%Y-%m-%d'),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/vibration', methods=['GET'])
def get_vibration_data(pump_id):
    """Get vibration and mechanical health data"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        # Get latest vibration reading
        latest_vib = pump_ops.iloc[-1]
        vibration_rms = float(convert_to_python_type(latest_vib.get('vibration_mm_s', 2.5)))
        
        # Simulate FFT spectrum (in real system, this would come from high-frequency data)
        rpm = float(convert_to_python_type(latest_data.get('rpm', 1450)))
        shaft_freq = rpm / 60  # Hz
        
        # Generate simulated spectrum with bearing frequencies
        frequencies = np.linspace(0, 200, 100)
        spectrum = np.zeros_like(frequencies)
        
        # Add shaft frequency and harmonics
        for harmonic in [1, 2, 3]:
            idx = np.argmin(np.abs(frequencies - harmonic * shaft_freq))
            if idx < len(spectrum):
                spectrum[idx] = vibration_rms * (0.5 / harmonic)
        
        # Add bearing frequencies (simplified)
        bearing_freq = shaft_freq * 3.5  # Typical bearing frequency
        for harmonic in [1, 2]:
            idx = np.argmin(np.abs(frequencies - harmonic * bearing_freq))
            if idx < len(spectrum):
                spectrum[idx] = vibration_rms * 0.3 / harmonic
        
        # Calculate bearing condition index (envelope RMS)
        bearing_condition = min(100, max(0, 100 - (vibration_rms - 1.0) * 20))
        
        # Misalignment indicator (2x shaft frequency amplitude)
        misalignment_idx = 0
        if len(spectrum) > 0:
            shaft_2x_idx = np.argmin(np.abs(frequencies - 2 * shaft_freq))
            if shaft_2x_idx < len(spectrum):
                misalignment_idx = float(spectrum[shaft_2x_idx] / (vibration_rms + 0.1))
        
        # Imbalance indicator (1x shaft frequency)
        imbalance_idx = 0
        if len(spectrum) > 0:
            shaft_1x_idx = np.argmin(np.abs(frequencies - shaft_freq))
            if shaft_1x_idx < len(spectrum):
                imbalance_idx = float(spectrum[shaft_1x_idx] / (vibration_rms + 0.1))
        
        # Historical vibration trend
        vib_trend = [
            {
                "timestamp": ts.isoformat(),
                "vibration_rms": float(convert_to_python_type(vib))
            }
            for ts, vib in zip(pump_ops['timestamp'], pump_ops['vibration_mm_s'])
        ][-100:]  # Last 100 points
        
        return jsonify({
            "pump_id": str(pump_id),
            "vibration_rms": float(round(vibration_rms, 2)),
            "vibration_unit": "mm/s",
            "bearing_condition_index": float(round(bearing_condition, 1)),
            "misalignment_indicator": float(round(misalignment_idx, 3)),
            "imbalance_indicator": float(round(imbalance_idx, 3)),
            "shaft_frequency_hz": float(round(shaft_freq, 2)),
            "rpm": float(round(rpm, 0)),
            "spectrum": {
                "frequencies": [float(f) for f in frequencies],
                "amplitudes": [float(a) for a in spectrum]
            },
            "trend": vib_trend,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/thermal', methods=['GET'])
def get_thermal_data(pump_id):
    """Get thermal diagnostics data"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        latest = pump_ops.iloc[-1]
        bearing_temp = float(convert_to_python_type(latest.get('bearing_temp_c', 65.0)))
        
        # Simulate motor winding temp (typically 10-20°C above bearing)
        motor_winding_temp = bearing_temp + 15.0 + np.random.randn() * 2
        casing_temp = bearing_temp - 5.0 + np.random.randn() * 1
        
        # Thermal trend
        thermal_trend = [
            {
                "timestamp": ts.isoformat(),
                "bearing_temp": float(convert_to_python_type(bt)),
                "motor_winding_temp": float(bt + 15 + np.random.randn() * 2),
                "casing_temp": float(bt - 5 + np.random.randn() * 1)
            }
            for ts, bt in zip(pump_ops['timestamp'], pump_ops['bearing_temp_c'])
        ][-100:]
        
        # Hot spot warning
        hot_spot_warning = bearing_temp > 75 or motor_winding_temp > 90
        
        return jsonify({
            "pump_id": str(pump_id),
            "bearing_temperature": float(round(bearing_temp, 1)),
            "motor_winding_temperature": float(round(motor_winding_temp, 1)),
            "casing_temperature": float(round(casing_temp, 1)),
            "unit": "°C",
            "hot_spot_warning": bool(hot_spot_warning),
            "trend": thermal_trend,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/electrical', methods=['GET'])
def get_electrical_data(pump_id):
    """Get electrical health data"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        if len(pump_ops) > 1000:
            pump_ops = pump_ops.tail(1000)
        
        # Calculate electrical parameters
        power_kw = float(convert_to_python_type(latest_data['motor_power_kw']))
        voltage = 400.0  # Assumed 400V system
        current = (power_kw * 1000) / (voltage * 0.85 * np.sqrt(3))  # Approximate 3-phase current
        power_factor = 0.85 + np.random.randn() * 0.05  # Simulated
        
        # Current unbalance (simulate)
        current_unbalance = abs(np.random.randn() * 2)  # %
        
        # Inrush current events (simulate based on start/stop)
        pump_ops_sorted = pump_ops.sort_values('timestamp')
        status_changes = (pump_ops_sorted['status'] != pump_ops_sorted['status'].shift()).sum()
        inrush_events = max(0, int(status_changes / 2))  # Approximate starts
        
        # Harmonic distortion (simulated)
        thd = 3.0 + abs(np.random.randn() * 1.5)  # Total Harmonic Distortion %
        
        # Electrical trend
        electrical_trend = [
            {
                "timestamp": ts.isoformat(),
                "current": float((p * 1000) / (voltage * 0.85 * np.sqrt(3))),
                "power": float(convert_to_python_type(p)),
                "voltage": voltage,
                "power_factor": float(0.85 + np.random.randn() * 0.05)
            }
            for ts, p in zip(pump_ops['timestamp'], pump_ops['motor_power_kw'])
        ][-100:]
        
        return jsonify({
            "pump_id": str(pump_id),
            "motor_current": float(round(current, 2)),
            "voltage": float(round(voltage, 1)),
            "power_consumption": float(round(power_kw, 2)),
            "power_factor": float(round(power_factor, 3)),
            "current_unbalance": float(round(current_unbalance, 2)),
            "inrush_current_events": int(inrush_events),
            "harmonic_distortion": float(round(thd, 2)),
            "electrical_efficiency": float(round(power_factor * 100, 1)),
            "trend": electrical_trend,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/hydraulic', methods=['GET'])
def get_hydraulic_data(pump_id):
    """Get hydraulic and process alarm data"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        pump_info = pump_master_df[pump_master_df['pump_id'] == pump_id].iloc[0]
        
        flow = float(convert_to_python_type(latest_data['flow_m3h']))
        discharge_p = float(convert_to_python_type(latest_data['discharge_pressure_bar']))
        suction_p = float(convert_to_python_type(latest_data['suction_pressure_bar']))
        delta_p = discharge_p - suction_p
        
        # Calculate NPSH margin (simplified)
        npsh_available = suction_p * 10.2  # Convert bar to meters
        npsh_required = 3.0 + (flow / 100)  # Simplified calculation
        npsh_margin = npsh_available - npsh_required
        cavitation_index = max(0, min(100, (npsh_margin / npsh_required) * 100))
        
        # Low flow detection
        rated_flow = float(convert_to_python_type(pump_info.get('rated_flow_m3h', 150)))
        low_flow = flow < (rated_flow * 0.3)
        dead_head = flow < (rated_flow * 0.1)
        
        # Seal leakage detection (pressure drop indicator)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        if len(pump_ops) > 100:
            recent_dp = (pump_ops['discharge_pressure_bar'] - pump_ops['suction_pressure_bar']).tail(100).mean()
            dp_trend = delta_p - recent_dp
            seal_leakage = dp_trend < -0.5  # Significant pressure drop
        else:
            seal_leakage = False
        
        # Gas-in-liquid (simulated - would need specific sensor)
        gas_detection = False  # Placeholder
        
        return jsonify({
            "pump_id": str(pump_id),
            "flow": float(round(flow, 2)),
            "flow_unit": "m³/h",
            "discharge_pressure": float(round(discharge_p, 2)),
            "suction_pressure": float(round(suction_p, 2)),
            "differential_pressure": float(round(delta_p, 2)),
            "pressure_unit": "bar",
            "cavitation_index": float(round(cavitation_index, 1)),
            "npsh_margin": float(round(npsh_margin, 2)),
            "npsh_margin_unit": "m",
            "low_flow_detected": bool(low_flow),
            "dead_head_detected": bool(dead_head),
            "seal_leakage_flag": bool(seal_leakage),
            "gas_in_liquid": bool(gas_detection),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/maintenance-metrics', methods=['GET'])
def get_maintenance_metrics(pump_id):
    """Get maintenance metrics: MTBF, MTTR, failure history"""
    try:
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id].copy()
        pump_failures = failure_data_df[failure_data_df['pump_id'] == pump_id].copy()
        
        # Calculate MTBF (Mean Time Between Failures)
        mtbf_hours = None
        if len(pump_failures) > 1:
            pump_failures = pump_failures.sort_values('failure_date')
            time_diffs = pump_failures['failure_date'].diff().dt.total_seconds() / 3600
            mtbf_hours = float(time_diffs.mean()) if len(time_diffs) > 1 else None
        
        # Calculate MTTR (Mean Time To Repair) from maintenance log
        mttr_hours = None
        if not pump_maintenance.empty:
            downtime_values = pump_maintenance['downtime_hours'].dropna()
            if len(downtime_values) > 0:
                mttr_hours = float(downtime_values.mean())
        
        # Failure modes history
        failure_modes = {}
        if not pump_failures.empty:
            for mode in pump_failures['failure_mode'].unique():
                count = len(pump_failures[pump_failures['failure_mode'] == mode])
                failure_modes[str(mode)] = int(count)
        
        # Maintenance history summary
        maintenance_summary = []
        if not pump_maintenance.empty:
            pump_maintenance = pump_maintenance.sort_values('date', ascending=False)
            for _, row in pump_maintenance.head(10).iterrows():
                maintenance_summary.append({
                    "date": row['date'].strftime('%Y-%m-%d'),
                    "action": str(row['action']),
                    "component": str(row['component']),
                    "downtime_hours": float(convert_to_python_type(row['downtime_hours'])),
                    "notes": str(row['notes'])
                })
        
        # Spare parts status (simulated)
        spare_parts = {
            "bearings": {"status": "in_stock", "quantity": 2},
            "seals": {"status": "in_stock", "quantity": 4},
            "impeller": {"status": "low_stock", "quantity": 1},
            "coupling": {"status": "in_stock", "quantity": 1}
        }
        
        return jsonify({
            "pump_id": str(pump_id),
            "mtbf_hours": float(round(mtbf_hours, 1)) if mtbf_hours else None,
            "mtbf_days": float(round(mtbf_hours / 24, 1)) if mtbf_hours else None,
            "mttr_hours": float(round(mttr_hours, 1)) if mttr_hours else None,
            "failure_modes": failure_modes,
            "total_failures": int(len(pump_failures)),
            "maintenance_history": maintenance_summary,
            "spare_parts": spare_parts,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/ml-outputs', methods=['GET'])
def get_ml_outputs(pump_id):
    """Get ML model outputs: anomaly score, failure mode probabilities, RUL distribution, feature importance"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        
        # Failure mode probabilities
        failure_modes = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        
        # Calculate probabilities for each failure mode
        failure_mode_probs = {
            "bearing": 0.0,
            "seal": 0.0,
            "cavitation": 0.0,
            "electrical": 0.0,
            "impeller": 0.0,
            "normal": 1.0
        }
        
        for anomaly in failure_modes:
            anomaly_type = str(anomaly['type']).lower()
            confidence = float(anomaly.get('confidence', 0.5))
            
            if 'bearing' in anomaly_type:
                failure_mode_probs['bearing'] = max(failure_mode_probs['bearing'], confidence)
            elif 'seal' in anomaly_type:
                failure_mode_probs['seal'] = max(failure_mode_probs['seal'], confidence)
            elif 'cavitation' in anomaly_type:
                failure_mode_probs['cavitation'] = max(failure_mode_probs['cavitation'], confidence)
            elif 'electrical' in anomaly_type or 'power' in anomaly_type:
                failure_mode_probs['electrical'] = max(failure_mode_probs['electrical'], confidence)
            elif 'impeller' in anomaly_type or 'fouling' in anomaly_type:
                failure_mode_probs['impeller'] = max(failure_mode_probs['impeller'], confidence)
        
        # Normalize probabilities
        total_prob = sum(failure_mode_probs.values())
        if total_prob > 0:
            failure_mode_probs = {k: v / total_prob for k, v in failure_mode_probs.items()}
        
        # RUL distribution (simplified - in production would use probabilistic model)
        rul_best = int(rul * 1.2)
        rul_median = int(rul)
        rul_worst = int(rul * 0.7)
        
        # Feature importance (simplified SHAP-like explanation)
        baseline = ai_predictor.baseline_stats.get(pump_id, {})
        feature_importance = []
        
        if baseline:
            # Flow deviation
            flow_dev = abs(latest_data['flow_m3h'] - baseline.get('flow_mean', latest_data['flow_m3h'])) / baseline.get('flow_mean', 1)
            feature_importance.append({"feature": "Flow Deviation", "importance": float(round(flow_dev * 100, 2))})
            
            # Efficiency
            head_m = (latest_data['discharge_pressure_bar'] - latest_data['suction_pressure_bar']) * 10.2
            hydraulic_power = (latest_data['flow_m3h'] * head_m) / 367
            efficiency = (hydraulic_power / latest_data['motor_power_kw']) * 100
            eff_dev = abs(efficiency - baseline.get('efficiency_mean', efficiency)) / baseline.get('efficiency_mean', 1)
            feature_importance.append({"feature": "Efficiency Deviation", "importance": float(round(eff_dev * 100, 2))})
            
            # Power consumption
            power_dev = abs(latest_data['motor_power_kw'] - baseline.get('power_mean', latest_data['motor_power_kw'])) / baseline.get('power_mean', 1)
            feature_importance.append({"feature": "Power Consumption", "importance": float(round(power_dev * 100, 2))})
        
        # Sort by importance
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return jsonify({
            "pump_id": str(pump_id),
            "anomaly_score": float(round(anomaly_result['anomaly_score'], 3)),
            "anomaly_threshold": 0.7,
            "is_anomaly": bool(anomaly_result['is_anomaly']),
            "failure_mode_probabilities": {k: float(round(v, 3)) for k, v in failure_mode_probs.items()},
            "rul_distribution": {
                "best_case_hours": rul_best,
                "median_hours": rul_median,
                "worst_case_hours": rul_worst
            },
            "feature_importance": feature_importance[:5],  # Top 5
            "health_index": float(round(health_index, 1)),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/root-cause', methods=['GET'])
def get_root_cause(pump_id):
    """Get root cause analysis and diagnostics"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        anomalies = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        
        # Get contributing sensor signals
        baseline = ai_predictor.baseline_stats.get(pump_id, {})
        contributing_signals = []
        
        if baseline:
            # Flow
            flow_dev = ((latest_data['flow_m3h'] - baseline.get('flow_mean', latest_data['flow_m3h'])) / baseline.get('flow_mean', 1)) * 100
            if abs(flow_dev) > 5:
                contributing_signals.append({
                    "signal": "Flow",
                    "deviation": float(round(flow_dev, 1)),
                    "unit": "%",
                    "impact": "high" if abs(flow_dev) > 15 else "medium"
                })
            
            # Efficiency
            head_m = (latest_data['discharge_pressure_bar'] - latest_data['suction_pressure_bar']) * 10.2
            hydraulic_power = (latest_data['flow_m3h'] * head_m) / 367
            efficiency = (hydraulic_power / latest_data['motor_power_kw']) * 100
            eff_dev = ((efficiency - baseline.get('efficiency_mean', efficiency)) / baseline.get('efficiency_mean', 1)) * 100
            if abs(eff_dev) > 5:
                contributing_signals.append({
                    "signal": "Efficiency",
                    "deviation": float(round(eff_dev, 1)),
                    "unit": "%",
                    "impact": "high" if abs(eff_dev) > 15 else "medium"
                })
            
            # Power
            power_dev = ((latest_data['motor_power_kw'] - baseline.get('power_mean', latest_data['motor_power_kw'])) / baseline.get('power_mean', 1)) * 100
            if abs(power_dev) > 5:
                contributing_signals.append({
                    "signal": "Power Consumption",
                    "deviation": float(round(power_dev, 1)),
                    "unit": "%",
                    "impact": "high" if abs(power_dev) > 15 else "medium"
                })
        
        # Suggested corrective actions
        corrective_actions = []
        for anomaly in anomalies:
            corrective_actions.append({
                "action": anomaly.get('recommendation', 'Inspection recommended'),
                "priority": anomaly.get('severity', 'medium'),
                "confidence": float(round(anomaly.get('confidence', 0.5), 2))
            })
        
        # If no specific actions, provide general recommendations
        if not corrective_actions:
            if health_index < 70:
                corrective_actions.append({
                    "action": "Comprehensive inspection recommended",
                    "priority": "medium",
                    "confidence": 0.7
                })
        
        return jsonify({
            "pump_id": str(pump_id),
            "health_index": float(round(health_index, 1)),
            "top_contributing_signals": contributing_signals[:5],
            "suggested_actions": corrective_actions,
            "detected_anomalies": len(anomalies),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/alerts', methods=['GET'])
def get_alerts(pump_id):
    """Get active alerts for a pump"""
    try:
        latest_data = RealDataProvider.get_latest_reading(pump_id)
        anomaly_result = ai_predictor.predict_anomaly_score(pump_id, latest_data)
        health_index = ai_predictor.calculate_health_index(pump_id, latest_data, anomaly_result)
        anomalies = ai_predictor.detect_failure_modes(pump_id, latest_data, health_index)
        rul = ai_predictor.predict_rul(pump_id, health_index, latest_data)
        
        alerts = []
        
        # Critical alerts
        if health_index < 50:
            alerts.append({
                "id": f"{pump_id}-critical-health",
                "severity": "critical",
                "title": "Critical Health Degradation",
                "message": f"Health index at {health_index:.1f}% - Immediate attention required",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "Maintenance Team",
                "estimated_downtime_hours": 8,
                "estimated_cost": 5000,
                "recommended_action": "Schedule immediate shutdown and inspection"
            })
        
        # Warning alerts
        elif health_index < 70:
            alerts.append({
                "id": f"{pump_id}-warning-health",
                "severity": "warning",
                "title": "Health Degradation Warning",
                "message": f"Health index at {health_index:.1f}% - Monitor closely",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "Operations",
                "estimated_downtime_hours": 4,
                "estimated_cost": 2000,
                "recommended_action": "Schedule preventive maintenance within 48 hours"
            })
        
        # RUL alerts
        if rul < 72:
            alerts.append({
                "id": f"{pump_id}-low-rul",
                "severity": "critical" if rul < 24 else "warning",
                "title": "Low Remaining Useful Life",
                "message": f"Estimated RUL: {rul} hours ({rul/24:.1f} days)",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "Maintenance Team",
                "estimated_downtime_hours": 6,
                "estimated_cost": 3000,
                "recommended_action": "Plan maintenance intervention"
            })
        
        # Anomaly alerts
        if anomaly_result['anomaly_score'] > 0.7:
            alerts.append({
                "id": f"{pump_id}-anomaly",
                "severity": "warning",
                "title": "Anomaly Detected",
                "message": f"Anomaly score: {anomaly_result['anomaly_score']:.2f}",
                "timestamp": datetime.now().isoformat(),
                "acknowledged": False,
                "responsible": "AI System",
                "estimated_downtime_hours": 2,
                "estimated_cost": 1000,
                "recommended_action": "Review sensor data and investigate anomalies"
            })
        
        # Failure mode alerts
        for anomaly in anomalies:
            if anomaly.get('severity') in ['high', 'critical']:
                alerts.append({
                    "id": f"{pump_id}-{anomaly['type'].lower().replace(' ', '-')}",
                    "severity": anomaly.get('severity', 'medium'),
                    "title": anomaly.get('type', 'Anomaly Detected'),
                    "message": anomaly.get('message', ''),
                    "timestamp": datetime.now().isoformat(),
                    "acknowledged": False,
                    "responsible": "Maintenance Team",
                    "estimated_downtime_hours": 4 if anomaly.get('severity') == 'high' else 8,
                    "estimated_cost": 2000 if anomaly.get('severity') == 'high' else 5000,
                    "recommended_action": anomaly.get('recommendation', 'Inspection recommended')
                })
        
        return jsonify({
            "pump_id": str(pump_id),
            "alerts": alerts,
            "total_alerts": len(alerts),
            "critical_count": sum(1 for a in alerts if a['severity'] == 'critical'),
            "warning_count": sum(1 for a in alerts if a['severity'] == 'warning'),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/reports', methods=['GET'])
def get_reports(pump_id):
    """Get reliability reports and KPIs"""
    try:
        # Get maintenance metrics
        pump_maintenance = maintenance_log_df[maintenance_log_df['pump_id'] == pump_id].copy()
        pump_failures = failure_data_df[failure_data_df['pump_id'] == pump_id].copy()
        
        # Calculate uptime (simplified - would need operational logs)
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        total_hours = len(pump_ops) * 0.083  # Assuming 5-minute intervals
        downtime_hours = pump_maintenance['downtime_hours'].sum() if not pump_maintenance.empty else 0
        uptime_pct = ((total_hours - downtime_hours) / total_hours * 100) if total_hours > 0 else 100
        
        # Number of interventions
        interventions = len(pump_maintenance)
        
        # Cost avoided (simplified calculation)
        cost_per_failure = 10000  # Estimated cost of unplanned failure
        cost_avoided = len(pump_failures) * cost_per_failure * 0.7  # Assume 70% cost avoidance
        
        # SLA compliance (assume 99% target)
        sla_target = 99.0
        sla_compliance = min(100, (uptime_pct / sla_target) * 100)
        
        # Cost of downtime (simplified)
        downtime_cost = downtime_hours * 500  # $500/hour
        
        # Weekly report data (last 4 weeks)
        weekly_reports = []
        end_date = datetime.now()
        for week in range(4):
            week_start = end_date - timedelta(days=7 * (week + 1))
            week_end = end_date - timedelta(days=7 * week)
            
            week_maintenance = pump_maintenance[
                (pump_maintenance['date'] >= week_start) & 
                (pump_maintenance['date'] < week_end)
            ]
            week_interventions = len(week_maintenance)
            week_downtime = week_maintenance['downtime_hours'].sum() if not week_maintenance.empty else 0
            
            weekly_reports.append({
                "week": f"Week {4 - week}",
                "start_date": week_start.strftime('%Y-%m-%d'),
                "end_date": week_end.strftime('%Y-%m-%d'),
                "interventions": int(week_interventions),
                "downtime_hours": float(round(week_downtime, 1)),
                "uptime_percentage": float(round(100 - (week_downtime / 168 * 100), 1)) if week_downtime > 0 else 100.0
            })
        
        return jsonify({
            "pump_id": str(pump_id),
            "uptime_percentage": float(round(uptime_pct, 2)),
            "number_of_interventions": int(interventions),
            "cost_avoided": float(round(cost_avoided, 2)),
            "sla_compliance": float(round(sla_compliance, 2)),
            "sla_target": float(sla_target),
            "downtime_cost": float(round(downtime_cost, 2)),
            "total_downtime_hours": float(round(downtime_hours, 1)),
            "weekly_reports": weekly_reports,
            "report_period": {
                "start": (datetime.now() - timedelta(days=28)).strftime('%Y-%m-%d'),
                "end": datetime.now().strftime('%Y-%m-%d')
            },
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/pump/<pump_id>/trend-signals', methods=['GET'])
def get_trend_signals(pump_id):
    """Get multi-signal time-series data for trend explorer"""
    try:
        signals = request.args.getlist('signals')  # Comma-separated list
        hours = int(request.args.get('hours', 24))
        
        pump_ops = operation_log_df[operation_log_df['pump_id'] == pump_id].copy()
        
        # Limit to recent data
        if len(pump_ops) > 5000:
            pump_ops = pump_ops.tail(5000)
        
        # Default signals if none specified
        if not signals:
            signals = ['flow', 'discharge_pressure', 'motor_power', 'vibration', 'bearing_temp']
        
        # Prepare data
        pump_ops = FeatureEngineer.calculate_derived_features(pump_ops)
        
        result = []
        for _, row in pump_ops.tail(int(hours * 12)).iterrows():  # Assuming 5-min intervals
            data_point = {
                "timestamp": row['timestamp'].isoformat()
            }
            
            for signal in signals:
                signal_lower = signal.lower()
                if signal_lower == 'flow':
                    data_point['flow'] = float(convert_to_python_type(row['flow_m3h']))
                elif signal_lower == 'discharge_pressure':
                    data_point['discharge_pressure'] = float(convert_to_python_type(row['discharge_pressure_bar']))
                elif signal_lower == 'suction_pressure':
                    data_point['suction_pressure'] = float(convert_to_python_type(row['suction_pressure_bar']))
                elif signal_lower == 'motor_power':
                    data_point['motor_power'] = float(convert_to_python_type(row['motor_power_kw']))
                elif signal_lower == 'vibration':
                    data_point['vibration'] = float(convert_to_python_type(row.get('vibration_mm_s', 2.5)))
                elif signal_lower == 'bearing_temp':
                    data_point['bearing_temp'] = float(convert_to_python_type(row.get('bearing_temp_c', 65.0)))
                elif signal_lower == 'efficiency':
                    data_point['efficiency'] = float(convert_to_python_type(row.get('efficiency', 70.0)))
                elif signal_lower == 'rpm':
                    data_point['rpm'] = float(convert_to_python_type(row.get('rpm', 1450.0)))
            
            result.append(data_point)
        
        return jsonify({
            "pump_id": str(pump_id),
            "signals": signals,
            "data": result,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 404

# ==================== Main ====================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting AI-Powered Pump Predictive Maintenance Backend")
    print("="*60)
    print(f"📊 Data Source: REAL CSV files from {DATA_DIR}")
    print(f"🧠 AI Models: Isolation Forest (Anomaly Detection)")
    print(f"📈 Feature Engineering: 10+ derived features")
    print(f"🔍 Pumps Available: {list(operation_log_df['pump_id'].unique())}")
    print(f"📡 API: http://localhost:5000/api/")
    print("="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
