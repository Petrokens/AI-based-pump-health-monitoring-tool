# AI-Based Pump Health Monitoring Tool

A Python-based digital twin for centrifugal pump predictive maintenance using machine learning.

## Overview

This project implements a comprehensive predictive maintenance system for centrifugal pumps using sensor data analysis and machine learning models. The system includes:

- **Data Ingestion**: Load and validate pump sensor data
- **Feature Engineering**: Create advanced features from raw sensor readings
- **RUL Prediction**: Predict Remaining Useful Life using multiple ML models (Random Forest, Gradient Boosting, XGBoost)
- **Interactive Dashboard**: Real-time monitoring with Streamlit
- **Health Index**: Composite metric for overall pump health
- **Maintenance Recommendations**: Automated alerts and action items

## Project Structure

```
AI-based-pump-health-monitoring-tool/
├── src/
│   ├── __init__.py
│   ├── data_ingestion.py          # Data loading and preprocessing
│   ├── feature_engineering.py     # Feature creation and transformation
│   ├── rul_prediction.py          # ML models for RUL prediction
│   └── dashboard.py               # Streamlit dashboard application
├── data/
│   ├── raw/                       # Raw sensor data
│   └── processed/                 # Processed feature data
├── notebooks/
│   └── 01_exploratory_data_analysis.ipynb
├── models/                        # Trained ML models
├── requirements.txt               # Project dependencies
├── main.py                        # Main pipeline script
└── README.md
```

## Features

### Sensor Monitoring
- Vibration analysis
- Temperature tracking
- Pressure monitoring
- Flow rate measurement
- Current consumption
- RPM (Rotations Per Minute)

### Advanced Analytics
- Rolling statistical features (mean, std, min, max)
- Lag features for time series
- Rate of change indicators
- Interaction and ratio features
- Time-based features (cyclical encoding)
- Composite health index

### Machine Learning Models
- Linear Regression (baseline)
- Random Forest Regressor
- Gradient Boosting Regressor
- XGBoost Regressor

### Dashboard Features
- Real-time health monitoring
- Efficiency trend analysis
- RUL prediction visualization
- Sensor correlation analysis
- Automated maintenance recommendations
- Interactive time range selection
- Key performance indicators (KPIs)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Petrokens/AI-based-pump-health-monitoring-tool.git
cd AI-based-pump-health-monitoring-tool
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### 1. Run Complete Pipeline

Execute the main pipeline to generate data, engineer features, and train models:

```bash
python main.py
```

This will:
- Generate synthetic pump sensor data (if not exists)
- Perform feature engineering
- Train multiple ML models
- Save trained models for deployment

### 2. Launch Dashboard

Start the interactive Streamlit dashboard:

```bash
streamlit run src/dashboard.py
```

The dashboard will be available at `http://localhost:8501`

### 3. Exploratory Analysis

Open the Jupyter notebook for detailed data exploration:

```bash
jupyter notebook notebooks/01_exploratory_data_analysis.ipynb
```

## Data Format

The system expects sensor data in CSV format with the following columns:

- `timestamp`: DateTime of measurement
- `vibration`: Vibration amplitude (mm/s)
- `temperature`: Operating temperature (°C)
- `pressure`: System pressure (bar)
- `flow_rate`: Flow rate (m³/h)
- `current`: Electrical current (A)
- `rpm`: Rotations per minute
- `rul`: Remaining Useful Life (days) - for training
- `health_status`: Health category (Healthy/Warning/Critical) - for training

## Model Performance

The system trains multiple models and automatically selects the best performer based on RMSE:

| Model | Typical RMSE | Typical MAE | Typical R² |
|-------|--------------|-------------|------------|
| Linear Regression | ~50 days | ~40 days | ~0.85 |
| Random Forest | ~30 days | ~25 days | ~0.93 |
| Gradient Boosting | ~28 days | ~23 days | ~0.94 |
| XGBoost | ~25 days | ~20 days | ~0.95 |

*Note: Performance metrics may vary based on data characteristics*

## Health Index Calculation

The composite health index (0-100 scale) is calculated from:
- Normalized vibration levels (lower is better)
- Temperature deviation from normal (closer to normal is better)
- Pressure stability (stable is better)

Health Status Categories:
- **Healthy** (70-100): Normal operation
- **Warning** (50-70): Requires attention
- **Critical** (<50): Immediate maintenance needed

## Maintenance Recommendations

The system provides automated recommendations based on:
- Current health index
- Remaining useful life
- Sensor anomalies
- Historical trends

Priority levels:
- 🔴 **CRITICAL**: Immediate action required
- 🟡 **WARNING**: Schedule maintenance soon
- 🟢 **GOOD**: Continue normal operations

## Dependencies

- pandas (2.0.3)
- numpy (1.24.3)
- scikit-learn (1.3.0)
- xgboost (1.7.6)
- streamlit (1.27.0)
- matplotlib (3.7.2)
- seaborn (0.12.2)
- plotly (5.17.0)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the terms specified in the LICENSE file.

## Contact

For questions or support, please open an issue on GitHub.