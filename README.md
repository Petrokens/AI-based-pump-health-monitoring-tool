# AI-based Pump Health Monitoring Tool

A Python-based digital twin for centrifugal pump predictive maintenance using machine learning. This system predicts the Remaining Useful Life (RUL) of pumps and provides real-time health monitoring with maintenance recommendations.

## 🚀 Features

- **Data Ingestion**: Load and validate pump sensor data with synthetic data generation capabilities
- **Feature Engineering**: Advanced feature creation including rolling statistics, lag features, and health indicators
- **RUL Prediction**: XGBoost-based machine learning model for predicting Remaining Useful Life
- **Interactive Dashboard**: Streamlit web application for real-time pump health monitoring
- **Maintenance Recommendations**: Intelligent alerts and maintenance scheduling based on health index
- **Visualization**: Comprehensive charts for sensor trends, efficiency, and feature importance

## 📁 Project Structure

```
AI-based-pump-health-monitoring-tool/
├── src/
│   ├── data_ingestion/
│   │   ├── __init__.py
│   │   └── data_loader.py          # Data loading and validation
│   ├── feature_engineering/
│   │   ├── __init__.py
│   │   └── feature_builder.py      # Feature engineering pipeline
│   ├── rul_prediction/
│   │   ├── __init__.py
│   │   └── predictor.py            # RUL prediction model
│   ├── models/                      # Saved trained models
│   ├── config.py                    # Configuration settings
│   ├── train_model.py              # Model training pipeline
│   └── dashboard.py                # Streamlit dashboard
├── data/
│   ├── raw/                        # Raw sensor data
│   └── processed/                  # Processed features
├── notebooks/
│   └── pump_analysis.ipynb         # Analysis and exploration notebook
├── requirements.txt                # Python dependencies
└── README.md                       # This file
```

## 🛠️ Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Petrokens/AI-based-pump-health-monitoring-tool.git
cd AI-based-pump-health-monitoring-tool
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## 📊 Usage

### 1. Train the Model

Train the RUL prediction model on synthetic pump data:

```bash
cd src
python train_model.py
```

This will:
- Generate synthetic pump sensor data (or use existing data)
- Perform feature engineering
- Train an XGBoost model
- Evaluate model performance
- Save the trained model and metrics

### 2. Launch the Dashboard

Start the Streamlit dashboard:

```bash
cd src
streamlit run dashboard.py
```

The dashboard will open in your browser at `http://localhost:8501`

### 3. Explore with Jupyter Notebook

For detailed analysis and experimentation:

```bash
jupyter notebook notebooks/pump_analysis.ipynb
```

## 📈 Dashboard Features

The Streamlit dashboard provides:

1. **Real-time Health Monitoring**
   - Health status indicator (Excellent/Good/Fair/Poor/Critical)
   - Health index gauge (0-100%)
   - Estimated RUL in hours

2. **Sensor Readings**
   - Current values for all sensors
   - Historical trends visualization

3. **Efficiency Tracking**
   - Flow rate vs power consumption
   - Efficiency trends over time

4. **Maintenance Recommendations**
   - Intelligent alerts based on health status
   - Suggested maintenance actions

5. **Feature Importance**
   - Top features influencing predictions
   - Model interpretability

## 🔧 Configuration

Edit `src/config.py` to customize:

- Data directories
- Model parameters (XGBoost settings)
- Feature engineering settings (window sizes, lag periods)
- Health thresholds
- Sensor column names

Example configuration:

```python
MODEL_CONFIG = {
    "test_size": 0.2,
    "random_state": 42,
    "xgboost_params": {
        "n_estimators": 100,
        "max_depth": 6,
        "learning_rate": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": 42
    }
}

HEALTH_THRESHOLDS = {
    "excellent": 0.9,
    "good": 0.7,
    "fair": 0.5,
    "poor": 0.3,
    "critical": 0.0
}
```

## 📊 Data Format

The system expects pump sensor data with the following columns:

- `pump_id`: Unique pump identifier
- `timestamp`: Timestamp of measurement
- `flow_rate`: Flow rate (L/min)
- `pressure_in`: Input pressure (bar)
- `pressure_out`: Output pressure (bar)
- `temperature`: Operating temperature (°C)
- `vibration`: Vibration level (mm/s)
- `power_consumption`: Power consumption (kW)
- `rpm`: Rotations per minute
- `rul`: Remaining useful life in hours (target variable)

## 🤖 Model Details

### Features Generated

The feature engineering pipeline creates:

- **Rolling features**: Mean, std, min, max over time windows
- **Lag features**: Historical values at different time lags
- **Derivative features**: Rate of change and acceleration
- **Interaction features**: 
  - Efficiency (flow_rate / power_consumption)
  - Pressure differential
  - Vibration to temperature ratio
- **Health indicators**: Normalized degradation indices

### Model Architecture

- **Algorithm**: XGBoost Regressor
- **Target**: Remaining Useful Life (RUL) in hours
- **Evaluation Metrics**: RMSE, MAE, R²

### Performance

On synthetic data, the model achieves:
- RMSE: ~50-80 hours
- MAE: ~40-60 hours
- R² Score: ~0.85-0.95

## 🔍 Example Use Cases

1. **Predictive Maintenance**: Schedule maintenance before failures occur
2. **Fleet Monitoring**: Monitor multiple pumps simultaneously
3. **Efficiency Optimization**: Track and improve pump efficiency
4. **Anomaly Detection**: Identify unusual sensor patterns
5. **Cost Reduction**: Reduce unplanned downtime and maintenance costs

## 📝 Dependencies

Key libraries used:

- **Data Processing**: Pandas, NumPy
- **Machine Learning**: Scikit-learn, XGBoost
- **Visualization**: Matplotlib, Seaborn, Plotly
- **Dashboard**: Streamlit
- **Notebook**: Jupyter

See `requirements.txt` for complete list with versions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

## 🙏 Acknowledgments

This project demonstrates the application of machine learning for industrial predictive maintenance, combining data science techniques with real-world operational requirements.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: The system includes synthetic data generation for demonstration purposes. For production use, replace with actual sensor data from your pump monitoring system.