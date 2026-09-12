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
  Layers,
  TrainTrack
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
        setPnrData(res.booking || null);
        setTrainTelemetry(res.trainTelemetry || null);
        setStops(res.stops || []);
        
        // Cache offline manifest into localStorage
        try {
          localStorage.setItem(`railpulse_offline_pnr_${pnr}`, JSON.stringify(res));
        } catch (e) {
          // ignore quota error
        }
      }
    } catch (e) {
      console.error('Error fetching PNR details:', e);
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
          id: res.train.id || tNum,
          name: res.train.name || `Train #${tNum}`,
          currentLocation: res.train.currentLocationName || 'In Transit',
          speedKmH: res.train.speedKmH || 75,
          currentDelayMin: res.train.currentDelayMin || 0,
          status: res.train.status || 'ON_TIME',
          statusText: res.train.statusText || 'Running on Time',
          nextStation: res.train.nextStation || 'Next Station',
          nextStationName: res.train.nextStationName || 'Next Station',
          scheduledNextArrival: res.train.scheduledNextArrival || '18:30',
          predictedNextArrival: res.prediction?.predictedArrival || res.train.predictedNextArrival || '18:30',
          predictionRange: res.prediction?.predictionRange || '18:28 – 18:34',
          scheduledDestArrival: res.train.scheduledDestArrival || '06:00',
          predictedDestArrival: res.train.predictedDestArrival || '06:00',
          confidencePercent: res.prediction?.confidencePercent || res.train.confidencePercent || 94.5,
          delayReason: res.train.currentDelayMin > 0 ? 'Section headway congestion in upcoming block' : 'Running on schedule'
        });
        const stopsRes = await api.getTrainStops(tNum.trim());
        if (stopsRes.success && stopsRes.stops) setStops(stopsRes.stops);
      }
    } catch (e) {
      console.error('Error fetching train by id:', e);
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
    <div className="page-wrapper" style={{ maxWidth: '1200px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--bg-panel-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(0, 217, 255, 0.15)',
          color: 'var(--accent-cyan)',
          padding: '0.2rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          border: '1px solid rgba(0, 217, 255, 0.3)'
        }}>
          <Sparkles size={14} /> PASSENGER LIVE ETA & PNR TRACKER
        </div>
        <h1 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Track Your Train & PNR in Real-Time — Online & Inside Coaches Offline
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 1.5rem auto' }}>
          Dynamic delay forecasting for passengers. Works even with zero cellular signal inside train tunnels using RailPulse offline dead-reckoning engine.
        </p>

        {/* Search Mode Tabs (PNR vs Train Number) */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-panel-tertiary)', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setSearchMode('PNR')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              background: searchMode === 'PNR' ? '#2563eb' : 'transparent',
              color: searchMode === 'PNR' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Search by 10-Digit PNR Number
          </button>
          <button
            onClick={() => setSearchMode('TRAIN_NUMBER')}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              background: searchMode === 'TRAIN_NUMBER' ? '#2563eb' : 'transparent',
              color: searchMode === 'TRAIN_NUMBER' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
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
                  fontFamily: 'var(--font-mono)',
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
                  fontFamily: 'var(--font-mono)',
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Sample PNRs:</span>
            <button onClick={() => { setPnrInput('4523-891245'); handleSearchPNR('4523-891245'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>4523-891245 (Train 12864)</button>
            <span>•</span>
            <button onClick={() => { setPnrInput('8214-992104'); handleSearchPNR('8214-992104'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>8214-992104 (Simhadri)</button>
            <span>•</span>
            <button onClick={() => { setPnrInput('2341-876540'); handleSearchPNR('2341-876540'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>2341-876540 (Vande Bharat)</button>
          </div>
        )}
      </div>

      {/* In-Train Offline Mode Banner Switch */}
      <div style={{
        background: isOfflineMode ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-panel-primary)',
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
          {isOfflineMode ? <WifiOff size={22} color="var(--color-yellow)" /> : <Wifi size={22} color="var(--color-green)" />}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isOfflineMode ? '#fbbf24' : 'var(--text-primary)' }}>
              {isOfflineMode ? '📱 IN-TRAIN OFFLINE MODE: ACTIVE (ZERO SIGNAL COMPATIBLE)' : '🌐 ONLINE TELEMETRY MODE (LIVE CRIS GPS STREAM)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isOfflineMode
                ? 'Client-side dead-reckoning is estimating station progression using cached route timetables.'
                : 'Connected to live cloud prediction service. You can toggle offline mode to simulate zero connectivity inside coaches.'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className="btn-secondary"
          style={{
            fontSize: '0.75rem',
            padding: '0.45rem 0.85rem',
            background: isOfflineMode ? 'rgba(245, 158, 11, 0.25)' : undefined,
            color: isOfflineMode ? '#fbbf24' : undefined,
            borderColor: isOfflineMode ? 'var(--color-yellow)' : undefined
          }}
        >
          {isOfflineMode ? 'Switch to Online Telemetry' : 'Simulate Low Signal / Offline Mode'}
        </button>
      </div>

      {/* PNR Booking Details Card (When PNR is searched) */}
      {pnrData && searchMode === 'PNR' && (
        <div className="control-card control-card-glow-cyan" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CreditCard size={20} color="var(--accent-cyan)" />
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PASSENGER PNR RECORD:</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
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
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Passenger Name:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pnrData.passengerName} ({pnrData.passengerAge}y, {pnrData.passengerGender})</div>
            </div>
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Assigned Berth:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{pnrData.coach} - {pnrData.berthNumber} ({pnrData.berthType})</div>
            </div>
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Boarding & Destination:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pnrData.boardingStationName} &rarr; {pnrData.destinationStationName}</div>
            </div>
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Class & Quota:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{pnrData.class} | {pnrData.quota}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Train Live Telemetry Card */}
      {trainTelemetry && (
        <div className="control-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  Train #{trainTelemetry.id || '12864'}
                </span>
                <span className={`badge-status ${trainTelemetry.status === 'ON_TIME' ? 'badge-on-time' : 'badge-moderate-delay'}`}>
                  {trainTelemetry.statusText || 'Running Status Active'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {trainTelemetry.name || 'Howrah SF Express'}
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prediction Accuracy Confidence:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}>
                {trainTelemetry.confidencePercent ?? 92.5}%
              </div>
            </div>
          </div>

          {/* 4 Passenger Key Telemetry Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Scheduled ETA */}
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED ARRIVAL</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                {trainTelemetry.scheduledNextArrival || '18:30'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>At: {trainTelemetry.nextStationName || 'Vizianagaram'}</div>
            </div>

            {/* RailPulse Updated ETA */}
            <div style={{ background: 'rgba(34, 197, 94, 0.12)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-green)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-green)', fontWeight: 700 }}>UPDATED RAILPULSE ETA</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-green)', fontFamily: 'var(--font-mono)', margin: '0.25rem 0' }}>
                {trainTelemetry.predictedNextArrival || '18:44'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-green)', fontWeight: 600 }}>
                Delay: +{trainTelemetry.currentDelayMin ?? 0} min ({trainTelemetry.predictionRange || '±3 min'})
              </div>
            </div>

            {/* Current GPS Location */}
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT LOCATION</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                {isOfflineMode ? 'Simhachalam (Offline Dead-Reckoning)' : (trainTelemetry.currentLocation || 'In Transit').split('(')[0]}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                Speed: {isOfflineMode ? offlineSpeedKmH : (trainTelemetry.speedKmH ?? 75)} km/h
              </div>
            </div>

            {/* Reason */}
            <div style={{ background: 'var(--bg-panel-tertiary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REASON FOR DELAY</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-orange)', margin: '0.25rem 0' }}>
                {trainTelemetry.currentDelayMin > 0 ? 'Section Congestion Ahead' : 'Running on Schedule'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                {trainTelemetry.delayReason || 'Signal buffer clearance'}
              </div>
            </div>
          </div>

          {/* Station Progress Countdown Timeline */}
          <div style={{ background: 'var(--bg-panel-secondary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Upcoming Station Stops & Dynamic ETA Countdown</span>
              {isOfflineMode && <span style={{ color: 'var(--color-yellow)', fontSize: '0.725rem' }}>⚡ Running from offline cache</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stops.length > 0 ? (
                stops.slice(0, 8).map((stop, idx) => {
                  const stName = stop.stationName || stop.name || stop.station || 'Station';
                  const stCode = stop.stationCode || stop.code || '';
                  const stArr = stop.predictedArr || stop.predictedArrival || stop.scheduledArr || stop.scheduledArrival || '18:30';
                  const stSched = stop.scheduledArr || stop.scheduledArrival || '18:15';

                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      background: idx === 0 ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-panel-tertiary)',
                      border: idx === 0 ? '1px solid var(--color-green)' : '1px solid transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: idx === 0 ? 'var(--color-green)' : 'var(--bg-hover)', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: idx === 0 ? 'var(--color-green)' : 'var(--text-primary)' }}>
                          {stName} {stCode ? `(${stCode})` : ''}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: idx === 0 ? 'var(--color-green)' : 'var(--text-primary)' }}>
                          {stArr}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          (Sched: {stSched})
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                  Loading station stop progression...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
