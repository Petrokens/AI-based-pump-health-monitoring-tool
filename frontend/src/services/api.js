import axios from 'axios';

// Determine API base URL based on environment
// Production: Use Render API
// Development: Use local proxy or environment variable
// Ensure absolute API URLs include /api path (backend serves all routes under /api/)
const normalizeApiBaseUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('/')) return trimmed || '/api';
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/api')) parsed.pathname = path ? `${path}/api` : '/api';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return trimmed;
  }
};

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.PROD) {
    return normalizeApiBaseUrl(envUrl || 'https://ai-based-pump-health-monitoring-tool.onrender.com');
  }
  return normalizeApiBaseUrl(envUrl || '/api');
};

// Check localStorage for custom API URL (from Settings)
const getCustomApiUrl = () => {
  try {
    const savedSettings = localStorage.getItem('pumpMonitoringSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.api?.baseUrl) {
        return settings.api.baseUrl;
      }
    }
  } catch (e) {
    console.error('Error reading API settings:', e);
  }
  return null;
};

// Get the final API base URL (custom settings override defaults); always normalize so /api is included
const customUrl = getCustomApiUrl();
const API_BASE_URL = (customUrl ? normalizeApiBaseUrl(customUrl) : null) || getApiBaseUrl();

// Log API URL in development or first load
if (import.meta.env.DEV || !sessionStorage.getItem('api_url_logged')) {
  console.log('🔗 API Base URL:', API_BASE_URL);
  sessionStorage.setItem('api_url_logged', 'true');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // Increased to 20s for fast polling with large datasets
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to update API base URL dynamically (for Settings page)
export const updateApiBaseUrl = (newUrl) => {
  api.defaults.baseURL = newUrl ? normalizeApiBaseUrl(newUrl) : api.defaults.baseURL;
};

// Track consecutive errors to reduce spam
let consecutiveErrors = 0;
let lastErrorTime = 0;
const ERROR_LOG_INTERVAL = 5000; // Only log errors every 5 seconds

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Reset error counter on success
    consecutiveErrors = 0;
    return response;
  },
  (error) => {
    consecutiveErrors++;
    const now = Date.now();
    
    // Only log errors if enough time has passed since last log (reduce spam)
    if (now - lastErrorTime > ERROR_LOG_INTERVAL || consecutiveErrors === 1) {
      lastErrorTime = now;
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn('API request timeout - backend may be slow or overloaded');
      } else if (error.code === 'ERR_NETWORK') {
        // Network errors - backend might be sleeping or unreachable
        if (consecutiveErrors === 1) {
          console.warn('Network error: Backend may be sleeping (Render free tier) or unreachable. Retrying...');
        }
      } else if (error.response) {
        const msg = error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data);
        console.error('Response error:', error.response.status, msg);
      } else if (error.request) {
        // Request made but no response
        if (consecutiveErrors === 1) {
          console.warn('No response from server. Backend may be starting up or sleeping.');
        }
      }
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

export const fetchPumpOverview = async (pumpId, at) => {
  const atParam = at ? `?at=${encodeURIComponent(at)}` : '';
  const response = await api.get(`/pump/${pumpId}/overview${atParam}`);
  return response.data;
};

export const fetchVibrationData = async (pumpId, at) => {
  const atParam = at ? `?at=${encodeURIComponent(at)}` : '';
  const response = await api.get(`/pump/${pumpId}/vibration${atParam}`);
  return response.data;
};

export const fetchThermalData = async (pumpId, at) => {
  const atParam = at ? `?at=${encodeURIComponent(at)}` : '';
  const response = await api.get(`/pump/${pumpId}/thermal${atParam}`);
  return response.data;
};

export const fetchElectricalData = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/electrical`);
  return response.data;
};

export const fetchHydraulicData = async (pumpId, at) => {
  const atParam = at ? `?at=${encodeURIComponent(at)}` : '';
  const response = await api.get(`/pump/${pumpId}/hydraulic${atParam}`);
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

export const fetchPumpRuntime = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/runtime`);
  return response.data;
};

export const controlPump = async (pumpId, action) => {
  const response = await api.post(`/pump/${pumpId}/control`, { action });
  return response.data;
};

export const fetchFastForwardData = async (pumpId, speed = 100, windowHours = 6) => {
  const response = await api.get(`/pump/${pumpId}/fast-forward?speed=${speed}&window_hours=${windowHours}`);
  return response.data;
};

export const fetchDemoSimulation = async (pumpId) => {
  const response = await api.get(`/pump/${pumpId}/demo-simulation`);
  return response.data;
};

/** Setup: append one pump to pump_master (JSON body with all pump_master.csv columns). */
export const uploadPumpMaster = async (payload) => {
  const response = await api.post('/setup/pump-master', payload);
  return response.data;
};

/** Setup: append first row from uploaded pump_master CSV/Excel; returns { ok, pump_id, row }. */
export const uploadPumpMasterFile = async (file) => {
  const form = new FormData();
  const fileName = file.name || (file.type === 'text/csv' ? 'pump_master.csv' : 'pump_master.xlsx');
  form.append('file', file, fileName);
  const response = await api.post('/setup/pump-master/upload', form);
  return response.data;
};

/** Setup: replace operation log with uploaded Excel/CSV (form field: file). */
export const uploadOperationLog = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post('/setup/operation-log', form);
  return response.data;
};

/** Setup: replace maintenance log with uploaded Excel/CSV (form field: file). */
export const uploadMaintenanceLog = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post('/setup/maintenance-log', form);
  return response.data;
};



