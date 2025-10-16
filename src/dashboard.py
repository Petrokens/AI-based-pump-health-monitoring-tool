"""
Streamlit Dashboard for Pump Health Monitoring
Visualizes pump health, efficiency trends, and maintenance recommendations
"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from data_ingestion import PumpDataIngestion
from feature_engineering import PumpFeatureEngineering
from rul_prediction import RULPredictor


# Page configuration
st.set_page_config(
    page_title="Pump Health Monitoring Dashboard",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded"
)


@st.cache_data
def load_data():
    """Load and process pump sensor data"""
    try:
        ingestion = PumpDataIngestion()
        df = ingestion.load_sensor_data("pump_sensor_data.csv")
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return None


@st.cache_data
def engineer_features(df):
    """Apply feature engineering"""
    fe = PumpFeatureEngineering()
    df_features = fe.engineer_all_features(df)
    return df_features, fe


@st.cache_resource
def load_predictor():
    """Load trained RUL predictor"""
    try:
        predictor = RULPredictor()
        predictor.load_models()
        return predictor
    except Exception as e:
        st.warning(f"Models not found. Please train models first: {e}")
        return None


def plot_health_index(df):
    """Plot pump health index over time"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['health_index'],
        mode='lines',
        name='Health Index',
        line=dict(color='blue', width=2),
        fill='tozeroy',
        fillcolor='rgba(0, 100, 255, 0.1)'
    ))
    
    # Add threshold lines
    fig.add_hline(y=70, line_dash="dash", line_color="orange", 
                  annotation_text="Warning Threshold")
    fig.add_hline(y=50, line_dash="dash", line_color="red", 
                  annotation_text="Critical Threshold")
    
    fig.update_layout(
        title="Pump Health Index Over Time",
        xaxis_title="Timestamp",
        yaxis_title="Health Index (0-100)",
        hovermode='x unified',
        height=400
    )
    
    return fig


def plot_sensor_trends(df, sensor_cols):
    """Plot sensor data trends"""
    fig = go.Figure()
    
    for col in sensor_cols:
        if col in df.columns:
            fig.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df[col],
                mode='lines',
                name=col.replace('_', ' ').title()
            ))
    
    fig.update_layout(
        title="Sensor Readings Over Time",
        xaxis_title="Timestamp",
        yaxis_title="Value",
        hovermode='x unified',
        height=400
    )
    
    return fig


def plot_efficiency_trend(df):
    """Plot pump efficiency trend"""
    if 'efficiency_indicator' not in df.columns:
        return None
    
    fig = go.Figure()
    
    # Efficiency over time
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['efficiency_indicator'],
        mode='lines',
        name='Efficiency Indicator',
        line=dict(color='green', width=2)
    ))
    
    # Rolling average
    df['efficiency_ma'] = df['efficiency_indicator'].rolling(window=168, min_periods=1).mean()
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['efficiency_ma'],
        mode='lines',
        name='Weekly Average',
        line=dict(color='darkgreen', width=2, dash='dash')
    ))
    
    fig.update_layout(
        title="Pump Efficiency Trend",
        xaxis_title="Timestamp",
        yaxis_title="Efficiency Indicator (Flow/Current)",
        hovermode='x unified',
        height=400
    )
    
    return fig


def plot_rul_prediction(df, predictions):
    """Plot RUL predictions"""
    fig = go.Figure()
    
    # Actual RUL
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['rul'],
        mode='lines',
        name='Actual RUL',
        line=dict(color='blue', width=2)
    ))
    
    # Predicted RUL
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=predictions,
        mode='lines',
        name='Predicted RUL',
        line=dict(color='red', width=2, dash='dash')
    ))
    
    fig.update_layout(
        title="Remaining Useful Life (RUL) Prediction",
        xaxis_title="Timestamp",
        yaxis_title="RUL (Days)",
        hovermode='x unified',
        height=400
    )
    
    return fig


