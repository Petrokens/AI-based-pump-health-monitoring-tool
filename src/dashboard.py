"""
Streamlit dashboard for pump health monitoring
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from pathlib import Path
import sys

# Add src to path
sys.path.append(str(Path(__file__).parent))

from data_ingestion.data_loader import PumpDataLoader
from feature_engineering.feature_builder import PumpFeatureBuilder
from rul_prediction.predictor import RULPredictor
from config import (
    RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR,
    SENSOR_COLUMNS, TARGET_COLUMN, HEALTH_THRESHOLDS
)

# Page configuration
st.set_page_config(
    page_title="Pump Health Monitoring Dashboard",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    </style>
""", unsafe_allow_html=True)


@st.cache_data
def load_data():
    """Load pump sensor data"""
    data_loader = PumpDataLoader()
    raw_data_file = RAW_DATA_DIR / "pump_sensor_data.csv"
    
    if raw_data_file.exists():
        df = data_loader.load_csv(raw_data_file)
    else:
        df = data_loader.generate_synthetic_data(n_samples=10000, n_pumps=5)
        df.to_csv(raw_data_file, index=False)
    
    return df


@st.cache_resource
def load_model():
    """Load trained model"""
    model_file = MODELS_DIR / "pump_rul_model.pkl"
    
    if model_file.exists():
        predictor = RULPredictor()
        predictor.load_model(model_file)
        return predictor
    else:
        return None


def get_health_status(health_index):
    """Get health status from health index"""
    if health_index >= HEALTH_THRESHOLDS['excellent']:
        return "Excellent", "🟢"
    elif health_index >= HEALTH_THRESHOLDS['good']:
        return "Good", "🟡"
    elif health_index >= HEALTH_THRESHOLDS['fair']:
        return "Fair", "🟠"
    elif health_index >= HEALTH_THRESHOLDS['poor']:
        return "Poor", "🔴"
    else:
        return "Critical", "🔴"


def get_maintenance_recommendation(health_index, rul):
    """Get maintenance recommendation"""
    if health_index >= HEALTH_THRESHOLDS['excellent']:
        return "No immediate action required. Continue routine monitoring."
    elif health_index >= HEALTH_THRESHOLDS['good']:
        return "Schedule preventive maintenance within the next month."
    elif health_index >= HEALTH_THRESHOLDS['fair']:
        return f"Maintenance recommended within 2 weeks. Estimated RUL: {rul:.0f} hours."
    elif health_index >= HEALTH_THRESHOLDS['poor']:
        return f"Urgent maintenance required! Estimated RUL: {rul:.0f} hours."
    else:
        return "CRITICAL: Immediate shutdown and maintenance required!"


def plot_sensor_trends(df, pump_id):
    """Plot sensor trends over time"""
    df_pump = df[df['pump_id'] == pump_id].tail(500)
    
    fig = go.Figure()
    
    for sensor in SENSOR_COLUMNS:
        if sensor in df_pump.columns:
            fig.add_trace(go.Scatter(
                x=df_pump['timestamp'],
                y=df_pump[sensor],
                name=sensor,
                mode='lines'
            ))
    
    fig.update_layout(
        title=f"Sensor Trends for Pump {pump_id}",
        xaxis_title="Time",
        yaxis_title="Sensor Values",
        height=400,
        hovermode='x unified'
    )
    
    return fig


def plot_health_gauge(health_index):
    """Plot health gauge"""
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=health_index * 100,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': "Health Index", 'font': {'size': 24}},
        delta={'reference': 90},
        gauge={
            'axis': {'range': [None, 100], 'tickwidth': 1},
            'bar': {'color': "darkblue"},
            'steps': [
                {'range': [0, 30], 'color': "red"},
                {'range': [30, 50], 'color': "orange"},
                {'range': [50, 70], 'color': "yellow"},
                {'range': [70, 90], 'color': "lightgreen"},
                {'range': [90, 100], 'color': "green"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 90
            }
        }
    ))
    
    fig.update_layout(height=300)
    return fig


def plot_efficiency_trends(df, pump_id):
    """Plot efficiency trends"""
    df_pump = df[df['pump_id'] == pump_id].tail(500)
    
    if 'flow_rate' in df_pump.columns and 'power_consumption' in df_pump.columns:
        df_pump['efficiency'] = df_pump['flow_rate'] / (df_pump['power_consumption'] + 1e-6)
        
        fig = px.line(
            df_pump,
            x='timestamp',
            y='efficiency',
            title=f"Efficiency Trend for Pump {pump_id}",
            labels={'efficiency': 'Efficiency (Flow/Power)', 'timestamp': 'Time'}
        )
        
        fig.update_layout(height=300)
        return fig
    
    return None


