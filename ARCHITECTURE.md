# System Architecture

## Overview

The Pump Health Monitoring System is a modular, scalable solution for predictive maintenance of centrifugal pumps. This document describes the system architecture, components, and data flow.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │   Streamlit      │         │   Jupyter Notebooks         │  │
│  │   Dashboard      │         │   (Analysis & Exploration)  │  │
│  └──────────────────┘         └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Data      │  │   Feature    │  │   RUL Prediction     │  │
│  │  Ingestion   │─▶│ Engineering  │─▶│   (XGBoost/RF)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Raw Sensor  │  │  Processed   │  │   Trained Models     │  │
│  │     Data     │  │   Features   │  │   & Metadata         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Data Ingestion Module

**Location:** `src/data_ingestion/`

**Responsibilities:**
- Load sensor data from CSV files or databases
- Validate data integrity and completeness
- Clean and preprocess raw data
- Generate synthetic data for testing

**Key Classes:**
- `PumpDataLoader`: Main class for data loading operations

**Data Flow:**
```
Sensor Systems → CSV Files → PumpDataLoader → Cleaned DataFrame
```

**Features:**
- Forward/backward fill for missing values
- Duplicate detection and removal
- Timestamp validation
- Synthetic data generation with degradation patterns

### 2. Feature Engineering Module

**Location:** `src/feature_engineering/`

**Responsibilities:**
- Create rolling statistical features
- Generate lag features for time series
- Calculate derivative features
- Build interaction features
- Compute health indicators

**Key Classes:**
- `PumpFeatureBuilder`: Orchestrates feature creation pipeline

**Feature Types:**

1. **Rolling Features** (window-based)
   - Mean, Standard Deviation, Min, Max
   - Configurable window size (default: 10 samples)

2. **Lag Features**
   - Historical values at t-1, t-5, t-10
   - Captures temporal dependencies

3. **Derivative Features**
   - Rate of change (first derivative)
   - Acceleration (second derivative)

4. **Interaction Features**
   - Efficiency = Flow Rate / Power Consumption
   - Pressure Differential = Pressure Out - Pressure In
   - Vibration/Temperature Ratio
   - Power per RPM

5. **Health Indicators**
   - Normalized vibration (0-1 scale)
   - Normalized temperature (0-1 scale)
   - Combined degradation index

**Pipeline:**
```
Raw Sensors → Rolling Stats → Lag Features → Derivatives → 
Interactions → Health Indicators → Feature Matrix
```

### 3. RUL Prediction Module

**Location:** `src/rul_prediction/`

**Responsibilities:**
- Train machine learning models
- Make RUL predictions
- Evaluate model performance
- Convert RUL to health index
- Provide feature importance analysis

**Key Classes:**
- `RULPredictor`: Main prediction engine

**Supported Models:**
- XGBoost Regressor (primary)
- Random Forest Regressor (alternative)

**Training Pipeline:**
```
Features → Scaling (StandardScaler) → Train/Test Split → 
Model Training → Evaluation → Model Persistence
```

**Evaluation Metrics:**
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- R² Score

### 4. Dashboard Module

**Location:** `src/dashboard.py`

**Responsibilities:**
- Real-time health monitoring
- Interactive visualization
- Maintenance recommendations
- Multi-pump management

**Features:**

1. **Health Monitoring**
   - Health status indicator
   - Health index gauge (0-100%)
   - Estimated RUL display

2. **Sensor Monitoring**
   - Current readings display
   - Historical trends charts
   - Multiple visualization tabs

3. **Analytics**
   - Efficiency tracking
   - Vibration & temperature correlation
   - Feature importance display

4. **Alerts & Recommendations**
   - Automatic health-based alerts
   - Maintenance scheduling suggestions
   - Critical status warnings

**Technology Stack:**
- Streamlit for UI framework
- Plotly for interactive charts
- Pandas for data manipulation

## Data Models

### Sensor Data Schema

```python
{
    'pump_id': int,              # Unique pump identifier
    'timestamp': datetime,       # Measurement timestamp
    'flow_rate': float,          # L/min
    'pressure_in': float,        # bar
    'pressure_out': float,       # bar
    'temperature': float,        # °C
    'vibration': float,          # mm/s
    'power_consumption': float,  # kW
    'rpm': float,                # Rotations per minute
    'rul': float                 # Remaining Useful Life (hours)
}
```

### Feature Matrix Schema

Extended from sensor data with:
- 140+ engineered features
- Rolling statistics (4 per sensor × 7 sensors = 28)
- Lag features (3 lags × 7 sensors = 21)
- Derivative features (2 per sensor × 7 sensors = 14)
- Interaction features (4)
- Health indicators (3)

### Model Output Schema

```python
{
    'pump_id': int,
    'timestamp': datetime,
    'rul_prediction': float,     # Predicted RUL in hours
    'health_index': float,       # 0-1 scale
    'health_status': str,        # Excellent/Good/Fair/Poor/Critical
    'recommendation': str        # Maintenance action
}
```