def plot_sensor_correlation(df):
    """Plot correlation heatmap of sensor data"""
    sensor_cols = ['vibration', 'temperature', 'pressure', 'flow_rate', 'current', 'rpm']
    sensor_cols = [col for col in sensor_cols if col in df.columns]
    
    if not sensor_cols:
        return None
    
    corr_matrix = df[sensor_cols].corr()
    
    fig = go.Figure(data=go.Heatmap(
        z=corr_matrix.values,
        x=corr_matrix.columns,
        y=corr_matrix.columns,
        colorscale='RdBu',
        zmid=0,
        text=corr_matrix.values.round(2),
        texttemplate='%{text}',
        textfont={"size": 10},
        colorbar=dict(title="Correlation")
    ))
    
    fig.update_layout(
        title="Sensor Correlation Matrix",
        height=500
    )
    
    return fig


def get_maintenance_recommendations(current_health, rul, vibration, temperature):
    """Generate maintenance recommendations based on current status"""
    recommendations = []
    
    # Health-based recommendations
    if current_health < 50:
        recommendations.append({
            'priority': 'CRITICAL',
            'action': 'Immediate Inspection Required',
            'details': 'Health index is critically low. Schedule immediate maintenance.',
            'color': 'red'
        })
    elif current_health < 70:
        recommendations.append({
            'priority': 'WARNING',
            'action': 'Schedule Preventive Maintenance',
            'details': 'Health index is declining. Plan maintenance within 1-2 weeks.',
            'color': 'orange'
        })
    
    # RUL-based recommendations
    if rul < 30:
        recommendations.append({
            'priority': 'CRITICAL',
            'action': 'Plan Component Replacement',
            'details': f'Only {rul:.0f} days of useful life remaining. Order replacement parts.',
            'color': 'red'
        })
    elif rul < 90:
        recommendations.append({
            'priority': 'WARNING',
            'action': 'Increase Monitoring Frequency',
            'details': f'RUL is {rul:.0f} days. Monitor critical parameters daily.',
            'color': 'orange'
        })
    
    # Vibration-based recommendations
    if vibration > 1.5:
        recommendations.append({
            'priority': 'WARNING',
            'action': 'Check Bearing Alignment',
            'details': f'High vibration detected ({vibration:.2f}). Inspect bearings and alignment.',
            'color': 'orange'
        })
    
    # Temperature-based recommendations
    if temperature > 80:
        recommendations.append({
            'priority': 'WARNING',
            'action': 'Check Cooling System',
            'details': f'Elevated temperature ({temperature:.1f}°C). Verify cooling system operation.',
            'color': 'orange'
        })
    
    # If everything is good
    if not recommendations:
        recommendations.append({
            'priority': 'GOOD',
            'action': 'Continue Normal Operations',
            'details': 'All parameters within normal range. Continue routine monitoring.',
            'color': 'green'
        })
    
    return recommendations


