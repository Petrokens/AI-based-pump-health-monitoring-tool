# Quick Start Guide

Get started with the Pump Health Monitoring Tool in 5 minutes!

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- 2GB free disk space

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Petrokens/AI-based-pump-health-monitoring-tool.git
cd AI-based-pump-health-monitoring-tool
```

### 2. Create Virtual Environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

## Running the System

### Option 1: Run Complete Pipeline
Execute the full pipeline to generate data, train models, and prepare the system:

```bash
python main.py
```

This will:
- ✅ Generate synthetic pump sensor data (10,000 samples)
- ✅ Perform advanced feature engineering
- ✅ Train 4 ML models (Linear Regression, Random Forest, Gradient Boosting, XGBoost)
- ✅ Save trained models to the `models/` directory
- ✅ Display feature importance and model performance metrics

Expected output:
```
============================================================
Pump Health Monitoring - Digital Twin Pipeline
============================================================

[1/4] Data Ingestion...
Generated 10000 samples and saved to data/raw/pump_sensor_data.csv

[2/4] Feature Engineering...
Feature engineering complete. Total features: 98

[3/4] Model Training...
linear_regression Performance:
  RMSE: 23.47 days
  MAE: 16.00 days
  R²: -5.0569

[4/4] Feature Importance Analysis...

============================================================
Pipeline completed successfully!
============================================================
```

### Option 2: Launch Dashboard
Start the interactive Streamlit dashboard:

```bash
streamlit run src/dashboard.py
```

The dashboard will open in your browser at `http://localhost:8501`

**Dashboard Features:**
- 📊 Real-time health index monitoring
- 📈 Sensor trend analysis
- ⚡ Efficiency tracking
- 🔮 RUL predictions
- 🔧 Automated maintenance recommendations
- 📋 Data exploration tools

### Option 3: Jupyter Notebook Analysis
For detailed data exploration and analysis:

```bash
jupyter notebook notebooks/01_exploratory_data_analysis.ipynb
```

## Using Your Own Data

Replace the synthetic data with your real pump sensor data:

1. Place your CSV file in `data/raw/`
2. Ensure it has the following columns:
   - `timestamp`: DateTime of measurement
   - `vibration`: Vibration amplitude (mm/s)
   - `temperature`: Operating temperature (°C)
   - `pressure`: System pressure (bar)
   - `flow_rate`: Flow rate (m³/h)
   - `current`: Electrical current (A)
   - `rpm`: Rotations per minute
   - `rul`: Remaining Useful Life in days (optional, for training)
   - `health_status`: Health category (optional, for training)

3. Update the filename in `main.py`:
   ```python
   df = ingestion.load_sensor_data("your_data.csv")
   ```

4. Re-run the pipeline:
   ```bash
   python main.py
   ```

## Project Structure Overview

```
📁 AI-based-pump-health-monitoring-tool/
├── 📁 src/                    # Source code
│   ├── data_ingestion.py      # Data loading & preprocessing
│   ├── feature_engineering.py # Feature creation
│   ├── rul_prediction.py      # ML models
│   └── dashboard.py           # Streamlit dashboard
├── 📁 data/                   # Data storage
│   ├── raw/                   # Original sensor data
│   └── processed/             # Processed features
├── 📁 models/                 # Trained ML models
├── 📁 notebooks/              # Jupyter notebooks
├── main.py                    # Main pipeline script
├── requirements.txt           # Python dependencies
└── README.md                  # Full documentation
```

## Troubleshooting

### Issue: "ModuleNotFoundError"
**Solution:** Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: "FileNotFoundError: pump_sensor_data.csv"
**Solution:** Run the main pipeline first to generate sample data:
```bash
python main.py
```

### Issue: Dashboard not loading
**Solution:** Check if Streamlit is properly installed and port 8501 is available:
```bash
pip install --upgrade streamlit
streamlit run src/dashboard.py --server.port 8502  # Try different port
```

### Issue: Low model performance
**Solution:** 
- Ensure you have enough training data (>1000 samples recommended)
- Check data quality (no missing values, outliers handled)
- Adjust model hyperparameters in `src/rul_prediction.py`

## Next Steps

1. **Customize Models**: Modify hyperparameters in `src/rul_prediction.py`
2. **Add Features**: Extend `src/feature_engineering.py` with domain-specific features
3. **Dashboard Themes**: Customize the dashboard appearance in `src/dashboard.py`
4. **Integration**: Connect to real-time data sources via MQTT, OPC-UA, etc.
5. **Deployment**: Deploy on cloud platforms (AWS, Azure, GCP) or edge devices

## Support

- 📖 Full documentation: See [README.md](README.md)
- 🐛 Report issues: [GitHub Issues](https://github.com/Petrokens/AI-based-pump-health-monitoring-tool/issues)
- 💡 Feature requests: Create an issue with the "enhancement" label

## Performance Expectations

With the synthetic dataset:
- **Training time**: ~30 seconds
- **Prediction time**: <1 second for 1000 samples
- **Dashboard load time**: ~2-3 seconds
- **Memory usage**: ~500MB
- **Model accuracy**: R² > 0.90 for best models

## Key Commands Reference

| Command | Purpose |
|---------|---------|
| `python main.py` | Run complete pipeline |
| `streamlit run src/dashboard.py` | Launch dashboard |
| `jupyter notebook notebooks/` | Open notebooks |
| `python -m src.data_ingestion` | Generate sample data only |
| `python -m src.rul_prediction` | Train models only |

---

**Ready to monitor your pump health? Run `python main.py` to get started!** 🚀
