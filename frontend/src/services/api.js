import axios from 'axios';

// Use environment variable for production, fallback to relative path for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      // Server responded with error status
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response (likely backend not running)
      console.error('No response from server. Is the backend running?');
    }
    return Promise.reject(error);
  }
);

export const fetchPumps = async () => {
  const response = await api.get('/pumps');
  return response.data;
};

export const fetchPumpRealtime = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/realtime`);
  return response.data;
};

export const fetchPumpKPIs = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/kpis`);
  return response.data;
};

export const fetchPumpTrends = async (pumpId, hours = 24) => {
  const response = await api.get(`/pump/${pumpId}/trends?hours=${hours}`);
  return response.data;
};

export const fetchPumpAnomalies = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/anomalies`);
  return response.data;
};

export const fetchPerformanceCurve = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/performance-curve`);
  return response.data;
};

export const fetchDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

export const fetchPumpOverview = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/overview`);
  return response.data;
};

export const fetchVibrationData = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/vibration`);
  return response.data;
};

export const fetchThermalData = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/thermal`);
  return response.data;
};

export const fetchElectricalData = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/electrical`);
  return response.data;
};

export const fetchHydraulicData = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/hydraulic`);
  return response.data;
};

export const fetchMaintenanceMetrics = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/maintenance-metrics`);
  return response.data;
};

export const fetchMLOutputs = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/ml-outputs`);
  return response.data;
};

export const fetchRootCause = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/root-cause`);
  return response.data;
};

export const fetchAlerts = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/alerts`);
  return response.data;
};

export const fetchReports = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/reports`);
  return response.data;
};

export const fetchTrendSignals = async (pumpId, signals = [], hours = 24) => {
  const signalsParam = signals.length > 0 ? signals.join(',') : '';
  const response = await api.get(`/pump/${pumpId}/trend-signals?signals=${signalsParam}&hours=${hours}`);
  return response.data;
};

