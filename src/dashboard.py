import streamlit as st
import pandas as pd
import numpy as np
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

st.set_page_config(page_title="Pump Health Monitoring", layout='wide')
st.title("AI based Pump Health Monitoring Dashboard")

# Define data paths
data_dir = Path(__file__).parent.parent / "data" / "processed"
features_file = data_dir / "features.csv"
models_dir = data_dir / "models"

# Check if processed data exists
if not features_file.exists():
    st.error("No processed data found. Please run the pipeline first:")
    st.code("python src/run_pipeline.py --stage all")
    st.stop()

# Load data
@st.cache_data
def load_pump_data():
    df = pd.read_csv(features_file)
    # Create timestamp column if it doesn't exist
    if 'timestamp' not in df.columns:
        # Create synthetic timestamps for demonstration
        base_time = datetime(2024, 9, 1, 8, 0)
        df['timestamp'] = [base_time + timedelta(hours=i*5) for i in range(len(df))]
    else:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    return df

# Load pump data
try:
    op_df = load_pump_data()
    
    # Calculate health metrics
    def calculate_health_metrics(df):
        # Health Index (0-100, where 100 is perfect health)
        df['health_index'] = np.clip(100 + (df['delta_eff'] * 100), 0, 100)
        
        # Predicted RUL (Remaining Useful Life) - simplified calculation
        degradation_rate = abs(df['delta_eff']) * 365  # annualized degradation
        df['rul_pred'] = np.where(degradation_rate > 0, 
                                 np.clip(0.1 / (degradation_rate + 1e-6), 30, 365), 
                                 365)
        
        # Will fail in 30 days prediction
        df['will_fail_30d'] = (df['rul_pred'] < 30) | (df['health_index'] < 70)
        
        return df
    
    op_df = calculate_health_metrics(op_df)
    
    # Sidebar - Pump Selection
    st.sidebar.header("Pump Selection")
    available_pumps = sorted(op_df['pump_id'].unique())
    selected_pump = st.sidebar.selectbox("Select Pump ID", available_pumps)
    
    # Filter data for selected pump
    pump_data = op_df[op_df['pump_id'] == selected_pump].sort_values('timestamp')
    
    if pump_data.empty:
        st.error(f"No data available for pump {selected_pump}")
        st.stop()
    
    # Main dashboard layout
    col1, col2, col3, col4 = st.columns(4)
    
    # Key metrics
    latest_record = pump_data.iloc[-1]
    
    with col1:
        health_index = int(latest_record['health_index'])
        color = "normal" if health_index > 80 else ("warning" if health_index > 60 else "error")
        st.metric(
            label="🏥 Health Index", 
            value=f"{health_index}%",
            delta=f"{health_index-100}%" if health_index < 100 else None
        )
    
    with col2:
        rul_days = int(latest_record['rul_pred'])
        st.metric(
            label="⏱️ Predicted RUL", 
            value=f"{rul_days} days",
            delta=f"{rul_days-365} days" if rul_days < 365 else None
        )
    
    with col3:
        efficiency_delta = latest_record['delta_eff'] * 100
        st.metric(
            label="⚡ Efficiency Δ", 
            value=f"{efficiency_delta:.1f}%",
            delta=f"{efficiency_delta:.1f}%"
        )
    
    with col4:
        power_increase = latest_record['power_increase_pct'] * 100
        st.metric(
            label="🔌 Power Increase", 
            value=f"{power_increase:.1f}%",
            delta=f"{power_increase:.1f}%"
        )
    
    # Maintenance Recommendation
    st.subheader("Maintenance Recommendation")
    if latest_record['will_fail_30d'] or latest_record['health_index'] < 70:
        st.error("⚠️ **URGENT**: Schedule maintenance within 7 days!")
        st.write("**Indicators:**")
        if latest_record['health_index'] < 70:
            st.write("- Health index below 70%")
        if latest_record['delta_eff'] < -0.05:
            st.write("- Significant efficiency degradation detected")
        if latest_record['power_increase_pct'] > 0.1:
            st.write("- Power consumption increased significantly")
    elif latest_record['health_index'] < 85:
        st.warning("⚠️ Monitor closely - schedule maintenance within 30 days")
    else:
        st.success("✅ Pump operating normally - no immediate action required")
    
    # Time series charts
    st.subheader("Performance Trends")
    
    # Prepare data for plotting
    chart_data = pump_data.set_index('timestamp')
    
    # Create two columns for charts
    chart_col1, chart_col2 = st.columns(2)
    
    with chart_col1:
        st.write("**Flow Rate & Power Consumption**")
        fig1 = go.Figure()
        fig1.add_trace(go.Scatter(
            x=chart_data.index, 
            y=chart_data['flow_m3h'],
            name='Flow Rate (m³/h)',
            line=dict(color='blue')
        ))
        fig1.add_trace(go.Scatter(
            x=chart_data.index, 
            y=chart_data['motor_power_kw'],
            name='Motor Power (kW)',
            yaxis='y2',
            line=dict(color='red')
        ))
        fig1.update_layout(
            yaxis=dict(title="Flow Rate (m³/h)", side="left"),
            yaxis2=dict(title="Motor Power (kW)", side="right", overlaying="y"),
            height=400
        )
        st.plotly_chart(fig1, width='stretch')
    
    with chart_col2:
        st.write("**Efficiency Degradation & Health Index**")
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(
            x=chart_data.index, 
            y=chart_data['delta_eff'] * 100,
            name='Efficiency Δ (%)',
            line=dict(color='green')
        ))
        fig2.add_trace(go.Scatter(
            x=chart_data.index, 
            y=chart_data['health_index'],
            name='Health Index (%)',
            yaxis='y2',
            line=dict(color='purple')
        ))
        fig2.update_layout(
            yaxis=dict(title="Efficiency Δ (%)", side="left"),
            yaxis2=dict(title="Health Index (%)", side="right", overlaying="y"),
            height=400
        )
        st.plotly_chart(fig2, width='stretch')
    
    # Detailed data table
    st.subheader("Detailed Data")
    display_columns = [
        'timestamp', 'pump_id', 'flow_m3h', 'motor_power_kw', 
        'delta_eff', 'power_increase_pct', 'health_index', 'rul_pred', 'will_fail_30d'
    ]
    
    # Format the dataframe for display
    display_df = pump_data[display_columns].copy()
    display_df['delta_eff'] = (display_df['delta_eff'] * 100).round(2)
    display_df['power_increase_pct'] = (display_df['power_increase_pct'] * 100).round(2)
    display_df['health_index'] = display_df['health_index'].round(1)
    display_df['rul_pred'] = display_df['rul_pred'].round(0)
    
    # Rename columns for display
    display_df.columns = [
        'Timestamp', 'Pump ID', 'Flow (m³/h)', 'Power (kW)', 
        'Efficiency Δ (%)', 'Power Increase (%)', 'Health Index (%)', 'RUL (days)', 'Needs Maintenance'
    ]
    
    st.dataframe(display_df, width='stretch')
    
    # Model information
    if models_dir.exists():
        st.subheader("Model Information")
        col_model1, col_model2 = st.columns(2)
        
        with col_model1:
            st.info("**Efficiency Degradation Model**: XGBoost Regressor trained on pump operational data")
            
        with col_model2:
            st.info("**Maintenance Need Classifier**: XGBoost Classifier for predicting maintenance requirements")

except Exception as e:
    st.error(f"Error loading data: {e}")
    st.write("Please ensure the pipeline has been run successfully:")
    st.code("python src/run_pipeline.py --stage all")

# Footer
st.markdown("---")
st.markdown("*AI-based Pump Health Monitoring Tool - Powered by Machine Learning*")

def main():
    """Main function for running the dashboard"""
    pass

if __name__ == "__main__":
    main()
