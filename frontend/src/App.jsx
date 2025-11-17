import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/Sidebar';
import KPICards from './components/dashboard/KPICards';
import RealTimeParameters from './components/monitoring/RealTimeParameters';
import PerformanceChart from './components/analytics/PerformanceChart';
import AIInsights from './components/AIInsights';
import TrendExplorer from './components/TrendExplorer';
import PumpOverview from './components/PumpOverview';
import RealtimeOperatingPanel from './components/RealtimeOperatingPanel';
import VibrationMechanical from './components/VibrationMechanical';
import ThermalDiagnostics from './components/ThermalDiagnostics';
import ElectricalHealth from './components/ElectricalHealth';
import HydraulicAlarms from './components/HydraulicAlarms';
import MaintenanceHistory from './components/MaintenanceHistory';
import MLOutputs from './components/MLOutputs';
import RootCausePanel from './components/RootCausePanel';
import AlertsWorkflow from './components/AlertsWorkflow';
import ReportsKPIs from './components/ReportsKPIs';
import PumpSystemComponents from './components/PumpSystemComponents';
import Settings from './components/Settings';
import { fetchPumps } from './services/api';

function App() {
  const [selectedPump, setSelectedPump] = useState('P-101A');
  const [pumps, setPumps] = useState([]);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadPumps();
    const interval = setInterval(() => {
      loadPumps();
      setLastUpdate(new Date());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
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
      } else {
        setError('No pump data available');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading pumps:', error);
      setError(error.response?.data?.error || error.message || 'Failed to connect to backend. Please check your backend server configuration.');
      setLoading(false);
    }
  };

  const currentPump = pumps.find(p => p.id === selectedPump);

  return (
    <div className="flex h-screen bg-slate-900">
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
        
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-slate-400">Loading pump data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 max-w-md">
                <h3 className="text-red-500 font-bold text-lg mb-2">Connection Error</h3>
                <p className="text-slate-300 mb-4">{error}</p>
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
                <p className="text-slate-300">No pump data found. Please check the backend server.</p>
              </div>
            </div>
          ) : (
            <>
              {selectedView === 'dashboard' && (
                <>
                  <PumpOverview pumpId={selectedPump} />
                  <RealtimeOperatingPanel pumpId={selectedPump} />
                  <VibrationMechanical pumpId={selectedPump} />
                  <ThermalDiagnostics pumpId={selectedPump} />
                  <HydraulicAlarms pumpId={selectedPump} />
                  <ElectricalHealth pumpId={selectedPump} />
                  <MLOutputs pumpId={selectedPump} />
                  <RootCausePanel pumpId={selectedPump} />
                  <MaintenanceHistory pumpId={selectedPump} />
                  <KPICards pumpId={selectedPump} />
                  <PerformanceChart pumpId={selectedPump} />
                  <AIInsights pumpId={selectedPump} />
                  <TrendExplorer pumpId={selectedPump} />
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

              {selectedView === 'alerts' && (
                <AlertsWorkflow pumpId={selectedPump} />
              )}

              {selectedView === 'reports' && (
                <ReportsKPIs pumpId={selectedPump} />
              )}

              {selectedView === 'components' && (
                <PumpSystemComponents />
              )}

              {selectedView === 'settings' && (
                <Settings />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

