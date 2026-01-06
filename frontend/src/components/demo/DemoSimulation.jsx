import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Calendar, Zap } from 'lucide-react';
import { fetchDemoSimulation, fetchPumpOverview } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDemoContext } from '../../contexts/DemoContext';

const DemoSimulation = ({ pumpId }) => {
  const { updateDemoState, resetDemo } = useDemoContext();
  const [simulationData, setSimulationData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chartData, setChartData] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load simulation data
  useEffect(() => {
    const loadSimulation = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDemoSimulation(pumpId);
        setSimulationData(data);
        setCurrentIndex(0);
        setElapsedTime(0);
        setChartData([]);
      } catch (err) {
        console.error('Failed to load demo simulation:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load simulation');
      } finally {
        setLoading(false);
      }
    };

    if (pumpId) {
      loadSimulation();
    }
  }, [pumpId]);

  // Playback control
  useEffect(() => {
    if (!isPlaying || !simulationData || !simulationData.series) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calculate interval: 5 minutes (300 seconds) divided by number of points
    const totalDuration = simulationData.playback_duration_seconds * 1000; // Convert to ms
    const intervalMs = totalDuration / simulationData.series.length;
    
    // Clamp interval to reasonable range (50ms to 500ms for smooth playback)
    const clampedInterval = Math.max(50, Math.min(500, intervalMs));

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= simulationData.series.length) {
          setIsPlaying(false);
          // Update context when simulation stops
          updateDemoState({
            isActive: false,
            currentTimestamp: null,
            realTimestamp: null,
            progress: 1.0,
          });
          return prev;
        }
        
        // Update demo context with current timestamp
        const currentPoint = simulationData.series[next];
        if (currentPoint) {
          updateDemoState({
            isActive: true,
            currentTimestamp: currentPoint.simulated_timestamp,
            realTimestamp: currentPoint.real_timestamp,
            progress: currentPoint.progress,
          });
        }
        
        return next;
      });

      // Update elapsed time
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedTime(Math.min(elapsed, simulationData.playback_duration_seconds));
    }, clampedInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, simulationData, updateDemoState]);

  // Update chart data as we progress
  useEffect(() => {
    if (!simulationData || !simulationData.series || currentIndex < 0) return;

    const currentPoint = simulationData.series[currentIndex];
    if (!currentPoint) return;

    // Add current point to chart (keep last 100 points for performance)
    setChartData((prev) => {
      const newData = [...prev, {
        index: currentIndex,
        time: elapsedTime,
        flow: currentPoint.flow,
        discharge_pressure: currentPoint.discharge_pressure,
        motor_power: currentPoint.motor_power,
        vibration: currentPoint.vibration,
        bearing_temp: currentPoint.bearing_temp,
      }];
      return newData.slice(-100); // Keep last 100 points
    });
  }, [currentIndex, elapsedTime, simulationData]);

  const handlePlayPause = () => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    
    // Reset start time when starting playback
    if (newPlaying) {
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
    }
    
    // Update context when starting/stopping
    if (newPlaying && simulationData && simulationData.series.length > 0) {
      const currentPoint = simulationData.series[currentIndex];
      if (currentPoint) {
        updateDemoState({
          isActive: true,
          currentTimestamp: currentPoint.simulated_timestamp,
          realTimestamp: currentPoint.real_timestamp,
          progress: currentPoint.progress,
        });
      }
    } else if (!newPlaying) {
      updateDemoState({
        isActive: false,
      });
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setElapsedTime(0);
    setChartData([]);
    startTimeRef.current = null; // Reset start time
    resetDemo(); // Reset demo context
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Update context when current point changes (even when paused)
  useEffect(() => {
    if (simulationData && simulationData.series && simulationData.series[currentIndex]) {
      const currentPoint = simulationData.series[currentIndex];
      if (isPlaying || currentIndex === 0) {
        updateDemoState({
          isActive: isPlaying,
          currentTimestamp: currentPoint.simulated_timestamp,
          realTimestamp: currentPoint.real_timestamp,
          progress: currentPoint.progress,
        });
      }
    }
  }, [currentIndex, simulationData, isPlaying, updateDemoState]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetDemo();
    };
  }, [resetDemo]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--bg-secondary)] rounded w-64"></div>
          <div className="h-32 bg-[var(--bg-secondary)] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-red-500/50 mb-6">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!simulationData || !simulationData.series || simulationData.series.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] mb-6">
        <p className="text-[var(--text-secondary)]">No simulation data available</p>
      </div>
    );
  }

  const currentPoint = simulationData.series[currentIndex];
  const progress = ((currentIndex + 1) / simulationData.series.length) * 100;
  const remainingTime = simulationData.playback_duration_seconds - elapsedTime;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Demo Simulation: 6 Months in 5 Minutes
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Simulating {simulationData.real_data_span_days} days ({simulationData.real_data_span_hours} hours) of operational data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">Speed Multiplier</p>
            <p className="text-lg font-bold text-primary-400">
              {simulationData.speed_multiplier?.toLocaleString()}x
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--bg-secondary)]/50 rounded-lg">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Play</span>
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset</span>
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Elapsed: {formatTime(elapsedTime)} / {formatTime(simulationData.playback_duration_seconds)}
            </span>
            <span>Remaining: {formatTime(Math.max(0, remainingTime))}</span>
          </div>
          <div className="w-full bg-[var(--bg-secondary)] h-3 rounded-full overflow-hidden">
            <div
              className="bg-primary-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Current Data Display */}
      {currentPoint && (
        <>
          {/* Time Information */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[var(--bg-secondary)]/30 rounded-lg">
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Simulated Time
              </p>
              <p className="text-[var(--text-primary)] font-semibold">
                {formatDate(currentPoint.simulated_timestamp)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Original Data Time</p>
              <p className="text-[var(--text-primary)] font-semibold">
                {formatDate(currentPoint.real_timestamp)}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--bg-secondary)]/40 rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] uppercase mb-1">Flow</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{currentPoint.flow?.toFixed(1) || '--'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">m³/h</p>
            </div>
            <div className="bg-[var(--bg-secondary)]/40 rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] uppercase mb-1">Discharge Pressure</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{currentPoint.discharge_pressure?.toFixed(2) || '--'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">bar</p>
            </div>
            <div className="bg-[var(--bg-secondary)]/40 rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] uppercase mb-1">Motor Power</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{currentPoint.motor_power?.toFixed(1) || '--'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">kW</p>
            </div>
            <div className="bg-[var(--bg-secondary)]/40 rounded-lg p-4">
              <p className="text-xs text-[var(--text-secondary)] uppercase mb-1">Efficiency</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{currentPoint.efficiency?.toFixed(1) || '--'}</p>
              <p className="text-xs text-[var(--text-tertiary)]">%</p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6 p-4 bg-[var(--bg-secondary)]/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Status</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] capitalize">{currentPoint.status || 'running'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Vibration</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{currentPoint.vibration?.toFixed(2) || '--'} mm/s</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Bearing Temp</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{currentPoint.bearing_temp?.toFixed(1) || '--'} °C</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Chart */}
          {chartData.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Live Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="var(--text-secondary)"
                    label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, style: { fill: 'var(--text-secondary)' } }}
                  />
                  <YAxis yAxisId="left" stroke="#22c55e" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)`, borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="flow" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                    name="Flow (m³/h)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="discharge_pressure" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    name="Discharge Pressure (bar)"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="motor_power" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                    name="Motor Power (kW)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-color)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div>
            <p>Data Period: {formatDate(simulationData.start_real_time)} → {formatDate(simulationData.end_real_time)}</p>
          </div>
          <div className="text-right">
            <p>Point {currentIndex + 1} of {simulationData.series.length}</p>
            <p>Progress: {progress.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoSimulation;