def main():
    """Main dashboard application"""
    
    # Header
    st.title("⚙️ Pump Health Monitoring Dashboard")
    st.markdown("Digital Twin for Centrifugal Pump Predictive Maintenance")
    
    # Sidebar
    st.sidebar.header("Dashboard Controls")
    
    # Load data
    with st.spinner("Loading data..."):
        df = load_data()
    
    if df is None:
        st.error("Failed to load data. Please ensure pump_sensor_data.csv exists in data/raw/")
        return
    
    # Engineer features
    with st.spinner("Engineering features..."):
        df_features, fe = engineer_features(df)
    
    # Load predictor
    predictor = load_predictor()
    
    # Date range selector
    st.sidebar.subheader("Time Range")
    min_date = df['timestamp'].min().date()
    max_date = df['timestamp'].max().date()
    
    date_range = st.sidebar.date_input(
        "Select Date Range",
        value=(max_date - pd.Timedelta(days=30), max_date),
        min_value=min_date,
        max_value=max_date
    )
    
    # Filter data by date range
    if len(date_range) == 2:
        start_date, end_date = date_range
        mask = (df['timestamp'].dt.date >= start_date) & (df['timestamp'].dt.date <= end_date)
        df_filtered = df[mask].copy()
        df_features_filtered = df_features[mask].copy()
    else:
        df_filtered = df.copy()
        df_features_filtered = df_features.copy()
    
    # Get latest values
    latest = df_filtered.iloc[-1]
    current_health = latest.get('health_index', 0)
    current_rul = latest.get('rul', 0)
    current_vibration = latest.get('vibration', 0)
    current_temperature = latest.get('temperature', 0)
    current_pressure = latest.get('pressure', 0)
    current_flow = latest.get('flow_rate', 0)
    
    # KPI Metrics
    st.header("📊 Key Performance Indicators")
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        health_color = "🟢" if current_health >= 70 else "🟡" if current_health >= 50 else "🔴"
        st.metric("Health Index", f"{current_health:.1f}/100", delta=None)
        st.markdown(f"Status: {health_color}")
    
    with col2:
        rul_color = "🟢" if current_rul >= 90 else "🟡" if current_rul >= 30 else "🔴"
        st.metric("RUL", f"{current_rul:.0f} days", delta=None)
        st.markdown(f"Status: {rul_color}")
    
    with col3:
        st.metric("Vibration", f"{current_vibration:.2f} mm/s", delta=None)
    
    with col4:
        st.metric("Temperature", f"{current_temperature:.1f} °C", delta=None)
    
    with col5:
        st.metric("Pressure", f"{current_pressure:.1f} bar", delta=None)
    
    # Health Index Plot
    st.header("🏥 Health Monitoring")
    fig_health = plot_health_index(df_filtered)
    st.plotly_chart(fig_health, use_container_width=True)
    
    # Sensor Trends
    st.header("📈 Sensor Trends")
    
    col1, col2 = st.columns(2)
    
    with col1:
        sensor_cols = st.multiselect(
            "Select Sensors to Display",
            ['vibration', 'temperature', 'pressure', 'flow_rate', 'current', 'rpm'],
            default=['vibration', 'temperature', 'pressure']
        )
    
    if sensor_cols:
        fig_sensors = plot_sensor_trends(df_filtered, sensor_cols)
        st.plotly_chart(fig_sensors, use_container_width=True)
    
    # Efficiency Trend
    st.header("⚡ Efficiency Analysis")
    fig_efficiency = plot_efficiency_trend(df_features_filtered)
    if fig_efficiency:
        st.plotly_chart(fig_efficiency, use_container_width=True)
    
    # RUL Prediction
    if predictor:
        st.header("🔮 RUL Prediction")
        with st.spinner("Generating predictions..."):
            try:
                predictions = predictor.predict(df_features_filtered)
                df_features_filtered['predicted_rul'] = predictions
                
                fig_rul = plot_rul_prediction(df_filtered, predictions)
                st.plotly_chart(fig_rul, use_container_width=True)
                
                # Model performance
                if 'rul' in df_filtered.columns:
                    actual_rul = df_filtered['rul'].values
                    mae = np.mean(np.abs(actual_rul - predictions))
                    rmse = np.sqrt(np.mean((actual_rul - predictions) ** 2))
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("MAE", f"{mae:.2f} days")
                    with col2:
                        st.metric("RMSE", f"{rmse:.2f} days")
            except Exception as e:
                st.error(f"Error generating predictions: {e}")
    
    # Correlation Analysis
    st.header("🔗 Sensor Correlation Analysis")
    fig_corr = plot_sensor_correlation(df_filtered)
    if fig_corr:
        st.plotly_chart(fig_corr, use_container_width=True)
    
    # Maintenance Recommendations
    st.header("🔧 Maintenance Recommendations")
    recommendations = get_maintenance_recommendations(
        current_health, current_rul, current_vibration, current_temperature
    )
    
    for rec in recommendations:
        if rec['color'] == 'red':
            st.error(f"**{rec['priority']}**: {rec['action']}")
        elif rec['color'] == 'orange':
            st.warning(f"**{rec['priority']}**: {rec['action']}")
        else:
            st.success(f"**{rec['priority']}**: {rec['action']}")
        st.write(rec['details'])
    
    # Data Table
    with st.expander("📋 View Raw Data"):
        st.dataframe(df_filtered[['timestamp', 'vibration', 'temperature', 'pressure', 
                                   'flow_rate', 'current', 'rpm', 'rul', 'health_status']].tail(100))
    
    # Footer
    st.sidebar.markdown("---")
    st.sidebar.info(
        "**About**: This dashboard provides real-time monitoring and predictive maintenance "
        "for centrifugal pumps using machine learning models."
    )


if __name__ == "__main__":
    main()
