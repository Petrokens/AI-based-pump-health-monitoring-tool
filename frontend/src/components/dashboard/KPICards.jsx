import React, { useState, useEffect } from 'react';
import { Clock, TrendingDown, Zap, Thermometer, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchPumpKPIs } from '../../services/api';

const KPICards = ({ pumpId }) => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadKPIs();
    const interval = setInterval(loadKPIs, 2000); // Update every 2 seconds for fast live reading
    return () => clearInterval(interval);
  }, [pumpId]);

  const loadKPIs = async () => {
    try {
      setError(null);
      const data = await fetchPumpKPIs(pumpId);
      setKpis(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load KPIs');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-xl p-6 animate-shimmer"></div>
      ))}
    </div>;
  }

  if (error || !kpis) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-red-500/50">
        <p className="text-red-400">Error loading KPIs: {error || 'No data available'}</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Remaining Useful Life',
      value: `${kpis.rul_hours}h`,
      subtitle: `${Math.floor(kpis.rul_hours / 24)} days`,
      icon: Clock,
      color: kpis.rul_hours > 200 ? 'text-green-500' : kpis.rul_hours > 100 ? 'text-yellow-500' : 'text-red-500',
      bgColor: kpis.rul_hours > 200 ? 'bg-green-500/10' : kpis.rul_hours > 100 ? 'bg-yellow-500/10' : 'bg-red-500/10',
    },
    {
      title: 'Efficiency Deviation',
      value: `${kpis.efficiency_deviation.toFixed(1)}%`,
      subtitle: kpis.efficiency_deviation < 0 ? 'Below baseline' : 'Above baseline',
      icon: TrendingDown,
      color: kpis.efficiency_deviation > -5 ? 'text-green-500' : kpis.efficiency_deviation > -10 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-blue-500/10',
      trend: kpis.efficiency_deviation < 0 ? 'down' : 'up',
    },
    {
      title: 'Motor Health Index',
      value: `${kpis.motor_health.toFixed(0)}%`,
      subtitle: 'Overall condition',
      icon: Zap,
      color: kpis.motor_health > 80 ? 'text-green-500' : kpis.motor_health > 60 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Bearing Health Index',
      value: `${kpis.bearing_health.toFixed(0)}%`,
      subtitle: 'Thermal & vibration',
      icon: Thermometer,
      color: kpis.bearing_health > 80 ? 'text-green-500' : kpis.bearing_health > 60 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Health Score',
      value: `${kpis.health_index}%`,
      subtitle: 'AI prediction',
      icon: Zap,
      color: kpis.health_index > 80 ? 'text-green-500' : kpis.health_index > 60 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            {card.trend && (
              <div className={`flex items-center text-sm ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {card.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </div>
            )}
          </div>
          <h3 className="text-slate-400 text-sm mb-2">{card.title}</h3>
          <p className={`text-3xl font-bold ${card.color} mb-1`}>{card.value}</p>
          <p className="text-slate-500 text-xs">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;

