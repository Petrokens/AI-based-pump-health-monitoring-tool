import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Wrench,
  Calendar,
  MapPin,
  Package,
  ChevronDown
} from 'lucide-react';
import { fetchPumpOverview } from '../../services/api';

const PumpOverview = ({ pumpId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchPumpOverview(pumpId);
        setData(result);
      } catch (error) {
        console.error('Error loading pump overview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000); // Update every 3 seconds for fast live reading
    return () => clearInterval(interval);
  }, [pumpId]);

  if (loading || !data) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)]">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading overview...</div>
      </div>
    );
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'bg-green-500';
      case 'Warning': return 'bg-yellow-500';
      case 'Standby': return 'bg-blue-500';
      case 'Fault': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] mb-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center">
        <Activity className="w-6 h-6 mr-2 text-primary-500" />
        Pump Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Plant/Site Info */}
        <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MapPin className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <span className="text-sm text-[var(--text-secondary)]">Location</span>
          </div>
          <p className="text-[var(--text-primary)] font-semibold">{data.pump_master?.location || data.location}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{data.plant} - {data.site}</p>
        </div>

        {/* Model */}
        <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Package className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <span className="text-sm text-[var(--text-secondary)]">Model</span>
          </div>
          <p className="text-[var(--text-primary)] font-semibold">{data.model}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Pump ID: {data.pump_id}</p>
        </div>

        {/* Health Score */}
        <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Activity className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <span className="text-sm text-[var(--text-secondary)]">Health Score</span>
          </div>
          <p className={`text-2xl font-bold ${getHealthColor(data.health_score)}`}>
            {data.health_score.toFixed(1)}%
          </p>
        </div>

        {/* Operational Status */}
        <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(data.operational_status)} mr-2`}></div>
            <span className="text-sm text-[var(--text-secondary)]">Status</span>
          </div>
          <p className="text-[var(--text-primary)] font-semibold">{data.operational_status}</p>
        </div>
      </div>

      {/* Pump Master Specs */}
      <div className="bg-[var(--bg-card)]/70 rounded-lg border border-[var(--border-color)] mb-4">
        <button
          type="button"
          onClick={() => toggleSection('specs')}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]"
        >
          <span>Pump Master Data</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform text-[var(--text-secondary)] ${expandedSection === 'specs' ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSection === 'specs' && (
          <div className="border-t border-[var(--border-color)] px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-[var(--text-primary)] mt-3">
              <Spec label="Pump ID" value={data.pump_id} />
              <Spec label="Pump Type" value={data.pump_master?.pump_type} />
              <Spec label="Type Detail" value={data.pump_master?.pump_type_detail} />
              <Spec label="Manufacturer" value={data.pump_master?.manufacturer} />
              <Spec label="Installation Date" value={data.pump_master?.installation_date} />
              <Spec label="Criticality" value={data.pump_master?.criticality_level} />
              <Spec label="Serial #" value={data.pump_master?.serial_number} />
              <Spec label="Warranty Expiry" value={data.pump_master?.warranty_expiry} />
              <Spec label="Last Overhaul" value={data.pump_master?.last_overhaul} />
              <Spec label="Rated Power (kW)" value={data.pump_master?.rated_power_kw} />
              <Spec label="Rated Flow (m³/h)" value={data.pump_master?.rated_flow_m3h} />
              <Spec label="Rated Head (m)" value={data.pump_master?.rated_head_m} />
              <Spec label="Flow Range (m³/h)" value={`${data.pump_master?.flow_range_min_m3h} - ${data.pump_master?.flow_range_max_m3h}`} />
              <Spec label="Head Range (m)" value={`${data.pump_master?.head_range_min_m} - ${data.pump_master?.head_range_max_m}`} />
              <Spec label="Rated RPM" value={data.pump_master?.rated_rpm} />
              <Spec label="Seal Type" value={data.pump_master?.seal_type} />
              <Spec label="Bearing DE/NDE" value={`${data.pump_master?.bearing_type_de} / ${data.pump_master?.bearing_type_nde}`} />
              <Spec label="Impeller Type" value={data.pump_master?.impeller_type} />
              <Spec label="Min/Max Safe Flow (m³/h)" value={`${data.pump_master?.min_safe_flow_m3h} / ${data.pump_master?.max_safe_flow_m3h}`} />
              <Spec label="Max Motor Load (kW)" value={data.pump_master?.max_motor_load_kw} />
              <Spec label="Max Suction Pressure (bar)" value={data.pump_master?.max_suction_pressure_bar} />
              <Spec label="Efficiency @ BEP (%)" value={data.pump_master?.efficiency_bep_percent} />
              <Spec label="NPSHr (m)" value={data.pump_master?.npshr_m} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-card)]/70 rounded-lg border border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => toggleSection('maintenance')}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]"
        >
          <span>Maintenance & Planning</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform text-[var(--text-secondary)] ${expandedSection === 'maintenance' ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSection === 'maintenance' && (
          <div className="border-t border-[var(--border-color)] px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {/* RUL */}
              <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Remaining Useful Life</span>
                  <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{data.rul_hours}h</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">({data.rul_days} days)</p>
              </div>

              {/* Last Maintenance */}
              <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Last Maintenance</span>
                  <Wrench className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                {data.last_maintenance ? (
                  <>
                    <p className="text-[var(--text-primary)] font-semibold">{data.last_maintenance.date}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {data.last_maintenance.action} - {data.last_maintenance.component}
                    </p>
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)] text-sm">No maintenance recorded</p>
                )}
              </div>

              {/* Next Maintenance */}
              <div className="bg-[var(--bg-secondary)]/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Next Planned</span>
                  <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <p className="text-[var(--text-primary)] font-semibold">{data.next_maintenance}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Scheduled maintenance</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PumpOverview;

const Spec = ({ label, value }) => (
  <div className="flex flex-col bg-[var(--bg-secondary)]/40 rounded-md p-3 border border-[var(--border-dark)]">
    <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    <span className="text-sm text-[var(--text-primary)] truncate">{value ?? '—'}</span>
  </div>
);

