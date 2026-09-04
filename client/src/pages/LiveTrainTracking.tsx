import React, { useState, useEffect } from 'react';
import {
  TrainTrack,
  Compass,
  Gauge,
  Clock,
  Cpu,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  MapPin,
  Layers,
  X,
  Sliders,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Train, Station, Section } from '../types';
import { api } from '../services/api';
import { LeafletRailwayMap } from '../components/LeafletRailwayMap';

interface LiveTrainTrackingProps {
  selectedTrainId?: string;
  onNavigateTab: (tab: string, trainId?: string) => void;
}

export const LiveTrainTracking: React.FC<LiveTrainTrackingProps> = ({
  selectedTrainId = '12864',
  onNavigateTab
}) => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTrain, setActiveTrain] = useState<Train | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapViewMode, setMapViewMode] = useState<'SCHEMATIC' | 'LEAFLET_OSM'>('LEAFLET_OSM');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [trainsRes, stationsRes, networkRes] = await Promise.all([
          api.getTrains(),
          api.getStations(),
          api.getNetworkCongestion()
        ]);

        if (!isMounted) return;

        if (trainsRes.success) {
          setTrains(trainsRes.trains);
          const current = trainsRes.trains.find(t => t.id === selectedTrainId) || trainsRes.trains[0];
          setActiveTrain(prev => {
            if (!prev) return current;
            const updated = trainsRes.trains.find(t => t.id === prev.id);
            return updated || current;
          });
        }
        if (stationsRes.success) {
          setStations(stationsRes.stations);
        }
        if (networkRes.success) {
          setSections(networkRes.sections);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedTrainId]);

  // Station coordinate mapping to SVG Canvas viewport (1000 x 500)
  // Maps real lat/lng along the corridor to a clean railway schematic map
  const getStationCanvasCoords = (code: string) => {
    const mapCoords: Record<string, { x: number; y: number }> = {
      HWH: { x: 880, y: 70 },
      BBS: { x: 740, y: 130 },
      KUR: { x: 700, y: 160 },
      BAM: { x: 620, y: 200 },
      PSA: { x: 540, y: 230 },
      CHE: { x: 470, y: 260 },
      VZM: { x: 400, y: 290 },
      VSKP: { x: 340, y: 320 },
      DVD: { x: 300, y: 345 },
      AKP: { x: 260, y: 365 },
      SLO: { x: 210, y: 395 },
      RJY: { x: 170, y: 420 },
      EE: { x: 130, y: 445 },
      BZA: { x: 90, y: 465 },
      SC: { x: 80, y: 220 },
      MAS: { x: 60, y: 490 }
    };
    return mapCoords[code] || { x: 500, y: 250 };
  };

  // Train SVG coordinate interpolation
  const getTrainCanvasCoords = (train: Train) => {
    // Specific positions for primary corridor visualization
    if (train.id === '12864') return { x: 365, y: 308 }; // Between VSKP & VZM
    if (train.id === '17240') return { x: 435, y: 275 }; // Approaching VZM from CHE
    if (train.id === '18520') return { x: 315, y: 335 }; // Approaching VSKP from DVD
    if (train.id === '12727') return { x: 340, y: 320 }; // At VSKP PF 1
    if (train.id === '22807') return { x: 235, y: 380 }; // AKP -> SLO
    if (train.id === '12841') return { x: 580, y: 215 }; // BAM -> PSA
    if (train.id === '12803') return { x: 440, y: 270 }; // CHE -> VZM
    if (train.id === '18048') return { x: 150, y: 432 }; // RJY -> EE

    // Default fallback
    const st = getStationCanvasCoords(train.nextStation);
    return { x: st.x + 20, y: st.y - 15 };
  };

  const filteredTrains = trains.filter(t => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchSearch = !searchQuery || t.id.includes(searchQuery) || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const [systemMode, setSystemMode] = useState<'LIVE' | 'DEMO'>(() => {
    return (localStorage.getItem('railpulse_mode') as 'LIVE' | 'DEMO') || 'LIVE';
  });
  const [showWhyEta, setShowWhyEta] = useState<boolean>(false);

  useEffect(() => {
    const handleModeChange = (e: any) => {
      if (e.detail) {
        setSystemMode(e.detail);
        localStorage.setItem('railpulse_mode', e.detail);
      }
    };
    window.addEventListener('railpulse:setMode', handleModeChange);
    return () => window.removeEventListener('railpulse:setMode', handleModeChange);
  }, []);

  return (
    <div className="page-wrapper">
      {/* Live Mode Notice Banner when in Live Mode with Simulated / Fallback Data */}
      {systemMode === 'LIVE' && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} color="#f59e0b" className="animate-pulse" />
            <span style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 600 }}>
              <strong>LIVE MODE ACTIVE:</strong> RailRadar telemetry normalization layer active. If live transponder is unavailable, fallback high-fidelity simulation maintains dynamic ETA prediction.
            </span>
          </div>
          <button
            onClick={() => {
              const ev = new CustomEvent('railpulse:setMode', { detail: 'DEMO' });
              window.dispatchEvent(ev);
            }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#0f172a',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Switch to Pure DEMO MODE</span>
          </button>
        </div>
      )}

      {/* Top Header & Filter Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrainTrack size={22} color="#10b981" />
            Live Train Tracking & High-Density Corridor Map
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Interactive geographical telemetry grid across East Coast (HWH-VSKP-BZA) & Central Trunks.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search Train # / Name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: '#131c33',
                border: '1px solid #1e2e4f',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.775rem',
                color: '#f8fafc',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          {(['ALL', 'ON_TIME', 'MINOR_DELAY', 'MODERATE_DELAY', 'CRITICAL_DELAY'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.7rem',
                borderRadius: '8px',
                fontSize: '0.725rem',
                fontWeight: 600,
                border: statusFilter === st ? '1px solid #10b981' : '1px solid #1e2e4f',
                background: statusFilter === st ? 'rgba(16, 185, 129, 0.15)' : '#10192e',
                color: statusFilter === st ? '#34d399' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {st === 'ALL' ? 'All Trains' : st.replace('_', ' ')}
            </button>
          ))}
          {/* Map View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setMapViewMode('LEAFLET_OSM')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: 600,
                border: 'none',
                background: mapViewMode === 'LEAFLET_OSM' ? 'var(--color-cyan)' : 'transparent',
                color: mapViewMode === 'LEAFLET_OSM' ? '#0f172a' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <Layers size={13} />
              Leaflet OSM Map
            </button>
            <button
              onClick={() => setMapViewMode('SCHEMATIC')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: 600,
                border: 'none',
                background: mapViewMode === 'SCHEMATIC' ? 'var(--color-cyan)' : 'transparent',
                color: mapViewMode === 'SCHEMATIC' ? '#0f172a' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <TrainTrack size={13} />
              Schematic Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Detail Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: activeTrain ? '1.5fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Map View (Leaflet or SVG Schematic) */}
        {mapViewMode === 'LEAFLET_OSM' ? (
          <LeafletRailwayMap
            selectedTrain={activeTrain}
            allTrains={filteredTrains}
            stations={stations}
            sections={sections}
            onSelectTrain={t => setActiveTrain(t)}
            onSelectStation={st => console.log('Station selected:', st)}
            onNavigateTab={onNavigateTab}
          />
        ) : (
          <div className="control-card" style={{ padding: '1rem', background: 'var(--svg-canvas-bg)', minHeight: '560px', position: 'relative' }}>
          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            fontSize: '0.7rem',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>LIVE STATUS KEY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-green)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-green)' }}></span>
              Green: On Time (0 - 3m)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-yellow)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-yellow)' }}></span>
              Yellow: Minor Delay (3 - 10m)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-orange)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-orange)' }}></span>
              Orange: Moderate Delay (10 - 25m)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-red)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-red)' }}></span>
              Red: Critical Delay (&gt; 25m)
            </div>
          </div>

          {/* SVG Map */}
          <svg viewBox="0 0 960 520" style={{ width: '100%', height: '100%', minHeight: '520px' }}>
            <defs>
              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Grid background lines */}
            <g stroke="var(--svg-grid)" strokeWidth="0.8">
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`gx-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="520" strokeDasharray="3 3" />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`gy-${i}`} x1="0" y1={i * 90} x2="960" y2={i * 90} strokeDasharray="3 3" />
              ))}
            </g>

            {/* Main Trunk Railway Line */}
            <path
              d="M 880 70 L 740 130 L 700 160 L 620 200 L 540 230 L 470 260 L 400 290 L 340 320 L 300 345 L 260 365 L 210 395 L 170 420 L 130 445 L 90 465"
              fill="none"
              stroke="var(--svg-track)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Active Signal Aspect Overlay */}
            <path
              d="M 880 70 L 740 130 L 700 160 L 620 200 L 540 230 L 470 260 L 400 290 L 340 320 L 300 345 L 260 365 L 210 395 L 170 420 L 130 445 L 90 465"
              fill="none"
              stroke="url(#trackGrad)"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Branch line: VSKP -> SC branch */}
            <path
              d="M 340 320 L 80 220"
              fill="none"
              stroke="var(--svg-track)"
              strokeWidth="4"
              strokeDasharray="4 4"
            />
            <text x="180" y="260" fill="var(--text-muted)" fontSize="10" transform="rotate(-20, 180, 260)">
              VSKP - SC Corridor (698 KM)
            </text>

            {/* Branch line: BZA -> MAS trunk */}
            <path
              d="M 90 465 L 60 490"
              fill="none"
              stroke="var(--svg-track)"
              strokeWidth="4"
            />

            {/* Stations */}
            {stations.map(st => {
              const pos = getStationCanvasCoords(st.code);
              return (
                <g key={st.code} style={{ cursor: 'pointer' }}>
                  <circle cx={pos.x} cy={pos.y} r="6" fill="var(--bg-surface)" stroke="var(--color-cyan)" strokeWidth="2" />
                  <circle cx={pos.x} cy={pos.y} r="2.5" fill="var(--color-cyan)" />
                  <text
                    x={pos.x + 8}
                    y={pos.y - 8}
                    fill="var(--svg-station-text)"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="Inter"
                  >
                    {st.code}
                  </text>
                  <text
                    x={pos.x + 8}
                    y={pos.y + 5}
                    fill="var(--text-muted)"
                    fontSize="8.5"
                    fontFamily="Inter"
                  >
                    {st.name.replace(' Junction', ' Jn')}
                  </text>
                </g>
              );
            })}

            {/* Animated Train Markers */}
            {filteredTrains.map(train => {
              const pos = getTrainCanvasCoords(train);
              const isSelected = activeTrain?.id === train.id;

              return (
                <g
                  key={train.id}
                  onClick={() => setActiveTrain(train)}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                  {/* Ping effect for active/delayed trains */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? "18" : "12"}
                    fill={train.statusColor}
                    fillOpacity={isSelected ? "0.35" : "0.15"}
                  />

                  {/* Train Body Badge */}
                  <rect
                    x={pos.x - 22}
                    y={pos.y - 12}
                    width="44"
                    height="24"
                    rx="6"
                    fill={isSelected ? 'var(--bg-surface)' : 'var(--bg-elevated)'}
                    stroke={isSelected ? 'var(--color-cyan)' : train.statusColor}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter="url(#glow)"
                  />

                  {/* Train Number */}
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="JetBrains Mono"
                  >
                    {train.id}
                  </text>

                  {/* Speed Pill underneath */}
                  <g transform={`translate(${pos.x - 30}, ${pos.y + 16})`}>
                    <rect width="60" height="15" rx="3" fill="var(--bg-surface)" fillOpacity="0.9" stroke="var(--border-subtle)" strokeWidth="0.8" />
                    <text x="30" y="11" textAnchor="middle" fill={train.statusColor} fontSize="8" fontWeight="700" fontFamily="JetBrains Mono">
                      {train.speedKmH} km/h
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
        )}

        {/* Slide-out Train Telemetry Detail Panel */}
        {activeTrain && (
          <div className="control-card control-card-glow-cyan" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #1e2e4f', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                    Train #{activeTrain.id}
                  </span>
                  <span className={`badge-status ${
                    activeTrain.status === 'ON_TIME' ? 'badge-on-time' :
                    activeTrain.status === 'MINOR_DELAY' ? 'badge-minor-delay' :
                    activeTrain.status === 'MODERATE_DELAY' ? 'badge-moderate-delay' : 'badge-critical-delay'
                  }`}>
                    {activeTrain.statusText}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                  {activeTrain.name}
                </div>
              </div>
            </div>

            {/* Core Telemetry Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#131c33', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e2e4f' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} color="#f97316" /> Current Live Delay
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: activeTrain.currentDelayMin > 0 ? '#fb923c' : '#34d399', fontFamily: 'JetBrains Mono' }}>
                  {activeTrain.currentDelayMin > 0 ? `+${activeTrain.currentDelayMin} min` : '0 min (On Time)'}
                </div>
              </div>

              <div style={{ background: '#131c33', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e2e4f' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Gauge size={13} color="#06b6d4" /> Current Speed
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                  {activeTrain.speedKmH} <span style={{ fontSize: '0.8rem' }}>km/h</span>
                </div>
              </div>

              <div style={{ background: '#131c33', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e2e4f' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Cpu size={13} color="#10b981" /> Predicted Dest Delay
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  +{activeTrain.predictedDestDelayMin || 19} min
                </div>
              </div>

              <div style={{ background: '#131c33', padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e2e4f' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={13} color="#10b981" /> Model Confidence
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                  {activeTrain.confidencePercent || 91.4}%
                </div>
              </div>
            </div>

            {/* Next Station Dynamic ETA Breakdown Box */}
            <div style={{
              background: '#0d1933',
              border: '1px solid #1e3a8a',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Next Station Arrival Intelligence
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Next Station:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  {activeTrain.nextStationName} ({activeTrain.nextStation})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Scheduled Arrival:</span>
                <span style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>
                  {activeTrain.scheduledNextArrival}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>RailPulse Predicted Arrival:</span>
                <span style={{ fontSize: '1.05rem', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#10b981' }}>
                  {activeTrain.predictedNextArrival}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e2e4f', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>GPS Block Position:</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {activeTrain.currentLocationName}
                </span>
              </div>
            </div>

            {/* Why This ETA? Explainability Factor Card */}
            <div style={{
              background: '#0a1628',
              border: '1px solid #0284c7',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Cpu size={14} color="#06b6d4" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Explainable AI: Why This ETA?
                  </span>
                </div>
                <button
                  onClick={() => setShowWhyEta(!showWhyEta)}
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: '4px',
                    padding: '0.2rem 0.5rem',
                    color: '#38bdf8',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {showWhyEta ? 'Hide Factors ▲' : 'View Factors ▼'}
                </button>
              </div>

              {showWhyEta ? (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid #1e2e4f', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Section Congestion (CHE-VZM)</span>
                    <span style={{ color: '#f97316', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>+3.2 min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid #1e2e4f', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Station Dwell Overrun (BAM)</span>
                    <span style={{ color: '#f97316', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>+1.8 min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid #1e2e4f', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Speed Recovery Adjustment</span>
                    <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>-2.1 min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', paddingTop: '0.2rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Cumulative Delay Forecast:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
                      +{activeTrain.predictedDestDelayMin || 19} min net
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  Top driver: Section track congestion (+3.2m), offset by green-wave speed recovery (-2.1m).
                </p>
              )}
            </div>

            {/* Rolling Stock & Loco Specs */}
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.25rem', padding: '0.5rem 0.75rem', background: '#10192e', borderRadius: '8px' }}>
              <div><strong style={{ color: '#cbd5e1' }}>Rake:</strong> {activeTrain.rakeType} | <strong style={{ color: '#cbd5e1' }}>Loco:</strong> {activeTrain.locoType}</div>
              <div><strong style={{ color: '#cbd5e1' }}>Passengers Onboard:</strong> ~{activeTrain.passengersOnboard}</div>
            </div>

            {/* Direct Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              <button
                onClick={() => onNavigateTab('eta', activeTrain.id)}
                className="btn-cyan"
                style={{ fontSize: '0.75rem', justifyContent: 'center' }}
              >
                <Cpu size={14} /> Full ETA Analysis
              </button>
              <button
                onClick={() => onNavigateTab('propagation')}
                className="btn-primary"
                style={{ fontSize: '0.75rem', justifyContent: 'center' }}
              >
                <span>Delay Propagation &rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
