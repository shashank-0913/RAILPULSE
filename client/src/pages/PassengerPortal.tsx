import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Radio,
  Send,
  Bell,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Wifi,
  WifiOff,
  Compass,
  Gauge,
  Layers
} from 'lucide-react';
import { Train, PNRRecord } from '../types';
import { api } from '../services/api';

export const PassengerPortal: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'PNR' | 'TRAIN_NUMBER'>('PNR');
  const [pnrInput, setPnrInput] = useState('4523-891245');
  const [trainNumberInput, setTrainNumberInput] = useState('12864');
  
  const [pnrData, setPnrData] = useState<PNRRecord | null>(null);
  const [trainTelemetry, setTrainTelemetry] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // In-Train Offline Dead-Reckoning Mode
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineProgressKm, setOfflineProgressKm] = useState<number>(842);
  const [offlineSpeedKmH, setOfflineSpeedKmH] = useState<number>(76);
  const [offlineNextEtaMin, setOfflineNextEtaMin] = useState<number>(11);

  // Search by PNR
  const handleSearchPNR = async (pnr = pnrInput) => {
    setLoading(true);
    try {
      const res = await api.getPNRDetails(pnr.trim());
      if (res.success) {
        setPnrData(res.booking);
        setTrainTelemetry(res.trainTelemetry);
        setStops(res.stops || []);
        
        // Cache offline manifest into localStorage
        localStorage.setItem(`railpulse_offline_pnr_${pnr}`, JSON.stringify(res));
      }
    } finally {
      setLoading(false);
    }
  };

  // Search by Train Number
  const handleSearchTrain = async (tNum = trainNumberInput) => {
    setLoading(true);
    try {
      const res = await api.getTrainById(tNum.trim());
      if (res.success && res.train) {
        setTrainTelemetry({
          id: res.train.id,
          name: res.train.name,
          currentLocation: res.train.currentLocationName,
          speedKmH: res.train.speedKmH,
          currentDelayMin: res.train.currentDelayMin,
          status: res.train.status,
          statusText: res.train.statusText,
          nextStation: res.train.nextStation,
          nextStationName: res.train.nextStationName,
          scheduledNextArrival: res.train.scheduledNextArrival,
          predictedNextArrival: res.prediction?.predictedArrival || res.train.predictedNextArrival,
          predictionRange: res.prediction?.predictionRange || '18:39 – 18:46',
          scheduledDestArrival: res.train.scheduledDestArrival,
          predictedDestArrival: res.train.predictedDestArrival,
          confidencePercent: res.prediction?.confidencePercent || res.train.confidencePercent,
          delayReason: res.train.currentDelayMin > 0 ? 'Congestion and headway speed limits in upcoming section' : 'Running on schedule'
        });
        const stopsRes = await api.getTrainStops(tNum.trim());
        if (stopsRes.success) setStops(stopsRes.stops);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearchPNR('4523-891245');
  }, []);

  // Offline Dead-Reckoning simulation timer
  useEffect(() => {
    let timer: any;
    if (isOfflineMode) {
      timer = setInterval(() => {
        setOfflineProgressKm(prev => prev + 0.1);
        setOfflineNextEtaMin(prev => Math.max(1, prev - 0.1));
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isOfflineMode]);

  return (
    <div className="page-wrapper" style={{ maxWidth: '1100px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-cyan-glow)', color: 'var(--color-cyan)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> PASSENGER LIVE ETA & PNR TRACKER
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Track Your Train & PNR in Real-Time — Online & Inside Coaches Offline
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 1.5rem auto' }}>
          Dynamic delay forecasting for passengers. Works even with zero cellular signal inside train tunnels using RailPulse offline dead-reckoning engine.
        </p>

        {/* Search Mode Tabs (PNR vs Train Number) */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setSearchMode('PNR')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              background: searchMode === 'PNR' ? 'var(--color-green)' : 'transparent',
              color: searchMode === 'PNR' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Search by 10-Digit PNR Number
          </button>
          <button
            onClick={() => setSearchMode('TRAIN_NUMBER')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              background: searchMode === 'TRAIN_NUMBER' ? 'var(--color-green)' : 'transparent',
              color: searchMode === 'TRAIN_NUMBER' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Search by Train Number
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            {searchMode === 'PNR' ? (
              <input
                type="text"
                value={pnrInput}
                onChange={e => setPnrInput(e.target.value)}
                placeholder="Enter 10-digit PNR (e.g. 4523-891245)..."
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.75rem 0.65rem 2.6rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontFamily: 'JetBrains Mono',
                  outline: 'none'
                }}
              />
            ) : (
              <input
                type="text"
                value={trainNumberInput}
                onChange={e => setTrainNumberInput(e.target.value)}
                placeholder="Enter 5-digit Train # (e.g. 12864, 17240)..."
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.75rem 0.65rem 2.6rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontFamily: 'JetBrains Mono',
                  outline: 'none'
                }}
              />
            )}
          </div>
          <button
            onClick={() => (searchMode === 'PNR' ? handleSearchPNR() : handleSearchTrain())}
            disabled={loading}
            className="btn-primary"
            style={{ borderRadius: '10px', padding: '0.65rem 1.25rem' }}
          >
            {searchMode === 'PNR' ? 'Fetch PNR & ETA' : 'Track Train'}
          </button>
        </div>

        {/* Quick Sample PNR buttons */}
        {searchMode === 'PNR' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Sample PNRs:</span>
            <button onClick={() => { setPnrInput('4523-891245'); handleSearchPNR('4523-891245'); }} style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>4523-891245 (Train 12864)</button>
            <span>•</span>
            <button onClick={() => { setPnrInput('8214-992104'); handleSearchPNR('8214-992104'); }} style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>8214-992104 (Simhadri)</button>
            <span>•</span>
            <button onClick={() => { setPnrInput('2341-876540'); handleSearchPNR('2341-876540'); }} style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>2341-876540 (Vande Bharat)</button>
          </div>
        )}
      </div>

      {/* In-Train Offline Mode Banner Switch */}
      <div style={{
        background: isOfflineMode ? 'var(--color-yellow-glow)' : 'var(--bg-surface)',
        border: isOfflineMode ? '1px solid var(--color-yellow)' : '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isOfflineMode ? <WifiOff size={22} color="#f59e0b" /> : <Wifi size={22} color="#10b981" />}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isOfflineMode ? '#fbbf24' : '#f8fafc' }}>
              {isOfflineMode ? '📱 IN-TRAIN OFFLINE MODE: ACTIVE (ZERO SIGNAL COMPATIBLE)' : '🌐 ONLINE TELEMETRY MODE (LIVE CRIS GPS STREAM)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isOfflineMode
                ? 'Client-side dead-reckoning is estimating station progression using cached route timetables.'
                : 'Connected to live cloud prediction service. You can toggle offline mode to simulate zero connectivity inside coaches.'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: isOfflineMode ? '1px solid #f59e0b' : '1px solid #1e2e4f',
            background: isOfflineMode ? '#f59e0b' : '#131c33',
            color: isOfflineMode ? '#000000' : '#38bdf8',
            cursor: 'pointer'
          }}
        >
          {isOfflineMode ? 'Switch to Online Telemetry' : 'Simulate Low Signal / Offline Mode'}
        </button>
      </div>

      {/* PNR Booking Details Card (When PNR is searched) */}
      {pnrData && searchMode === 'PNR' && (
        <div className="control-card control-card-glow-cyan" style={{ marginBottom: '1.25rem', padding: '1.25rem', background: '#0a1424' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e2e4f', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CreditCard size={20} color="#38bdf8" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>PASSENGER PNR RECORD:</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  {pnrData.pnr}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-status badge-on-time">{pnrData.bookingStatus}</span>
              <span className="badge-status badge-ai-intel">Coach {pnrData.coach} / Berth {pnrData.berthNumber}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ background: '#10192e', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Passenger Name:</span>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{pnrData.passengerName} ({pnrData.passengerAge}y, {pnrData.passengerGender})</div>
            </div>
            <div style={{ background: '#10192e', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Assigned Berth:</span>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{pnrData.coach} - {pnrData.berthNumber} ({pnrData.berthType})</div>
            </div>
            <div style={{ background: '#10192e', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Boarding & Destination:</span>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{pnrData.boardingStationName} &rarr; {pnrData.destinationStationName}</div>
            </div>
            <div style={{ background: '#10192e', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Class & Quota:</span>
              <div style={{ fontWeight: 700, color: '#cbd5e1' }}>{pnrData.class} | {pnrData.quota}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Train Live Telemetry Card */}
      {trainTelemetry && (
        <div className="control-card" style={{ padding: '1.5rem', background: '#0d1527', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e2e4f', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  Train #{trainTelemetry.id}
                </span>
                <span className={`badge-status ${trainTelemetry.status === 'ON_TIME' ? 'badge-on-time' : 'badge-moderate-delay'}`}>
                  {trainTelemetry.statusText}
                </span>
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                {trainTelemetry.name}
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Prediction Accuracy Confidence:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                {trainTelemetry.confidencePercent}%
              </div>
            </div>
          </div>

          {/* 4 Passenger Key Telemetry Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Scheduled ETA */}
            <div style={{ background: '#131c33', padding: '1rem', borderRadius: '10px', border: '1px solid #1e2e4f' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SCHEDULED ARRIVAL</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#cbd5e1', fontFamily: 'JetBrains Mono', margin: '0.25rem 0' }}>
                {trainTelemetry.scheduledNextArrival}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>At: {trainTelemetry.nextStationName}</div>
            </div>

            {/* RailPulse Updated ETA */}
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '1rem', borderRadius: '10px', border: '1px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>UPDATED RAILPULSE ETA</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '0.25rem 0' }}>
                {trainTelemetry.predictedNextArrival}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#34d399', fontWeight: 600 }}>
                Delay: +{trainTelemetry.currentDelayMin} min ({trainTelemetry.predictionRange})
              </div>
            </div>

            {/* Current GPS Location */}
            <div style={{ background: '#131c33', padding: '1rem', borderRadius: '10px', border: '1px solid #1e2e4f' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CURRENT LOCATION</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0.25rem 0' }}>
                {isOfflineMode ? 'Simhachalam (Offline Dead-Reckoning)' : trainTelemetry.currentLocation.split('(')[0]}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                Speed: {isOfflineMode ? offlineSpeedKmH : trainTelemetry.speedKmH} km/h
              </div>
            </div>

            {/* Plain English Reason */}
            <div style={{ background: '#131c33', padding: '1rem', borderRadius: '10px', border: '1px solid #1e2e4f' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>REASON FOR DELAY</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fb923c', margin: '0.25rem 0' }}>
                Section Congestion Ahead
              </div>
              <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>
                {trainTelemetry.delayReason}
              </div>
            </div>
          </div>

          {/* Station Progress Countdown Timeline */}
          <div style={{ background: '#10192e', padding: '1rem', borderRadius: '10px', border: '1px solid #1c2a47' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Upcoming Station Stops & Dynamic ETA Countdown</span>
              {isOfflineMode && <span style={{ color: '#f59e0b', fontSize: '0.725rem' }}>⚡ Running from offline cache</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stops.slice(5).map((stop, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  background: idx === 0 ? 'rgba(16, 185, 129, 0.15)' : '#131c33',
                  border: idx === 0 ? '1px solid #10b981' : '1px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: idx === 0 ? '#10b981' : '#1e2e4f', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: idx === 0 ? '#34d399' : '#f8fafc' }}>
                      {stop.stationName} ({stop.stationCode})
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: idx === 0 ? '#10b981' : '#cbd5e1' }}>
                      {stop.predictedArr || stop.scheduledArr}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                      (Sched: {stop.scheduledArr})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
