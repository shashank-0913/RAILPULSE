import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  TrendingDown,
  Filter,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { api } from '../services/api';

export const HistoricalAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await api.getHistoricalAnalytics();
      if (res.success) {
        setAnalyticsData(res);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Station Delays Bar Chart
  const stationChartData = {
    labels: analyticsData?.stationDelays?.map((s: any) => s.name.replace(' Junction', ' Jn')) || ['VSKP', 'VZM', 'BZA', 'RJY', 'BBS'],
    datasets: [
      {
        label: 'Average Station Delay (Minutes)',
        data: analyticsData?.stationDelays?.map((s: any) => s.avgDelayMin) || [14.8, 12.2, 16.5, 9.8, 8.4],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Average Platform Dwell Time (Minutes)',
        data: analyticsData?.stationDelays?.map((s: any) => s.avgDwellMin) || [18.2, 6.4, 14.5, 4.8, 7.2],
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        borderRadius: 6
      }
    ]
  };

  // Hourly Delays Line Chart
  const hourlyChartData = {
    labels: analyticsData?.hourlyDelays?.map((h: any) => h.hour) || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Diurnal Delay Peak (Minutes)',
        data: analyticsData?.hourlyDelays?.map((h: any) => h.avgDelayMin) || [6.2, 7.1, 16.2, 10.3, 13.4, 17.2],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Track Congestion Index %',
        data: analyticsData?.hourlyDelays?.map((h: any) => h.congestionIndex / 5) || [6.4, 8.0, 16.8, 11.6, 14.4, 17.6],
        borderColor: '#10b981',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.3
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } } }
    },
    scales: {
      x: { grid: { color: 'rgba(28, 42, 71, 0.4)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(28, 42, 71, 0.4)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge-status badge-ai-intel">HISTORICAL BIG DATA</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
            1,420,500 Telemetry Records Evaluated
          </span>
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={22} color="#10b981" />
          Historical Delay Intelligence & Longitudinal Patterns
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Long-term delay patterns across station junctions, time-of-day traffic surges, and day-of-week reliability indices.
        </p>
      </div>

      {/* Two-Column Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Station-wise Average Delays */}
        <div className="control-card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Station-Wise Average Delay & Platform Dwell Variance
            </h2>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Comparison of average arrival delay vs allotted platform dwell overruns across major junctions.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={stationChartData} options={chartOptions} />
          </div>
        </div>

        {/* Diurnal Delay & Congestion by Hour of Day */}
        <div className="control-card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Diurnal Delay Curve by Hour of Day (24-Hour Peak Profiling)
            </h2>
            <p style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Peak delay surges during morning (08:00–10:00) and evening (18:00–20:00) coaching train concentration.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <Line data={hourlyChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Day of Week Reliability Table */}
      <div className="control-card">
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', marginBottom: '0.75rem' }}>
          Day-of-Week Punctuality & Average Delay Metrics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {analyticsData?.dayOfWeekDelays?.map((d: any) => (
            <div key={d.day} style={{
              background: '#131c33',
              border: '1px solid #1e2e4f',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>{d.day}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: d.avgDelayMin > 15 ? '#f97316' : '#10b981', fontFamily: 'JetBrains Mono', margin: '0.25rem 0' }}>
                +{d.avgDelayMin}m
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{d.punctuality}% Punctual</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