## Configuration Management

**Location:** `src/config.py`

**Configuration Categories:**

1. **Directories:**
   - Base, data, models paths
   - Auto-creation on import

2. **Model Configuration:**
   - Train/test split ratio
   - Random seed
   - XGBoost hyperparameters

3. **Feature Configuration:**
   - Window sizes
   - Lag periods
   - Rolling feature types

4. **Health Thresholds:**
   - Excellent: ≥90%
   - Good: ≥70%
   - Fair: ≥50%
   - Poor: ≥30%
   - Critical: <30%

## Training Pipeline

**Location:** `src/train_model.py`

**Workflow:**

```
┌─────────────────┐
│  Load Raw Data  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clean & Validate│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feature Engineering│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Train Model    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Evaluate Model │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Save Model     │
│  & Metrics      │
└─────────────────┘
```

**Steps:**
1. Data loading (synthetic or real)
2. Feature engineering
3. Train/test split (80/20)
4. Model training (XGBoost)
5. Evaluation (RMSE, MAE, R²)
6. Feature importance analysis
7. Model persistence (joblib)

## Prediction Pipeline

**Real-time Prediction Flow:**

```
New Sensor Data → Feature Engineering → Scaling → 
Model Prediction → Health Index Calculation → 
Recommendation Generation → Dashboard Display
```

**Batch Prediction Flow:**

```
Historical Data → Feature Engineering → Scaling → 
Batch Predictions → Health Index Array → 
Trend Analysis → Report Generation
```

## Scalability Considerations

### Current Limitations
- Single-instance deployment
- In-memory data processing
- File-based model storage
- No distributed computing

### Scaling Strategies

1. **Horizontal Scaling:**
   - Load balancer for dashboard instances
   - Distributed model serving (TF Serving)
   - Message queue for predictions (RabbitMQ/Kafka)

2. **Vertical Scaling:**
   - GPU acceleration for XGBoost
   - Increased memory for larger datasets
   - SSD storage for faster I/O

3. **Data Scaling:**
   - PostgreSQL/TimescaleDB for time series
   - Data partitioning by pump_id
   - Incremental model updates

4. **Cache Layer:**
   - Redis for prediction caching
   - Memcached for session data
   - CDN for static assets

## Security Architecture

### Current Implementation
- No authentication (development only)
- Local file system storage
- HTTP communication

### Production Requirements

1. **Authentication & Authorization:**
   - OAuth 2.0 / SAML integration
   - Role-based access control (RBAC)
   - Multi-factor authentication

2. **Data Security:**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - Secure credential management (Vault)

3. **API Security:**
   - API key authentication
   - Rate limiting
   - Input validation and sanitization

4. **Audit & Compliance:**
   - Access logs
   - Change tracking
   - Compliance reporting (GDPR, etc.)

## Performance Metrics

### Current Performance
- **Data Loading:** ~5s for 10K samples
- **Feature Engineering:** ~10s for 10K samples
- **Model Training:** ~30s on CPU
- **Prediction:** <1s for 1K samples
- **Dashboard Load:** ~3s initial load

### Optimization Opportunities
- Parallel feature computation
- Model quantization for faster inference
- Incremental feature updates
- Lazy loading in dashboard

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Streamlit | Interactive dashboard |
| Visualization | Plotly, Matplotlib | Charts and graphs |
| ML Framework | XGBoost, Scikit-learn | Model training |
| Data Processing | Pandas, NumPy | Data manipulation |
| Serialization | Joblib | Model persistence |
| Notebook | Jupyter | Analysis & exploration |
| Containerization | Docker | Deployment |
| Version Control | Git | Source management |

## Future Enhancements

1. **Real-time Streaming:**
   - Apache Kafka integration
   - Stream processing with Flink/Spark
   - Real-time anomaly detection

2. **Advanced Analytics:**
   - Deep learning models (LSTM, Transformer)
   - Ensemble methods
   - AutoML for hyperparameter tuning

3. **IoT Integration:**
   - MQTT protocol support
   - Edge computing deployment
   - Sensor data validation

4. **Alerting System:**
   - Email notifications
   - SMS alerts
   - Webhook integrations (Slack, PagerDuty)

5. **Reporting:**
   - Automated report generation
   - PDF export
   - Scheduled email reports

## Maintenance & Monitoring

### Application Monitoring
- Prediction accuracy tracking
- Model drift detection
- Performance metrics collection

### Infrastructure Monitoring
- Resource utilization
- Error rates
- Response times

### Model Retraining
- Scheduled retraining (weekly/monthly)
- Triggered by performance degradation
- A/B testing for new models

---

**Document Version:** 1.0  
**Last Updated:** 2024-10-16  
**Maintained By:** Development Team