def plot_vibration_temperature(df, pump_id):
    """Plot vibration vs temperature"""
    df_pump = df[df['pump_id'] == pump_id].tail(500)
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=df_pump['timestamp'],
        y=df_pump['vibration'],
        name='Vibration',
        yaxis='y',
        line=dict(color='red')
    ))
    
    fig.add_trace(go.Scatter(
        x=df_pump['timestamp'],
        y=df_pump['temperature'],
        name='Temperature',
        yaxis='y2',
        line=dict(color='blue')
    ))
    
    fig.update_layout(
        title=f"Vibration & Temperature for Pump {pump_id}",
        xaxis=dict(title='Time'),
        yaxis=dict(title='Vibration', side='left'),
        yaxis2=dict(title='Temperature (°C)', side='right', overlaying='y'),
        height=300,
        hovermode='x unified'
    )
    
    return fig


def main():
    """Main dashboard function"""
    
    # Header
    st.markdown('<p class="main-header">⚙️ Pump Health Monitoring Dashboard</p>', 
                unsafe_allow_html=True)
    
    # Load data
    with st.spinner("Loading data..."):
        df = load_data()
    
    # Sidebar
    st.sidebar.title("🔧 Control Panel")
    
    # Pump selection
    pump_ids = sorted(df['pump_id'].unique())
    selected_pump = st.sidebar.selectbox("Select Pump", pump_ids)
    
    # Get latest data for selected pump
    df_pump = df[df['pump_id'] == selected_pump]
    latest_data = df_pump.iloc[-1]
    
    # Load model and make predictions
    predictor = load_model()
    
    if predictor is not None:
        # Prepare features
        feature_builder = PumpFeatureBuilder()
        df_pump_features = feature_builder.build_all_features(df_pump, SENSOR_COLUMNS)
        
        # Get features for latest data point
        latest_features = df_pump_features.iloc[-1:]
        feature_cols = [col for col in df_pump_features.columns 
                       if col not in [TARGET_COLUMN, 'timestamp', 'pump_id']]
        X_latest = latest_features[feature_cols]
        
        # Make prediction
        rul_pred = predictor.predict(X_latest.values)[0]
        health_index = predictor.predict_health_index(np.array([rul_pred]), max_rul=1000)[0]
    else:
        rul_pred = latest_data['rul']
        health_index = rul_pred / 1000
    
    health_status, status_icon = get_health_status(health_index)
    
    # Main metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="Health Status",
            value=f"{status_icon} {health_status}",
            delta=None
        )
    
    with col2:
        st.metric(
            label="Health Index",
            value=f"{health_index*100:.1f}%",
            delta=None
        )
    
    with col3:
        st.metric(
            label="Estimated RUL",
            value=f"{rul_pred:.0f} hrs",
            delta=None
        )
    
    with col4:
        st.metric(
            label="Current Power",
            value=f"{latest_data['power_consumption']:.1f} kW",
            delta=None
        )
    
    # Health gauge and recommendations
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.plotly_chart(plot_health_gauge(health_index), use_container_width=True)
    
    with col2:
        st.subheader("📋 Maintenance Recommendations")
        recommendation = get_maintenance_recommendation(health_index, rul_pred)
        
        if health_index < HEALTH_THRESHOLDS['fair']:
            st.error(recommendation)
        elif health_index < HEALTH_THRESHOLDS['good']:
            st.warning(recommendation)
        else:
            st.success(recommendation)
        
        st.subheader("📊 Current Sensor Readings")
        sensor_data = {
            "Flow Rate": f"{latest_data['flow_rate']:.2f} L/min",
            "Pressure In": f"{latest_data['pressure_in']:.2f} bar",
            "Pressure Out": f"{latest_data['pressure_out']:.2f} bar",
            "Temperature": f"{latest_data['temperature']:.2f} °C",
            "Vibration": f"{latest_data['vibration']:.3f} mm/s",
            "RPM": f"{latest_data['rpm']:.0f}"
        }
        
        for sensor, value in sensor_data.items():
            st.text(f"{sensor}: {value}")
    
    # Trends section
    st.subheader("📈 Historical Trends")
    
    tab1, tab2, tab3 = st.tabs(["Sensor Trends", "Efficiency", "Vibration & Temperature"])
    
    with tab1:
        st.plotly_chart(plot_sensor_trends(df, selected_pump), use_container_width=True)
    
    with tab2:
        efficiency_fig = plot_efficiency_trends(df, selected_pump)
        if efficiency_fig:
            st.plotly_chart(efficiency_fig, use_container_width=True)
    
    with tab3:
        st.plotly_chart(plot_vibration_temperature(df, selected_pump), use_container_width=True)
    
    # Feature importance (if model is loaded)
    if predictor is not None:
        st.subheader("🎯 Feature Importance")
        feature_importance = predictor.get_feature_importance(top_n=10)
        
        if not feature_importance.empty:
            fig = px.bar(
                feature_importance,
                x='importance',
                y='feature',
                orientation='h',
                title="Top 10 Important Features",
                labels={'importance': 'Importance', 'feature': 'Feature'}
            )
            st.plotly_chart(fig, use_container_width=True)
    
    # Footer
    st.sidebar.markdown("---")
    st.sidebar.info(
        "**About**: This dashboard monitors centrifugal pump health using "
        "machine learning to predict Remaining Useful Life (RUL) and provide "
        "maintenance recommendations."
    )


if __name__ == "__main__":
    main()
