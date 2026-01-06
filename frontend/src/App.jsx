import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/Sidebar';
import AIInsights from './components/AIInsights';
import TrendExplorer from './components/TrendExplorer';
import PumpOverview from './components/dashboard/PumpOverview';
import SealFailureForecast from './components/dashboard/SealFailureForecast';
import BearingFailureForecast from './components/dashboard/BearingFailureForecast';
import MLOutputs from './components/MLOutputs';
import RootCausePanel from './components/RootCausePanel';
import AlertsWorkflow from './components/AlertsWorkflow';
import ReportsKPIs from './components/ReportsKPIs';
import Settings from './components/Settings';
import CavitationPrediction from './components/monitoring/CavitationPrediction';
import VibrationAnomalyDetection from './components/monitoring/VibrationAnomalyDetection';
import MotorOverloadingPrediction from './components/monitoring/MotorOverloadingPrediction';
import PerformanceDegradation from './components/monitoring/PerformanceDegradation';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import DemoSimulation from './components/demo/DemoSimulation';
import { DemoProvider } from './contexts/DemoContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchPumps } from './services/api';

function App() {
  const [selectedPump, setSelectedPump] = useState('P-101A');
  const [pumps, setPumps] = useState([]);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    let pollingInterval = 10000; // Start with 10 seconds (reduce spam)
    let intervalId = null;
    let consecutiveFailures = 0;
    
    // Initial load with exponential backoff retry logic
    const attemptLoad = async (retries = 5) => {
      let retryDelay = 2000;
      for (let i = 0; i < retries; i++) {
        try {
          await loadPumps();
          consecutiveFailures = 0;
          pollingInterval = 10000; // Reset to 10s on success
          break; // Success, exit retry loop
        } catch (error) {
          consecutiveFailures++;
          if (i === retries - 1) {
            // Last attempt failed
            console.warn('Failed to connect after', retries, 'attempts. Backend may be sleeping.');
            pollingInterval = 30000; // Increase delay on persistent failure
          } else {
            // Exponential backoff: 2s, 4s, 8s, 16s
            retryDelay = Math.min(16000, retryDelay * 2);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
    };
    
    attemptLoad();
    
    // Adaptive polling: slower when errors occur, faster when successful
    const scheduleNextPoll = () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
      intervalId = setTimeout(async () => {
        try {
          await loadPumps();
          consecutiveFailures = 0;
          pollingInterval = 10000; // Reset to 10s on success
          setLastUpdate(new Date());
        } catch (error) {
          consecutiveFailures++;
          // On error, increase polling interval to reduce spam
          pollingInterval = Math.min(30000, 10000 + (consecutiveFailures * 5000));
        }
        scheduleNextPoll();
      }, pollingInterval);
    };
    
    // Start polling after initial load
    scheduleNextPoll();

    return () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, []);

  const loadPumps = async () => {
    try {
      setError(null);
      const data = await fetchPumps();
      if (data && data.length > 0) {
        setPumps(data);
        setSelectedPump(prevSelected => {
          if (prevSelected && data.find(p => p.id === prevSelected)) {
            return prevSelected;
          }
          return data[0].id;
        });
        setLoading(false);
      } else {
        setError('No pump data available');
        setLoading(false);
      }
    } catch (error) {
      // Only log first error to reduce spam
      if (!error._logged) {
        error._logged = true;
        console.error('Error loading pumps:', error);
      }
      
      let errorMessage = 'Failed to connect to backend.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Backend request timed out. The server may be processing large datasets.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend. The server may be sleeping (Render free tier takes ~30s to wake up) or unreachable. Please wait and refresh.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  const currentPump = pumps.find(p => p.id === selectedPump);

  return (
    <ThemeProvider>
      <DemoProvider>
        <div className="flex h-screen bg-[var(--bg-primary)]">
          <Sidebar 
            selectedView={selectedView}
            onViewChange={setSelectedView}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              selectedPump={selectedPump}
              onPumpChange={setSelectedPump}
              pumps={pumps}
              lastUpdate={lastUpdate}
              currentPumpStatus={currentPump?.status}
            />
            
            <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-[var(--text-secondary)]">Loading pump data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 max-w-md">
                <h3 className="text-red-500 font-bold text-lg mb-2">Connection Error</h3>
                <p className="text-[var(--text-secondary)] mb-4">{error}</p>
                <button
                  onClick={loadPumps}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : pumps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6 max-w-md">
                <h3 className="text-yellow-500 font-bold text-lg mb-2">No Data Available</h3>
                <p className="text-[var(--text-secondary)]">No pump data found. Please check the backend server.</p>
              </div>
            </div>
          ) : (
            <>
              {selectedView === 'dashboard' && (
                <>
                  <PumpOverview pumpId={selectedPump} />
                  <SectionToggle title="📊 Demo Simulation: 6 Months in 5 Minutes" subtitle="Time-lapse playback of 6 months operational data" defaultOpen={true}>
                    <DemoSimulation pumpId={selectedPump} />
                  </SectionToggle>
                  <SectionToggle title="A. Seal Health" subtitle="Seal failure forecast & risk">
                    <SealFailureForecast pumpId={selectedPump} />
                  </SectionToggle>
                  <SectionToggle title="B. Bearing Failure Forecast" subtitle="Health, RUL, and actions">
                    <BearingFailureForecast pumpId={selectedPump} />
                  </SectionToggle>
                  <SectionToggle title="C. Cavitation Prediction" subtitle="NPSH vs cavitation risk">
                    <CavitationPrediction pumpId={selectedPump} />
                  </SectionToggle>
                  <SectionToggle title="D. Vibration Anomaly Detection" subtitle="FFT + fault identification">
                    <VibrationAnomalyDetection pumpId={selectedPump} />
                  </SectionToggle>
                  <SectionToggle title="E. Motor Overloading Prediction" subtitle="Motor draw vs hydraulic load">
                    <MotorOverloadingPrediction pumpId={selectedPump} />
                  </SectionToggle>
                  <SectionToggle title="F. Performance Degradation" subtitle="Curve deviation, efficiency drop">
                    <PerformanceDegradation pumpId={selectedPump} />
                  </SectionToggle>
                </>
              )}
              
              {selectedView === 'insights' && (
                <>
                  <MLOutputs pumpId={selectedPump} />
                  <RootCausePanel pumpId={selectedPump} />
                  <AIInsights pumpId={selectedPump} expanded={true} />
                </>
              )}
              
              {selectedView === 'trends' && (
                <TrendExplorer pumpId={selectedPump} expanded={true} />
              )}

              {selectedView === 'analytics' && (
                <AnalyticsDashboard pumpId={selectedPump} />
              )}

              {selectedView === 'alerts' && (
                <AlertsWorkflow pumpId={selectedPump} />
              )}

              {selectedView === 'reports' && (
                <ReportsKPIs pumpId={selectedPump} />
              )}

              {selectedView === 'settings' && (
                <Settings />
              )}
            </>
          )}
        </main>
      </div>
    </div>
      </DemoProvider>
    </ThemeProvider>
  );
}

export default App;

const SectionToggle = ({ title, subtitle, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl mb-4 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />}
      </button>
      {open && <div className="px-2 pb-3"><div className="rounded-xl overflow-hidden">{children}</div></div>}
    </div>
  );
};

