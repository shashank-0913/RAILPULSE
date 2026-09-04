import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Radio,
  BarChart3,
  GitCompare,
  ArrowRight
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Train, Section, ScenarioOption } from '../types';
import { api } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WhatIfSimulationProps {
  onNavigateTab?: (tab: string) => void;
}

export const WhatIfSimulation: React.FC<WhatIfSimulationProps> = ({ onNavigateTab }) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<string>('12864');
  const [additionalDelayMin, setAdditionalDelayMin] = useState<number>(15);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('SEC_VSKP_VZM');
  const [weatherCondition, setWeatherCondition] = useState<string>('Heavy Rain / Fog');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [trainsRes, netRes] = await Promise.all([
        api.getTrains(),
        api.getNetworkCongestion()
      ]);
      if (trainsRes.success) setTrains(trainsRes.trains);
      if (netRes.success) setSections(netRes.sections);

      handleRunSimulation('12864', 15, 'SEC_VSKP_VZM');
    };
    init();
  }, []);

  const handleRunSimulation = async (
    tId = selectedTrainId,
    delay = additionalDelayMin,
    secId = selectedSectionId
  ) => {
    setIsSimulating(true);
    try {
      const res = await api.runWhatIfSimulation({
        trainId: tId,
        additionalDelayMinutes: Number(delay),
        sectionId: secId,
        weatherCondition
      });

      if (res.success && res.simulation) {
        setSimulationResult(res.simulation);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const chartLabels = simulationResult?.comparison?.after?.map((t: any) => `Train #${t.id}`) || [
    'Train #12864', 'Train #17240', 'Train #18520', 'Train #12803'
  ];

  const beforeData = simulationResult?.comparison?.before?.map((t: any) => t.delayMin) || [12, 2, 5, 32];
  const afterData = simulationResult?.comparison?.after?.map((t: any) => t.delayMin) || [27, 11, 8, 36];

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Baseline Delay (Before Disturbance)',
        data: beforeData,
        backgroundColor: '#38bdf8',
        borderRadius: 6
      },
      {
        label: 'Simulated Cascade Delay (After Disturbance)',
        data: afterData,
        backgroundColor: '#ef4444',
        borderRadius: 6
      }
    ]
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        callbacks: {
          label: (context: any) => `${context.dataset.label}: +${context.raw} min`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(28, 42, 71, 0.4)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(28, 42, 71, 0.4)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (val: any) => `+${val}m`
        },
        title: {
          display: true,
          text: 'Delay in Minutes',
          color: '#64748b'
        }
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge-status badge-ai-intel">SIGNATURE FEATURE</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontFamily: 'JetBrains Mono' }}>
            Multi-Scenario Disturbance Sandbox
          </span>
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={22} color="#06b6d4" />
          What-If Scenario Simulation & Multi-Option Comparison Engine
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Simulate operational disruptions, evaluate comparative dispatch strategies (Scenarios A, B, C), and discover the AI-preferred lowest-impact intervention.
        </p>
      </div>

      {/* Scenario Sandbox Controls Bar */}
      <div className="control-card control-card-glass" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} /> Configure Disturbance Scenario
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Target Train */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
              Select Disturbed Train:
            </label>
            <select
              value={selectedTrainId}
              onChange={e => setSelectedTrainId(e.target.value)}
              style={{
                width: '100%',
                background: '#131c33',
                border: '1px solid #1e2e4f',
                color: '#f8fafc',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontFamily: 'JetBrains Mono'
              }}
            >
              {trains.map(t => (
                <option key={t.id} value={t.id}>
                  Train #{t.id} - {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Injected Delay Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
              <span>Additional Delay Injection:</span>
              <strong style={{ color: '#f97316', fontFamily: 'JetBrains Mono' }}>+{additionalDelayMin} min</strong>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={additionalDelayMin}
              onChange={e => setAdditionalDelayMin(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f97316', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
              <span>+5m</span>
              <span>+15m</span>
              <span>+30m</span>
              <span>+45m</span>
              <span>+60m</span>
            </div>
          </div>

          {/* Section Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
              Affected Railway Section:
            </label>
            <select
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              style={{
                width: '100%',
                background: '#131c33',
                border: '1px solid #1e2e4f',
                color: '#f8fafc',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.825rem'
              }}
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.from} &rarr; {s.to} ({s.currentOccupancy}% Occ)
                </option>
              ))}
            </select>
          </div>

          {/* Simulate Action Button */}
          <div>
            <button
              onClick={() => handleRunSimulation()}
              disabled={isSimulating}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.65rem 1rem',
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
              }}
            >
              <Play size={16} />
              <span>{isSimulating ? 'Simulating Impact...' : 'SIMULATE IMPACT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multiple Scenario Comparison Cards (Prompt Section 15) */}
      {simulationResult?.scenariosComparison && (
        <div className="control-card" style={{ marginBottom: '1.5rem', background: '#0a1020' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitCompare size={18} color="#10b981" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Multiple Scenario Comparison Matrix
                </h2>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Comparing 3 alternative dispatch interventions to minimize downstream network delay.
              </p>
            </div>

            {simulationResult.preferredOption && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '0.4rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Sparkles size={14} color="#10b981" />
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                  AI PREFERRED: {simulationResult.preferredOption.scenarioId} (Saves {simulationResult.preferredOption.expectedNetworkDelayReductionMin}m | {simulationResult.preferredOption.confidencePercent}% Conf)
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {simulationResult.scenariosComparison.map((sc: ScenarioOption) => (
              <div
                key={sc.id}
                style={{
                  background: sc.isPreferred ? 'rgba(16, 185, 129, 0.08)' : '#10192e',
                  border: sc.isPreferred ? '2px solid #10b981' : '1px solid #1e2e4f',
                  borderRadius: '10px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: sc.isPreferred ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: sc.isPreferred ? '#34d399' : '#94a3b8' }}>
                      {sc.id}
                    </span>
                    {sc.isPreferred && (
                      <span className="badge-status badge-on-time" style={{ fontSize: '0.65rem' }}>
                        ★ AI RECOMMENDED
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                    {sc.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                    {sc.strategy}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #1e2e4f', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Network Delay:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: sc.totalNetworkDelayMin > 10 ? '#ef4444' : '#10b981', fontFamily: 'JetBrains Mono' }}>
                      {sc.totalNetworkDelayMin} min
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Delay Saved:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                      +{sc.delaySavedMin} min
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Before / After Charts & Recommendations */}
      {simulationResult && (
        <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* Before / After Chart */}
          <div className="control-card">
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#06b6d4" />
                Before vs After Disturbance Delay Delta
              </h2>
              <p style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                Evaluating individual train delay growth under scenario: Train #{selectedTrainId} (+{additionalDelayMin}m extra delay).
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Quick AI Action Cards */}
          <div className="control-card control-card-glow-green" style={{ background: '#0a1424' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                AI Decision Support Advisories
              </h2>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('recommendations')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Full Decision Ledger &rarr;
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {simulationResult.recommendations?.map((rec: any, idx: number) => (
                <div key={idx} style={{ background: '#10192e', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#34d399', fontWeight: 700, marginBottom: '2px' }}>
                    <span>{rec.priority} PRIORITY</span>
                    <span>Saves ~{rec.estimatedSavingMin}m</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f8fafc' }}>{rec.title}</div>
                  <div style={{ fontSize: '0.725rem', color: '#cbd5e1', marginTop: '3px' }}>{rec.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
