import React, { useState, useEffect, useRef } from 'react';
import {
  TrainTrack,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  Network,
  Cpu,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Search,
  Maximize2,
  Navigation,
  Gauge,
  MapPin,
  Sparkles,
  Layers,
  Users,
  X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
import { Train, Section, SystemAlert } from '../types';
import { api } from '../services/api';

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

interface OverviewDashboardProps {
  onNavigateTab: (tab: string, trainId?: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Train tracking search state
  const [searchMode, setSearchMode] = useState<'NUMBER' | 'NAME'>('NUMBER');
  const [searchInput, setSearchInput] = useState('12284');
  const [selectedTrain, setSelectedTrain] = useState<any>(null);

  // Map layer state
  const [mapLayer, setMapLayer] = useState<'MAP' | 'SATELLITE' | 'HYBRID'>('MAP');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const fetchData = async () => {
    try {
      const [trainsRes, networkRes, alertsRes] = await Promise.all([
        api.getTrains(),
        api.getNetworkCongestion(),
        api.getAlerts()
      ]);

      if (trainsRes.success) {
        setTrains(trainsRes.trains);
        setSummary(trainsRes.summary || {});

        // Match searched train or fallback to 12284 / first train
        const found = trainsRes.trains.find((t: Train) => t.id === searchInput) ||
          trainsRes.trains.find((t: Train) => t.id === '12284') ||
          trainsRes.trains[0];

        setSelectedTrain(found);
      }
      if (networkRes.success) {
        setSections(networkRes.sections);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchTrain = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    const query = searchInput.trim().toLowerCase();
    const matched = trains.find(
      t =>
        t.id.toLowerCase() === query ||
        t.name.toLowerCase().includes(query) ||
        t.origin.toLowerCase().includes(query) ||
        t.destination.toLowerCase().includes(query)
    );

    if (matched) {
      setSelectedTrain(matched);
    }
  };

  // Custom Train Route Waypoints for Map (Ernakulam to Hazrat Nizamuddin)
  const routeWaypoints: { name: string; code: string; lat: number; lng: number; status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'DESTINATION' }[] = [
    { name: 'Kottayam', code: 'KTY', lat: 9.5916, lng: 76.5222, status: 'COMPLETED' },
    { name: 'Ernakulam', code: 'ERS', lat: 9.9816, lng: 76.2999, status: 'CURRENT' },
    { name: 'Thrissur', code: 'TCR', lat: 10.5276, lng: 76.2144, status: 'UPCOMING' },
    { name: 'Palakkad', code: 'PGT', lat: 10.7867, lng: 76.6548, status: 'UPCOMING' },
    { name: 'Coimbatore', code: 'CBE', lat: 11.0168, lng: 76.9558, status: 'UPCOMING' },
    { name: 'Erode', code: 'ED', lat: 11.3410, lng: 77.7172, status: 'UPCOMING' },
    { name: 'Bengaluru', code: 'SBC', lat: 12.9716, lng: 77.5946, status: 'UPCOMING' },
    { name: 'Vijayawada', code: 'BZA', lat: 16.5062, lng: 80.6480, status: 'UPCOMING' },
    { name: 'Nagpur', code: 'NGP', lat: 21.1458, lng: 79.0882, status: 'UPCOMING' },
    { name: 'Bhopal', code: 'BPL', lat: 23.2599, lng: 77.4126, status: 'UPCOMING' },
    { name: 'Hazrat Nizamuddin', code: 'NZM', lat: 28.5892, lng: 77.2528, status: 'DESTINATION' }
  ];

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.5, 78.5],
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark Matter Map Tiles
      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Switch Tile Layers based on selected mode
    if (tileLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      let newUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      if (mapLayer === 'SATELLITE') {
        newUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      } else if (mapLayer === 'HYBRID') {
        newUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      }
      tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 18 }).addTo(mapInstanceRef.current);
    }

    // Draw Route Polyline & Custom Pins
    if (markersGroupRef.current && mapInstanceRef.current) {
      markersGroupRef.current.clearLayers();

      const polylineCoords = routeWaypoints.map(w => [w.lat, w.lng] as [number, number]);

      // Route Polyline with subtle cyan glow
      L.polyline(polylineCoords, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.85,
        dashArray: undefined
      }).addTo(markersGroupRef.current);

      // Add Markers
      routeWaypoints.forEach(w => {
        let pinColor = '#38bdf8';
        let size = 10;
        let isPulsing = false;

        if (w.status === 'CURRENT') {
          pinColor = '#22c55e';
          size = 14;
          isPulsing = true;
        } else if (w.status === 'DESTINATION') {
          pinColor = '#ef4444';
          size = 12;
        } else if (w.status === 'COMPLETED') {
          pinColor = '#94a3b8';
          size = 8;
        }

        const iconHtml = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background-color: ${pinColor};
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${pinColor};
            position: relative;
          ">
            ${isPulsing ? `<div style="
              position: absolute;
              inset: -6px;
              border-radius: 50%;
              border: 2px solid #22c55e;
              animation: radar-pulse 1.8s infinite;
            "></div>` : ''}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-pin',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker([w.lat, w.lng], { icon: customIcon }).addTo(markersGroupRef.current!);

        // Popup label
        marker.bindTooltip(`<b>${w.name} (${w.code})</b>`, {
          permanent: w.status === 'CURRENT' || w.status === 'DESTINATION',
          direction: 'right',
          offset: [8, 0],
          className: 'map-station-tooltip'
        });
      });
    }
  }, [mapLayer]);

  // Delay Insights Line Chart Configuration
  const delayChartData = {
    labels: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM'],
    datasets: [
      {
        label: 'Predicted Delay',
        data: [0, 5, 20, 42, 60],
        borderColor: '#38bdf8',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 180);
          gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
          return gradient;
        },
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#38bdf8'
      },
      {
        label: 'Actual Delay',
        data: [0, 5, null, null, null],
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderWidth: 0,
        pointRadius: 6,
        pointBackgroundColor: '#ef4444',
        showLine: false
      }
    ]
  };

  const delayChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0B192B',
        borderColor: '#24344D',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        callbacks: {
          label: (item: any) => `${item.dataset.label}: +${item.raw} min`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(36, 52, 77, 0.4)' },
        ticks: { color: '#64748B', font: { size: 10 } }
      },
      y: {
        min: -30,
        max: 60,
        grid: { color: 'rgba(36, 52, 77, 0.4)' },
        ticks: {
          stepSize: 30,
          color: '#64748B',
          font: { size: 10 },
          callback: (val: any) => (val === 0 ? '0 min' : `${val > 0 ? `+${val}` : val} min`)
        }
      }
    }
  };

  // Next 5 stops data for table
  const nextStops = [
    { station: 'Ernakulam (ERS)', scheduled: '10:57 AM', predicted: '11:02 AM', actual: '-', delay: '+5 min', isDelay: true },
    { station: 'Thrissur (TCR)', scheduled: '12:40 PM', predicted: '12:45 PM', actual: '-', delay: '+5 min', isDelay: true },
    { station: 'Palakkad (PGT)', scheduled: '02:20 PM', predicted: '02:30 PM', actual: '-', delay: '+10 min', isDelay: true },
    { station: 'Coimbatore (CBE)', scheduled: '05:10 PM', predicted: '05:15 PM', actual: '-', delay: '+5 min', isDelay: true },
    { station: 'Erode (ED)', scheduled: '06:45 PM', predicted: '06:55 PM', actual: '-', delay: '+10 min', isDelay: true }
  ];

  // Journey timeline stops
  const timelineStops = [
    { name: 'Kottayam (KTY)', time: 'Departed at 10:20 AM', status: 'Departed', badgeType: 'green', platform: 'PF 1' },
    { name: 'Ernakulam (ERS)', time: 'ETA 11:02 AM', status: '38 min', badgeType: 'blue', platform: 'PF 6' },
    { name: 'Thrisur (TCR)', time: 'ETA 12:45 PM', status: 'On Time', badgeType: 'green', platform: 'PF 3' },
    { name: 'Palakkad (PGT)', time: 'ETA 02:30 PM', status: 'On Time', badgeType: 'green', platform: 'PF 2' },
    { name: 'Coimbatore (CBE)', time: 'ETA 05:15 PM', status: 'On Time', badgeType: 'green', platform: 'PF 4' }
  ];

  return (
    <div className="page-wrapper">
      {/* 1. TOP HERO AREA: Wide Railway Theme Banner with Live Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '1.25rem',
        marginBottom: '1.25rem',
        alignItems: 'stretch'
      }}>
        {/* Banner with Scenic Bridge Image */}
        <div style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem',
          backgroundImage: 'url(/hero_train.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          boxShadow: 'var(--card-shadow)'
        }}>
          {/* Dark Atmospheric Gradient Overlay for high text contrast */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(6, 17, 31, 0.95) 0%, rgba(6, 17, 31, 0.8) 50%, rgba(6, 17, 31, 0.5) 100%)'
          }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                fontFamily: 'var(--font-heading)'
              }}>
                REAL-TIME INSIGHTS. <br />
                <span style={{ color: 'var(--accent-cyan)' }}>PREDICTED TOMORROWS.</span>
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem', fontWeight: 500 }}>
                Accurate. Reliable. For Every Journey.
              </p>
            </div>

            {/* Inspiring Indian Railways Quote */}
            <div className="header-hide-on-tablet" style={{
              fontStyle: 'italic',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              maxWidth: '320px',
              textAlign: 'right',
              opacity: 0.9
            }}>
              “Trains don’t just connect places, they connect people.”
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1px solid rgba(0, 217, 255, 0.35)',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              color: 'var(--accent-cyan)',
              fontWeight: 700
            }}>
              <Sparkles size={13} />
              SIH26028 DYNAMIC ETA PREDICTION
            </span>
          </div>
        </div>

        {/* Hero Right KPI Stats Cards Stack */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          minWidth: '240px'
        }}>
          {/* Trains Tracked Live */}
          <div className="control-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrainTrack size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                13,523
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Trains Tracked Live
              </div>
            </div>
          </div>

          {/* ETA Prediction Accuracy */}
          <div className="control-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Activity size={20} color="var(--color-green)" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}>
                96.3%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                ETA Prediction Accuracy
              </div>
            </div>
          </div>

          {/* Happy Passengers / Monitored Journeys */}
          <div className="control-card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Users size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                7.4M+
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Happy Passengers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROW 1: "Track a Train" Card + "Live Train Map" Card */}
      <div className="dashboard-grid-main" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.6fr',
        gap: '1.25rem',
        marginBottom: '1.25rem'
      }}>
        {/* LEFT: "Track a Train" Professional Card */}
        <div className="control-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem', fontFamily: 'var(--font-heading)' }}>
              Track a Train
            </div>

            {/* Toggle Mode: By Train Number | By Train Name */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg-panel-tertiary)',
              padding: '3px',
              borderRadius: '10px',
              marginBottom: '0.85rem'
            }}>
              <button
                onClick={() => setSearchMode('NUMBER')}
                style={{
                  padding: '0.45rem',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  background: searchMode === 'NUMBER' ? '#2563eb' : 'transparent',
                  color: searchMode === 'NUMBER' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                By Train Number
              </button>
              <button
                onClick={() => setSearchMode('NAME')}
                style={{
                  padding: '0.45rem',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  background: searchMode === 'NAME' ? '#2563eb' : 'transparent',
                  color: searchMode === 'NAME' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                By Train Name
              </button>
            </div>

            {/* Search Input Field + Track Train Button */}
            <form onSubmit={handleSearchTrain} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder={searchMode === 'NUMBER' ? 'Enter train number (e.g. 12284)' : 'Enter train name (e.g. Duronto)'}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 2rem 0.55rem 0.85rem',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                <Search size={14} />
                <span>Track Train</span>
              </button>
            </form>

            {/* Train Info Card */}
            <div style={{
              background: 'var(--bg-panel-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              {/* Header: Circle Icon, Number & Name, Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TrainTrack size={20} color="#ffffff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {selectedTrain?.id || '12284'}
                    </span>
                    <span className="badge-status badge-on-time" style={{ fontSize: '0.65rem' }}>
                      {selectedTrain?.currentDelayMin > 0 ? `+${selectedTrain.currentDelayMin}m Delay` : 'On Time'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {selectedTrain?.name || 'Ernakulam - Nizamuddin Duronto Express'}
                  </div>
                </div>
              </div>

              {/* Route Trajectory */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-panel-tertiary)',
                borderRadius: '8px',
                fontSize: '0.775rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.85rem'
              }}>
                <span>{selectedTrain?.originName || 'Ernakulam (ERS)'}</span>
                <span style={{ color: 'var(--accent-cyan)', letterSpacing: '0.1em' }}>────────&rarr;</span>
                <span>{selectedTrain?.destinationName || 'Hazrat Nizamuddin (NZM)'}</span>
              </div>

              {/* 4 Metadata Columns Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                textAlign: 'center',
                fontSize: '0.75rem'
              }}>
                <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.5rem 0.25rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Train Type</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTrain?.type || 'Duronto Express'}</div>
                </div>
                <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.5rem 0.25rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Total Distance</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>2,922 km</div>
                </div>
                <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.5rem 0.25rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Total Stops</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>18</div>
                </div>
                <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.5rem 0.25rem', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Journey Duration</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>~ 47h 15m</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('tracking', selectedTrain?.id)}
            className="btn-secondary"
            style={{ marginTop: '0.85rem', width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
          >
            <span>Inspect Real-Time Corridor Tracking &rarr;</span>
          </button>
        </div>

        {/* RIGHT: "Live Train Map" Interactive Card */}
        <div className="control-card" style={{ padding: '1rem', position: 'relative', minHeight: '380px' }}>
          {/* Map Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="radar-live-dot" />
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Live Train Map
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-status badge-on-time" style={{ fontSize: '0.65rem' }}>
                ● Live Tracking
              </span>

              {/* Map Layer Toggle Buttons */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-panel-tertiary)',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid var(--border-subtle)'
              }}>
                {(['MAP', 'SATELLITE', 'HYBRID'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setMapLayer(l)}
                    style={{
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      background: mapLayer === l ? 'var(--bg-hover)' : 'transparent',
                      color: mapLayer === l ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {l.charAt(0) + l.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onNavigateTab('tracking')}
                style={{
                  background: 'var(--bg-panel-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '4px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Fullscreen Map View"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Leaflet Map Render Canvas */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '310px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)'
            }}
          />

          {/* Map Legend Overlay (Top Left of Map) */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            background: 'rgba(11, 25, 43, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.675rem',
            zIndex: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Train Location</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Upcoming Stop</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Completed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Final Destination</span>
            </div>
          </div>

          {/* Floating Telemetry Info Panel (Right Side of Map) */}
          <div style={{
            position: 'absolute',
            top: '55px',
            right: '24px',
            width: '240px',
            background: 'rgba(11, 25, 43, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.75rem',
            zIndex: 400,
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
            fontSize: '0.75rem'
          }}>
            {/* Current Location */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MapPin size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Current Location</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Near Kottayam, Kerala</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Last Updated: 10:24 AM</div>
              </div>
            </div>

            {/* Current Speed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderTop: '1px solid rgba(36, 52, 77, 0.6)', paddingTop: '0.4rem' }}>
              <Gauge size={16} color="var(--accent-cyan)" />
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Current Speed</div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>87 km/h</div>
              </div>
            </div>

            {/* Next Station */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderTop: '1px solid rgba(36, 52, 77, 0.6)', paddingTop: '0.4rem', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Next Station</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Ernakulam (ERS)</div>
                <div style={{ color: 'var(--color-green)', fontSize: '0.65rem', fontWeight: 600 }}>ETA: 11:02 AM</div>
              </div>
              <span className="badge-status" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#38bdf8', fontSize: '0.65rem' }}>
                38 min
              </span>
            </div>

            {/* Delay Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(36, 52, 77, 0.6)', paddingTop: '0.4rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Delay</div>
              <div style={{ fontWeight: 800, color: 'var(--color-red)', fontFamily: 'var(--font-mono)' }}>+5 min</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ROW 2: Journey Timeline + ETA Prediction + Delay Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.25fr 1fr',
        gap: '1.25rem'
      }}>
        {/* Journey Timeline */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              Journey Timeline
            </div>
            <button
              onClick={() => onNavigateTab('tracking')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              View Full Route
            </button>
          </div>

          {/* Vertical Railway Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative' }}>
            {/* Vertical connecting line */}
            <div style={{
              position: 'absolute',
              top: '12px',
              bottom: '12px',
              left: '5px',
              width: '2px',
              background: 'var(--border-subtle)',
              zIndex: 1
            }} />

            {timelineStops.map((stop, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, paddingLeft: '1.25rem' }}>
                {/* Node circle */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: stop.badgeType === 'green' ? 'var(--color-green)' : 'var(--accent-cyan)',
                  border: '2px solid var(--bg-panel-primary)',
                  boxShadow: `0 0 6px ${stop.badgeType === 'green' ? 'var(--color-green)' : 'var(--accent-cyan)'}`
                }} />

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{stop.name}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{stop.time}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className={`badge-status ${stop.badgeType === 'green' ? 'badge-on-time' : ''}`} style={{
                    fontSize: '0.65rem',
                    background: stop.badgeType === 'blue' ? 'rgba(59, 130, 246, 0.2)' : undefined,
                    color: stop.badgeType === 'blue' ? '#38bdf8' : undefined
                  }}>
                    {stop.status}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: 'var(--bg-panel-tertiary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {stop.platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ETA Prediction (Next 5 Stops) */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              ETA Prediction (Next 5 Stops)
            </div>
            <span className="badge-status badge-ai-intel" style={{ fontSize: '0.65rem' }}>
              ✨ AI Powered
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="telemetry-table" style={{ fontSize: '0.775rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Station</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Scheduled</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Predicted</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Actual</th>
                  <th style={{ padding: '0.5rem 0.6rem' }}>Delay</th>
                </tr>
              </thead>
              <tbody>
                {nextStops.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, padding: '0.6rem 0.6rem' }}>{s.station}</td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', padding: '0.6rem 0.6rem' }}>{s.scheduled}</td>
                    <td style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '0.6rem 0.6rem' }}>{s.predicted}</td>
                    <td style={{ color: 'var(--text-muted)', padding: '0.6rem 0.6rem' }}>{s.actual}</td>
                    <td style={{ padding: '0.6rem 0.6rem' }}>
                      <span style={{ color: 'var(--color-red)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {s.delay}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delay Insights Line Chart */}
        <div className="control-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              Delay Insights
            </div>
            <button
              onClick={() => onNavigateTab('forecast')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              View Analytics
            </button>
          </div>

          <div style={{ position: 'relative', height: '170px' }}>
            {/* Callout Box for Current Delay */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(11, 25, 43, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.25rem 0.65rem',
              textAlign: 'center',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Current Delay</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-red)', fontFamily: 'var(--font-mono)' }}>+5 min</div>
            </div>

            <Line data={delayChartData} options={delayChartOptions} />
          </div>

          {/* Chart Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            marginTop: '0.5rem',
            fontSize: '0.7rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Predicted Delay</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Actual Delay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
