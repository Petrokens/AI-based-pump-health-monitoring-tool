# Quick Start Guide

This guide will help you get started with the Pump Health Monitoring Tool in just a few minutes.

## Prerequisites

- Python 3.8 or higher
- pip package manager
- 2GB free disk space

## Installation (5 minutes)

### Option 1: Using the setup script (Recommended)

```bash
# Clone the repository
git clone https://github.com/Petrokens/AI-based-pump-health-monitoring-tool.git
cd AI-based-pump-health-monitoring-tool

# Run setup script
./setup.sh
```

### Option 2: Manual installation

```bash
# Clone the repository
git clone https://github.com/Petrokens/AI-based-pump-health-monitoring-tool.git
cd AI-based-pump-health-monitoring-tool

# Install dependencies
pip install -r requirements.txt

# Verify installation
python tests/test_data_loader.py
```

## Usage

### 1. Train the Model (2-3 minutes)

Train the XGBoost model for RUL prediction:

```bash
cd src
python train_model.py
```

Expected output:
- Synthetic data generated (10,000 samples)
- Features engineered (100+ features)
- Model trained and evaluated
- Model saved to `src/models/pump_rul_model.pkl`
- Metrics saved to `src/models/model_metrics.json`

### 2. Launch the Dashboard (1 minute)

Start the interactive Streamlit dashboard:

```bash
cd src
streamlit run dashboard.py
```

The dashboard will open automatically in your browser at `http://localhost:8501`

### 3. Explore the Dashboard

Navigate through the dashboard to:

1. **Select a pump** from the sidebar dropdown
2. **View health metrics**:
   - Health status (Excellent/Good/Fair/Poor/Critical)
   - Health index gauge (0-100%)
   - Estimated RUL in hours
   - Current power consumption

3. **Check maintenance recommendations**:
   - Automatic alerts based on health status
   - Suggested maintenance actions

4. **Analyze trends**:
   - **Sensor Trends tab**: View all sensor readings over time
   - **Efficiency tab**: Monitor flow rate vs power consumption
   - **Vibration & Temperature tab**: Track critical health indicators

5. **Understand predictions**:
   - Feature importance chart shows which sensors contribute most to predictions

## Understanding the Metrics

### Health Index
- **90-100%** (🟢 Excellent): No action required
- **70-90%** (🟡 Good): Schedule preventive maintenance
- **50-70%** (🟠 Fair): Maintenance within 2 weeks
- **30-50%** (🔴 Poor): Urgent maintenance required
- **0-30%** (🔴 Critical): Immediate shutdown recommended

### RUL (Remaining Useful Life)
- Estimated hours until maintenance is required
- Based on current degradation patterns
- Updates in real-time with new sensor data

### Efficiency
- Calculated as: Flow Rate / Power Consumption
- Lower efficiency indicates potential issues
- Track trends to identify gradual degradation

## Advanced Usage

### Using Your Own Data

Replace the synthetic data with your actual pump sensor data:

1. Prepare a CSV file with these columns:
   - `pump_id`: Unique identifier for each pump
   - `timestamp`: Datetime of measurement
   - `flow_rate`: Flow rate (L/min)
   - `pressure_in`: Input pressure (bar)
   - `pressure_out`: Output pressure (bar)
   - `temperature`: Operating temperature (°C)
   - `vibration`: Vibration level (mm/s)
   - `power_consumption`: Power consumption (kW)
   - `rpm`: Rotations per minute
   - `rul`: Remaining useful life in hours (optional for training)

2. Save to `data/raw/pump_sensor_data.csv`

3. Retrain the model:
   ```bash
   cd src
   python train_model.py
   ```

### Jupyter Notebook Analysis

For detailed analysis and experimentation:

```bash
jupyter notebook notebooks/pump_analysis.ipynb
```

The notebook includes:
- Data exploration and visualization
- Feature engineering examples
- Model training and evaluation
- Custom predictions
- Interactive plots

### Configuration

Customize the system by editing `src/config.py`:

```python
# Adjust model parameters
MODEL_CONFIG = {
    "test_size": 0.2,
    "xgboost_params": {
        "n_estimators": 150,  # Increase for better accuracy
        "max_depth": 8,       # Adjust model complexity
        ...
    }
}

# Change health thresholds
HEALTH_THRESHOLDS = {
    "excellent": 0.9,
    "good": 0.7,
    ...
}
```

## Troubleshooting

### Issue: Import errors
**Solution**: Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: Model not found in dashboard
**Solution**: Train the model first:
```bash
cd src && python train_model.py
```

### Issue: Port 8501 already in use
**Solution**: Use a different port:
```bash
streamlit run dashboard.py --server.port 8502
```

### Issue: Memory errors with large datasets
**Solution**: Reduce data size or adjust batch processing in `data_loader.py`

## Next Steps

1. **Explore the code**: Browse through `src/` to understand the implementation
2. **Customize features**: Add domain-specific features in `feature_builder.py`
3. **Improve the model**: Experiment with different algorithms in `predictor.py`
4. **Enhance the dashboard**: Add custom visualizations in `dashboard.py`
5. **Deploy to production**: Consider containerization with Docker

## Support

- Check the full [README.md](README.md) for detailed documentation
- Review the [Jupyter notebook](notebooks/pump_analysis.ipynb) for examples
- Open an issue on GitHub for bugs or feature requests

## Performance Benchmarks

On a typical laptop (4-core CPU, 8GB RAM):

- **Data generation**: ~5 seconds for 10,000 samples
- **Feature engineering**: ~10 seconds
- **Model training**: ~15-30 seconds
- **Prediction**: <1 second for 1000 samples
- **Dashboard load time**: ~2-3 seconds

---

**Happy monitoring! 🔧⚙️📊**
