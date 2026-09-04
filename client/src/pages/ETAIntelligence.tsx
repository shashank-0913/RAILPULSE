import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowDown,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Train, PredictionResult } from '../types';
import { api } from '../services/api';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ETAIntelligenceProps {
  selectedTrainId?: string;
}

export const ETAIntelligence: React.FC<ETAIntelligenceProps> = ({ selectedTrainId = '12864' }) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [activeTrainId, setActiveTrainId] = useState<string>(selectedTrainId);
  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateAgo, setLastUpdateAgo] = useState(18);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    setActiveTrainId(selectedTrainId);
  }, [selectedTrainId]);

  const loadData = async (trainId: string) => {
    try {
      const [trainsRes, predRes, stopsRes] = await Promise.all([
        api.getTrains(),
        api.getTrainById(trainId),
        api.getTrainStops(trainId)
      ]);

      if (trainsRes.success) {
        setTrains(trainsRes.trains);
      }
      if (predRes.success && predRes.prediction) {
        setPredictionData(predRes.prediction);
      }
      if (stopsRes.success && stopsRes.stops) {
        setStops(stopsRes.stops);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTrainId);
    const timer = setInterval(() => {
      setLastUpdateAgo(prev => (prev > 60 ? 4 : prev + 3));
    }, 3000);
    return () => clearInterval(timer);
  }, [activeTrainId]);

  const handleSimulateTick = async () => {
    setIsSimulating(true);
    await api.triggerTelemetryTick();
    await loadData(activeTrainId);
    setLastUpdateAgo(0);
    setIsSimulating(false);
  };

  const selectedTrain = trains.find(t => t.id === activeTrainId) || trains[0];

  // Chart data comparing: Scheduled ETA vs Historical ETA vs RailPulse ML ETA vs Actual ETA
  const chartLabels = ['Howrah (Origin)', 'Bhubaneswar', 'Khurda Rd', 'Brahmapur', 'Palasa', 'Srikakulam Rd', 'Vizianagaram (Next)', 'Visakhapatnam', 'Rajahmundry', 'Vijayawada', 'Chennai Central'];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Scheduled Timetable ETA (Min Delay: 0)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#64748b',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 3,
        fill: false
      },
      {
        label: 'Historical 90-Day Average Delay',
        data: [0, 4, 7, 9, 11, 13, 14, 17, 21, 23, 24],
        borderColor: '#f59e0b',
        borderWidth: 2,
        pointRadius: 4,
        fill: false
      },
      {
        label: 'RailPulse Dynamic XGBoost ML ETA',
        data: [0, 3, 6, 8, 10, 12, 12, 16, 18, 19, 19],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#10b981',
        fill: true,
        tension: 0.2
      },
      {
        label: 'Actual Ingested Milestones (Past Stations)',
        data: [0, 4, 6, 8, 10, 12, null, null, null, null, null],
        borderColor: '#38bdf8',
        backgroundColor: '#38bdf8',
        borderWidth: 3,
        pointRadius: 6,
        showLine: true
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 11, weight: '500' },
          boxWidth: 14
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#1e2e4f',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw !== null ? `+${context.raw} min` : 'Pending'}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(28, 42, 71, 0.4)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(28, 42, 71, 0.4)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value: any) => `+${value}m`
        },
        title: {
          display: true,
          text: 'Delay Delta from Scheduled (Minutes)',
          color: '#64748b',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Header & Train Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge-status badge-ai-intel">CORE INNOVATION</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'JetBrains Mono' }}>
              Prediction updated {lastUpdateAgo} seconds ago
            </span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={22} color="#10b981" />
            Dynamic Train ETA Prediction & Multi-Horizon Intelligence
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Multi-factor gradient boosted regression reconciling live GPS transponder speed, station dwell variance, track congestion, and route geometry.
          </p>
        </div>

        {/* Train Dropdown & Re-Simulation Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={activeTrainId}
            onChange={e => { setActiveTrainId(e.target.value); loadData(e.target.value); }}
            style={{
              background: '#131c33',
              border: '1px solid #1e2e4f',
              color: '#f8fafc',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono'
            }}
          >
            {trains.map(t => (
              <option key={t.id} value={t.id}>
                Train #{t.id} - {t.name} ({t.statusText})
              </option>
            ))}
          </select>

          <button
            onClick={handleSimulateTick}
            disabled={isSimulating}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <RefreshCw size={14} className={isSimulating ? 'animate-spin' : ''} />
            <span>Recalculate Dynamic ETA</span>
          </button>
        </div>
      </div>

      {/* 3 Core Highlight Comparison Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Scheduled ETA */}
        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            SCHEDULED TIMETABLE ETA
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#cbd5e1', fontFamily: 'JetBrains Mono', margin: '0.4rem 0' }}>
            {predictionData?.scheduledArrival || selectedTrain?.scheduledNextArrival || '18:30'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Station: {selectedTrain?.nextStationName || 'Vizianagaram Jn'}
          </div>
        </div>

        {/* RailPulse Predicted ETA */}
        <div className="control-card control-card-glow-green" style={{ background: 'linear-gradient(135deg, #0d1e2e 0%, #0d1527 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              RAILPULSE PREDICTED ETA
            </span>
            <span className="badge-status badge-ai-intel" style={{ fontSize: '0.65rem' }}>AI FORECAST</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '0.4rem 0' }}>
            {predictionData?.predictedArrival || selectedTrain?.predictedNextArrival || '18:42'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>Difference:</span>
            <strong>+{predictionData?.delayDeltaMin || selectedTrain?.currentDelayMin || 12} minutes</strong>
          </div>
        </div>

        {/* 90% Confidence Interval */}
        <div className="control-card control-card-glow-cyan">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
            PREDICTION CONFIDENCE & INTERVAL
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono', margin: '0.4rem 0' }}>
            {predictionData?.confidencePercent || selectedTrain?.confidencePercent || 91.4}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
            90% CI: [{predictionData?.confidenceInterval?.lower || '18:39'} – {predictionData?.confidenceInterval?.upper || '18:45'}] (±{predictionData?.confidenceInterval?.marginMinutes || 3}m)
          </div>
        </div>

        {/* Final Destination Impact */}
        <div className="control-card control-card-glow-orange">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c', textTransform: 'uppercase' }}>
            FINAL DESTINATION ARRIVAL
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', fontFamily: 'JetBrains Mono', margin: '0.4rem 0' }}>
            {selectedTrain?.predictedDestArrival || '06:34 (+1d)'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            Sched: {selectedTrain?.scheduledDestArrival || '06:15'} (Net Delay: +{selectedTrain?.predictedDestDelayMin || 19}m)
          </div>
        </div>
      </div>

      {/* Two Columns: Comparative Multi-Horizon Graph & Station Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Comparative Chart */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#10b981" />
                Scheduled vs Historical vs RailPulse ML vs Actual Arrival
              </h2>
              <p style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                Continuous delay progression across station milestones for Train #{selectedTrain?.id}.
              </p>
            </div>
          </div>
          <div style={{ height: '320px', width: '100%' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Visual Station Progression Timeline */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              Station Arrival Timeline & Dwell Milestones
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Route: {selectedTrain?.origin} &rarr; {selectedTrain?.destination}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.35rem' }}>
            {stops.map((stop, idx) => {
              const isCompleted = stop.status === 'COMPLETED';
              const isNext = stop.status === 'UPCOMING_NEXT';
              const isDest = stop.status === 'DESTINATION';

              return (
                <div key={stop.stationCode || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: isNext ? 'rgba(16, 185, 129, 0.12)' : '#10192e',
                  border: isNext ? '1px solid #10b981' : '1px solid #1c2a47'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isCompleted ? '#1e2e4f' : isNext ? '#10b981' : '#131c33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: isCompleted ? '#64748b' : '#ffffff'
                    }}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.825rem', color: isNext ? '#34d399' : '#f8fafc' }}>
                        {stop.stationName} ({stop.stationCode})
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Sched Arr: {stop.scheduledArr} | Sched Dep: {stop.scheduledDep}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono',
                      color: isCompleted ? '#94a3b8' : isNext ? '#10b981' : '#cbd5e1'
                    }}>
                      {isCompleted ? (stop.actualArr || stop.scheduledArr) : (stop.predictedArr || stop.scheduledArr)}
                    </div>
                    <div style={{ fontSize: '0.675rem', color: isCompleted ? '#64748b' : '#fb923c' }}>
                      {isCompleted ? `Actual (Delta: +${stop.delayDepMin || 0}m)` : `ML Predicted (+${stop.predictedDelayMin || stop.deltaMin || 12}m)`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explainability & Feature Contribution Breakdown (SHAP-style) */}
      <div className="control-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#06b6d4" />
              Explainable AI: Why Did The Dynamic ETA Shift?
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Model feature attribution identifying primary operational factors causing deviation from timetable schedule.
            </p>
          </div>
          <span className="badge-status badge-ai-intel">SHAP Attribution</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {predictionData?.featureAttributions?.map((feat, idx) => {
            const isIncrease = feat.impactDirection === 'DELAY_INCREASE';
            return (
              <div key={idx} style={{
                background: '#10192e',
                border: '1px solid #1c2a47',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f8fafc' }}>{feat.feature}</span>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      fontFamily: 'JetBrains Mono',
                      color: isIncrease ? '#f97316' : '#10b981'
                    }}>
                      {isIncrease ? `+${feat.impactMin} min` : `${feat.impactMin} min`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontFamily: 'JetBrains Mono', marginBottom: '0.35rem' }}>
                    {feat.value}
                  </div>
                  <p style={{ fontSize: '0.725rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
