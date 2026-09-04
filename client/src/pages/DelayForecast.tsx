import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Zap,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Train } from '../types';
import { api } from '../services/api';

interface DelayForecastProps {
  selectedTrainId?: string;
}

export const DelayForecast: React.FC<DelayForecastProps> = ({ selectedTrainId = '12864' }) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [activeTrainId, setActiveTrainId] = useState(selectedTrainId);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTrainId(selectedTrainId);
  }, [selectedTrainId]);

  const loadForecast = async (trainId: string) => {
    try {
      const [trainsRes, forecastRes] = await Promise.all([
        api.getTrains(),
        api.getDelayForecast(trainId)
      ]);
      if (trainsRes.success) setTrains(trainsRes.trains);
      if (forecastRes.success) setForecastData(forecastRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(activeTrainId);
  }, [activeTrainId]);

  const activeTrain = trains.find(t => t.id === activeTrainId) || trains[0];

  const chartLabels = forecastData?.progressionData?.map((p: any) => p.checkpoint) || [
    'Origin', 'Prev Station', 'Current GPS Block', 'In +30 Min', 'Next Station', 'In +60 Min', 'Destination'
  ];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Delay Trajectory Projection (Minutes)',
        data: forecastData?.progressionData?.map((p: any) => (p.actualMin !== null ? p.actualMin : p.predictedMin)) || [0, 8, 12, 14, 15, 17, 19],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#f97316',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Timetable Scheduled Zero Baseline',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#475569',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } }
    },
    scales: {
      x: {
        grid: { color: 'rgba(28, 42, 71, 0.4)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(28, 42, 71, 0.4)' },
        ticks: {
          color: '#94a3b8',
          callback: (val: any) => `+${val} min`
        }
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge-status badge-ai-intel">TEMPORAL PROJECTION</span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={22} color="#f97316" />
            Time-Horizon Delay Progression & Recovery Forecast
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Predictive delay evolution across upcoming 30m, 60m, next block stations, and destination corridor slack.
          </p>
        </div>

        <select
          value={activeTrainId}
          onChange={e => { setActiveTrainId(e.target.value); loadForecast(e.target.value); }}
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
              Train #{t.id} - {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4 Forecast Progression Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Current Delay */}
        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>CURRENT LIVE DELAY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fb923c', fontFamily: 'JetBrains Mono', margin: '0.35rem 0' }}>
            +{forecastData?.currentDelayMin || activeTrain?.currentDelayMin || 12} min
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Live GPS location: {activeTrain?.currentLocationName.split('(')[0]}</div>
        </div>

        {/* In +30 Minutes */}
        <div className="control-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>PREDICTED IN +30 MIN</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono', margin: '0.35rem 0' }}>
            +{forecastData?.forecast30MinDelay || 14} min
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Delta: +2 min increase</div>
        </div>

        {/* Next Station */}
        <div className="control-card control-card-glow-orange">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c' }}>PREDICTED AT NEXT STATION</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fb923c', fontFamily: 'JetBrains Mono', margin: '0.35rem 0' }}>
            +{forecastData?.forecastNextStationDelay || 14} min
          </div>
          <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>Station: {activeTrain?.nextStationName} ({activeTrain?.nextStation})</div>
        </div>

        {/* Destination & Trend */}
        <div className="control-card control-card-glow-green">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>PREDICTED AT DESTINATION</span>
            <span className="badge-status badge-moderate-delay" style={{ fontSize: '0.65rem' }}>
              {forecastData?.trend || 'INCREASING'}
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '0.35rem 0' }}>
            +{forecastData?.forecastDestDelay || activeTrain?.predictedDestDelayMin || 19} min
          </div>
          <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
            Recovery Probability: {forecastData?.recoveryProbabilityPercent || 68}%
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="control-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Multi-Stage Delay Evolution Curve
            </h2>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Forecasted delay trajectory from journey origin through upcoming track blocks to destination terminal.
            </p>
          </div>
        </div>
        <div style={{ height: '340px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};
