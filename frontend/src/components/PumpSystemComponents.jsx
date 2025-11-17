import React, { useState } from 'react';
import { 
  Zap, 
  Link, 
  Settings, 
  Shield, 
  Droplets, 
  Box, 
  Gauge, 
  FlaskConical, 
  Cpu, 
  Cloud,
  ChevronDown,
  ChevronRight,
  Activity,
  Thermometer,
  AlertTriangle
} from 'lucide-react';

const PumpSystemComponents = () => {
  const [expandedSections, setExpandedSections] = useState(new Set([0])); // First section expanded by default

  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const components = [
    {
      id: 1,
      name: 'Electric Motor',
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500',
      what: [
        'Current',
        'Voltage',
        'Power',
        'Power factor',
        'Winding temperature',
        'Vibration at motor bearing',
        'Insulation resistance (if available)'
      ],
      why: 'Detect electrical faults (stator/rotor), overheating, bearing failures.',
      sensors: [
        'Current transformer / power meter',
        'RTD/thermocouple',
        'Accelerometer on motor bearing',
        'Insulation monitor'
      ]
    },
    {
      id: 2,
      name: 'Coupling / Shaft',
      icon: Link,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      what: [
        'Shaft vibration',
        'Axial & radial displacement (if possible)',
        'Torsional vibration / shock events',
        'Alignment drift'
      ],
      why: 'Misalignment, coupling wear, shaft cracks → catastrophic failures.',
      sensors: [
        'Accelerometer(s)',
        'Proximity probes (eddy current)',
        'Torque sensor or strain gauge (if available)'
      ]
    },
    {
      id: 3,
      name: 'Bearings',
      icon: Settings,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500',
      what: [
        'High-frequency vibration (envelope)',
        'Temperature',
        'Lubricant condition (contamination/water)',
        'Acoustic emissions'
      ],
      why: 'Bearings are the most common failure point.',
      sensors: [
        'Accelerometers (high-sensitivity)',
        'RTD/thermistor near bearing',
        'Oil debris sensor / particle counter',
        'Acoustic sensor'
      ]
    },
    {
      id: 4,
      name: 'Mechanical Seals',
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500',
      what: [
        'Seal face temperature',
        'Leakage detection (pressure drop, flow bypass)',
        'Vibration changes'
      ],
      why: 'Seal leakage leads to product loss and potential shaft damage.',
      sensors: [
        'Pressure transmitters',
        'Liquid level or flow sensors around seal flush',
        'Temperature sensors',
        'Moisture detectors'
      ]
    },
    {
      id: 5,
      name: 'Impeller / Hydraulic Stages',
      icon: Droplets,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500',
      what: [
        'Flow',
        'Differential pressure',
        'Suction & discharge pressure',
        'Cavitation signatures (vibration + pressure fluctuations)',
        'Specific speed anomalies'
      ],
      why: 'Erosion, clogging, cavitation reduce performance and cause vibration.',
      sensors: [
        'Flowmeter (magnetic/ultrasonic)',
        'Pressure transducers',
        'High-frequency pressure sensor for cavitation pulses'
      ]
    },
    {
      id: 6,
      name: 'Casing & Piping',
      icon: Box,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      subtitle: '(upstream & downstream)',
      what: [
        'Pressure spikes',
        'Pipe vibration',
        'Leak detection',
        'Thermal expansion'
      ],
      why: 'Pipe stress, water hammer, cavitation propagation.',
      sensors: [
        'Pressure transducers',
        'Strain gauges (for critical piping)',
        'Acoustic leak detectors'
      ]
    },
    {
      id: 7,
      name: 'Valves & Accessories',
      icon: Gauge,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500',
      what: [
        'Position feedback',
        'Leak-by (downstream pressure)',
        'Actuation current/torque'
      ],
      why: 'Valve stuck/partially open affects pump operating point and causes overload.',
      sensors: [
        'Position sensor',
        'Valve torque sensor or actuator current monitor'
      ]
    },
    {
      id: 8,
      name: 'Lubrication & Oil System',
      icon: FlaskConical,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500',
      what: [
        'Oil temperature',
        'Viscosity proxy (temp + sensor)',
        'Particle counts',
        'Water content'
      ],
      why: 'Poor lubrication accelerates wear.',
      sensors: [
        'Temperature',
        'Oil condition sensors',
        'Particle counters',
        'Moisture sensors'
      ]
    },
    {
      id: 9,
      name: 'Control & Instrumentation',
      icon: Cpu,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500',
      what: [
        'Setpoint changes',
        'Control valve oscillations',
        'PLC commands',
        'Operational mode logs'
      ],
      why: 'Human or control logic induced stress can push pump into harmful regimes.',
      sensors: [
        'PLC tags',
        'Historian integration',
        'Event logs'
      ]
    },
    {
      id: 10,
      name: 'Environment',
      icon: Cloud,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500',
      what: [
        'Ambient temperature/humidity',
        'Foundation vibration'
      ],
      why: 'High ambient temp reduces cooling margin; foundation issues transfer vibration.',
      sensors: [
        'Temperature/humidity sensor',
        'Accelerometer on foundation'
      ]
    }
  ];

  return (
    <div className="bg-slate-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Activity className="w-8 h-8 mr-3 text-primary-500" />
            Pump System Components & Monitoring
          </h1>
          <p className="text-slate-400">
            Comprehensive guide to monitoring parameters, sensors, and failure modes for each pump system component
          </p>
        </div>

        {/* Components Grid */}
        <div className="space-y-4">
          {components.map((component, index) => {
            const Icon = component.icon;
            const isExpanded = expandedSections.has(index);

            return (
              <div
                key={component.id}
                className={`bg-slate-800 rounded-xl border-2 ${component.borderColor} overflow-hidden transition-all`}
              >
                {/* Header - Clickable */}
                <button
                  onClick={() => toggleSection(index)}
                  className={`w-full ${component.bgColor} p-6 flex items-center justify-between hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`${component.color} bg-slate-800 rounded-lg p-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        {component.id}. {component.name}
                        {component.subtitle && (
                          <span className="ml-2 text-sm font-normal text-slate-400">
                            {component.subtitle}
                          </span>
                        )}
                      </h2>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-6 space-y-6 border-t border-slate-700">
                    {/* What to Monitor */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-primary-500" />
                        What to Monitor
                      </h3>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {component.what.map((item, idx) => (
                            <li key={idx} className="flex items-start text-slate-300">
                              <span className="text-primary-500 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Why Monitor */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                        Why Monitor
                      </h3>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <p className="text-slate-300 leading-relaxed">{component.why}</p>
                      </div>
                    </div>

                    {/* Sensors */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Thermometer className="w-5 h-5 mr-2 text-blue-400" />
                        Sensor Types
                      </h3>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {component.sensors.map((sensor, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-600/50 rounded-lg p-3 flex items-center"
                            >
                              <div className={`w-2 h-2 rounded-full ${component.color.replace('text-', 'bg-')} mr-3`}></div>
                              <span className="text-slate-300 text-sm">{sensor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Monitoring Strategy Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 mb-2">Total Components</p>
              <p className="text-2xl font-bold text-white">{components.length}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 mb-2">Critical Components</p>
              <p className="text-2xl font-bold text-red-400">3</p>
              <p className="text-xs text-slate-400 mt-1">Motor, Bearings, Seals</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 mb-2">Sensor Types</p>
              <p className="text-2xl font-bold text-blue-400">20+</p>
              <p className="text-xs text-slate-400 mt-1">Various sensor technologies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpSystemComponents;

