import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity, Brain, ShieldCheck, TrendingUp, BarChart2,
    ArrowRight, X, Zap, Server, Database, Layers,
    Globe, Cpu, Clock, AlertTriangle, Check, ChevronDown,
    Play, Users, MessageSquare, ChevronRight, Menu
} from 'lucide-react';
import logo from '../assets/logo.png';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState('monitor');
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-primary-500/30 overflow-x-hidden">

            {/* 1. Header Navigation */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-color)] py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="ANKANI Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
                            ANKANI
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#features" className="hover:text-primary-400 transition-colors">Features</a>
                        <a href="#technology" className="hover:text-primary-400 transition-colors">Technology</a>
                        <a href="#integration" className="hover:text-primary-400 transition-colors">Integration</a>
                        <a href="#pricing" className="hover:text-primary-400 transition-colors">Plans</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-primary-500/50 hover:bg-[var(--bg-hover)] transition-all duration-300 text-sm font-medium"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/demo"
                            className="hidden sm:flex px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/25 transition-all duration-300 text-sm font-medium"
                        >
                            Get Demo Now
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/40 via-[var(--bg-primary)] to-[var(--bg-primary)]" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 animate-fade-in-up backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">System Operational</span>
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-bold tracking-tighter mb-8 leading-tight">
                        Stop Failures <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-blue-600">Before They Happen</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-[var(--text-secondary)] mb-12 leading-relaxed">
                        Industrial-grade predictive maintenance for pump systems. Powered by advanced neural networks to detect cavitation, bearing wear, and seal failures weeks in advance.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="group w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black hover:bg-gray-100 font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Launch Live Simulation
                            <Play className="w-5 h-5 fill-black" />
                        </Link>
                        <Link
                            to="/demo"
                            className="group w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                        >
                            Get Demo Now — Try it free for 30 days
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Hero Visual Graph */}
                <div className="mt-20 max-w-6xl mx-auto px-6 perspective-1000">
                    <div className="relative rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-2 shadow-2xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="bg-[var(--bg-primary)] rounded-lg overflow-hidden h-[300px] md:h-[500px] relative flex items-center justify-center border border-[var(--border-color)]">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                            <div className="relative z-10 w-full h-full flex items-end justify-center pb-12 gap-2 md:gap-4 px-12">
                                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 50].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-primary-500/20 to-primary-500 rounded-t-sm animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <div className="absolute top-8 left-8 p-4 bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)] rounded-xl shadow-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="font-mono text-sm">SYSTEM_STATUS: NOMINAL</span>
                                </div>
                                <div className="text-2xl font-bold font-mono">98.4% EFFICIENCY</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Trusted By / Logos */}
            <section className="py-12 border-y border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-8">Trusted by reliability engineers at</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Chevron', 'Shell', 'ExxonMobil', 'BP', 'TotalEnergies'].map((brand) => (
                            <span key={brand} className="text-xl md:text-2xl font-bold font-serif text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-default">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Problem & Solution Split */}
            <section className="py-24 bg-[var(--bg-primary)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block p-3 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-4xl font-bold mb-6">Reactive maintenance is costing you millions.</h2>
                            <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
                                Waiting for equipment to fail results in catastrophic downtime, safety hazards, and expensive emergency repairs. Traditional vibration analysis often misses the subtle early warning signs of complex failure modes.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Unplanned downtime costs $260k/hour on average',
                                    'Spare parts inventory bloat reduces capital efficiency',
                                    'Safety incidents rise during emergency repairs'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[var(--text-secondary)]">
                                        <X className="w-5 h-5 text-red-500 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-3xl rounded-full opacity-30" />
                            <div className="relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-8 overflow-hidden">
                                <div className="flex justify-between items-center mb-8 border-b border-[var(--border-color)] pb-4">
                                    <div className="font-mono text-red-400">ALERT: P-101B FAILURE</div>
                                    <div className="font-mono text-xs">T-minus 00:00:00</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-red-500 animate-progress origin-left"></div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Vibration RMS</span>
                                        <span className="text-red-500 font-bold">CRITICAL (12.4mm/s)</span>
                                    </div>
                                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-sm text-red-600 mt-4">
                                        <strong>Root Cause:</strong> Bearing inner race spalling caused by lubrication failure.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Core Features Grid */}
            <section id="features" className="py-24 bg-[var(--bg-secondary)]/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold mb-6">Complete Health Visibility</h2>
                        <p className="text-xl text-[var(--text-secondary)]">
                            Our AI models ingest 50+ sensor points to build a digital twin of your pump, predicting issues before they impact production.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<Brain className="w-6 h-6 text-purple-400" />}
                            title="Predictive AI Models"
                            description="Forecast Seal and Bearing failures significantly earlier than traditional thresholds."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
                            title="Anomaly Detection"
                            description="Unsupervised learning identifies new failure modes without historical training data."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-400" />}
                            title="Energy Optimization"
                            description="Monitor hydraulic efficiency and detect motor overloading to reduce power consumption."
                        />
                        <FeatureCard
                            icon={<Activity className="w-6 h-6 text-blue-400" />}
                            title="Vibration Spectrum"
                            description="Automated FFT analysis identifies imbalance, misalignment, and looseness."
                        />
                        <FeatureCard
                            icon={<Clock className="w-6 h-6 text-orange-400" />}
                            title="RUL Estimation"
                            description="Remaining Useful Life calculations allow you to schedule maintenance during planned shutdowns."
                        />
                        <FeatureCard
                            icon={<Database className="w-6 h-6 text-cyan-400" />}
                            title="Digital History"
                            description="Complete forensic timeline of every operational parameter for root cause analysis."
                        />
                    </div>
                </div>
            </section>

            {/* 6. Deep Dive: AI Capabilities (Tabbed) */}
            <section id="technology" className="py-24 bg-[var(--bg-primary)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-16">
                        <div className="lg:w-1/3 space-y-2">
                            <h2 className="text-4xl font-bold mb-8">Intelligence built-in.</h2>
                            <TabButton
                                active={activeTab === 'monitor'}
                                onClick={() => setActiveTab('monitor')}
                                icon={<Activity />}
                                title="Real-time Monitoring"
                                desc="Sub-second data acquisition"
                            />
                            <TabButton
                                active={activeTab === 'diagnose'}
                                onClick={() => setActiveTab('diagnose')}
                                icon={<Brain />}
                                title="AI Diagnosis"
                                desc="Automated fault classification"
                            />
                            <TabButton
                                active={activeTab === 'predict'}
                                onClick={() => setActiveTab('predict')}
                                icon={<TrendingUp />}
                                title="Future Forecasting"
                                desc="7-30 day failure prediction"
                            />
                        </div>

                        <div className="lg:w-2/3">
                            <div className="relative h-full min-h-[400px] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-8 overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <Cpu className="w-64 h-64 text-primary-500" />
                                </div>

                                {activeTab === 'monitor' && (
                                    <div className="relative z-10 animate-fade-in">
                                        <h3 className="text-2xl font-bold mb-4">See everything, instantly.</h3>
                                        <p className="text-[var(--text-secondary)] mb-8 max-w-md">Our edge collectors process vibration at 20kHz, capturing high-frequency transients that standard SCADA systems miss.</p>
                                        <div className="grid grid-cols-2 gap-4 max-w-md">
                                            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                                                <div className="text-xs text-[var(--text-tertiary)] mb-1">Sampling Rate</div>
                                                <div className="text-xl font-bold font-mono">25,600 Hz</div>
                                            </div>
                                            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                                                <div className="text-xs text-[var(--text-tertiary)] mb-1">Latency</div>
                                                <div className="text-xl font-bold font-mono text-green-400">&lt; 150 ms</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'diagnose' && (
                                    <div className="relative z-10 animate-fade-in">
                                        <h3 className="text-2xl font-bold mb-4">It knows what's wrong.</h3>
                                        <p className="text-[var(--text-secondary)] mb-8 max-w-md">The system doesn't just alarm; it explains. Classification models identify specific mechanical faults.</p>
                                        <div className="space-y-3 max-w-sm">
                                            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                <span className="flex items-center gap-2 font-medium text-red-600"><AlertTriangle className="w-4 h-4" /> Cavitation</span>
                                                <span className="text-sm font-mono text-red-600">98% Conf.</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                <span className="flex items-center gap-2 font-medium text-yellow-600"><AlertTriangle className="w-4 h-4" /> Misalignment</span>
                                                <span className="text-sm font-mono text-yellow-600">98% Conf.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'predict' && (
                                    <div className="relative z-10 animate-fade-in">
                                        <h3 className="text-2xl font-bold mb-4">Time travel for machines.</h3>
                                        <p className="text-[var(--text-secondary)] mb-8 max-w-md">Proprietary RUL algorithms project degradation curves into the future, changing maintenance from reactive to strategic.</p>
                                        <img
                                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80"
                                            alt="Graph"
                                            className="rounded-lg opacity-60 mix-blend-screen"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Stats & Impact */}
            <section className="py-20 bg-primary-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/20">
                        <div>
                            <div className="text-4xl md:text-5xl font-bold mb-2">30%</div>
                            <div className="text-primary-100 text-sm font-medium">Maintenance Cost Reduction</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold mb-2">75%</div>
                            <div className="text-primary-100 text-sm font-medium">Downtime Elimination</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold mb-2">12mo</div>
                            <div className="text-primary-100 text-sm font-medium">ROI Payback Period</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                            <div className="text-primary-100 text-sm font-medium">Assets Protected</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Deployment / How it Works */}
            <section className="py-24 bg-[var(--bg-primary)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-6">Simple Deployment</h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">Non-intrusive installation. No shutdown required. Up and running in days, not months.</p>
                    </div>

                    <div className="relative">
                        {/* Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--border-color)] via-primary-500 to-[var(--border-color)] -translate-y-1/2 z-0"></div>

                        <div className="grid md:grid-cols-3 gap-12 relative z-10">
                            <DeploymentStep
                                number="01"
                                title="Connect Sensors"
                                desc="Attach wireless IOT sensors to bearing housing and motor. Simple magnetic or epoxy mount."
                            />
                            <DeploymentStep
                                number="02"
                                title="Train Model"
                                desc="System learns 'normal' behavior over a 2-week baseline period to establish operational envelope."
                            />
                            <DeploymentStep
                                number="03"
                                title="Go Live"
                                desc="Receive instant alerts and health dashboards accessible from anywhere in the world."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. Integration */}
            <section id="integration" className="py-24 bg-[var(--bg-secondary)]/20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2">
                        <Layers className="w-12 h-12 text-primary-500 mb-6" />
                        <h2 className="text-4xl font-bold mb-6">Works with your ecosystem.</h2>
                        <p className="text-lg text-[var(--text-secondary)] mb-8">
                            Don't create another data silo. PumpGuard AI integrates seamlessly with your existing PLC, SCADA, and CMMS systems.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {['SAP PM', 'IBM Maximo', 'Modbus TCP', 'OPC UA', 'MQTT', 'Rest API'].map((tech) => (
                                <div key={tech} className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="font-semibold text-sm">{tech}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md:w-1/2 flex items-center justify-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary-500 blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <img
                                src="/assets/pump-dashboard-preview.png"
                                alt="ANKANI Dashboard Integration"
                                className="relative rounded-2xl border border-[var(--border-color)] shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. FAQ */}
            <section className="py-24 bg-[var(--bg-primary)]">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <FaqItem
                            question="Does it work with variable speed drives (VFD)?"
                            answer="Yes, the AI model normalizes for speed and load variations, ensuring accurate diagnostics across the entire pump curve."
                            isOpen={openFaq === 0}
                            onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                        />
                        <FaqItem
                            question="What communication protocols are supported?"
                            answer="We support standard industrial protocols including Modbus, OPC-UA, and HART, as well as MQTT for cloud-native implementations."
                            isOpen={openFaq === 1}
                            onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                        />
                        <FaqItem
                            question="Is my data secure?"
                            answer="Absolutely. We use end-to-end AES-256 encryption. Data can be processed at the edge (on-premise) or in your private cloud instance."
                            isOpen={openFaq === 2}
                            onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                        />
                    </div>
                </div>
            </section>

            {/* 11. CTA Banner */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-900 to-primary-900 rounded-3xl p-12 md:p-24 text-center relative overflow-hidden border border-primary-500/30">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to eliminate downtime?</h2>
                        <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">Join industry leaders using ANKANI to protect their critical assets.</p>
                        <Link
                            to="/demo"
                            className="bg-white text-primary-900 px-10 py-5 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-2xl inline-block"
                        >
                            Get Demo Now — Try it free for 30 days
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <img src={logo} alt="ANKANI Logo" className="w-8 h-8 object-contain" />
                                <span className="font-semibold text-[var(--text-primary)] text-xl">ANKANI</span>
                            </div>
                            <p className="text-[var(--text-secondary)] mb-6">
                                Advanced predictive maintenance platform by <a href="https://www.petrokens.com/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Petrokens Company</a>.
                            </p>
                            <div className="text-sm text-[var(--text-tertiary)]">
                                Empowering industries with AI-driven reliability solutions.
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[var(--text-primary)]">Services</h4>
                            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                <li className="hover:text-[var(--text-primary)] cursor-pointer">MEP Design</li>
                                <li className="hover:text-[var(--text-primary)] cursor-pointer">Project Management (PMC)</li>
                                <li className="hover:text-[var(--text-primary)] cursor-pointer">Simulation & Modelling</li>
                                <li className="hover:text-[var(--text-primary)] cursor-pointer">Digital Transformation</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[var(--text-primary)]">Company</h4>
                            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                <li><a href="https://www.petrokens.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)]">About Us</a></li>
                                <li><a href="https://www.petrokens.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)]">Careers</a></li>
                                <li><a href="https://www.petrokens.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)]">Gallery</a></li>
                                <li><a href="https://www.petrokens.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)]">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[var(--text-primary)]">Contact Us</h4>
                            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                                <li className="flex items-start gap-2">
                                    <Globe className="w-4 h-4 mt-0.5 text-primary-500" />
                                    <a href="https://www.petrokens.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)]">www.petrokens.com</a>
                                </li>
                                <li className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 mt-0.5 text-primary-500" />
                                    <span>info@petrokens.com</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--text-secondary)]">
                        <div>© 2026 Petrokens Company. All rights reserved.</div>
                        <div className="flex gap-6">
                            <span className="cursor-pointer hover:text-[var(--text-primary)]">Privacy Policy</span>
                            <span className="cursor-pointer hover:text-[var(--text-primary)]">Terms of Service</span>
                            <span className="cursor-pointer hover:text-[var(--text-primary)]">Cookie Policy</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

// --- Subcomponents ---

const FeatureCard = ({ icon, title, description }) => (
    <div className="group p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-primary-500/50 hover:bg-[var(--bg-hover)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-6 text-primary-500 group-hover:scale-110 group-hover:bg-primary-500/10 transition-all duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{title}</h3>
        <p className="text-[var(--text-secondary)] leading-relaxed">
            {description}
        </p>
    </div>
);

const TabButton = ({ active, onClick, icon, title, desc }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${active ? 'bg-[var(--bg-card)] border border-primary-500/50 shadow-lg' : 'hover:bg-[var(--bg-secondary)] border border-transparent'}`}
    >
        <div className={`p-3 rounded-lg ${active ? 'bg-primary-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
            {icon}
        </div>
        <div>
            <div className={`font-bold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{title}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
        </div>
    </button>
);

const DeploymentStep = ({ number, title, desc }) => (
    <div className="relative bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border-color)] text-center group hover:-translate-y-2 transition-transform duration-300">
        <div className="w-12 h-12 mx-auto bg-[var(--bg-primary)] border border-primary-500 rounded-full flex items-center justify-center text-primary-500 font-bold mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors">
            {number}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-[var(--text-secondary)]">{desc}</p>
    </div>
);

const CheckCircle2 = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
);

const FaqItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
        <button onClick={onClick} className="w-full flex items-center justify-between p-6 text-left">
            <span className="font-semibold text-lg">{question}</span>
            {isOpen ? <ChevronDown className="w-5 h-5 text-primary-500" /> : <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />}
        </button>
        {isOpen && (
            <div className="px-6 pb-6 text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)] pt-4">
                {answer}
            </div>
        )}
    </div>
);

export default LandingPage;
