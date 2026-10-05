import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Radio,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { api } from '../services/api';

interface StationDisplayBoardProps {
  initialStationCode?: string;
  onNavigateTab?: (tab: string, trainId?: string) => void;
}

const STATIONS_LIST = [
  { code: 'VSKP', name: 'Visakhapatnam Jn', telugu: 'విశాఖపట్నం జంక్షన్', hindi: 'विशाखापट्टनम जंक्शन' },
  { code: 'DVD', name: 'Duvvada', telugu: 'దువ్వాడ', hindi: 'दुవ్వాడ' },
  { code: 'SCM', name: 'Simhachalam', telugu: 'సింహాచలం', hindi: 'सिंहाचलम' },
  { code: 'VZM', name: 'Vizianagaram Jn', telugu: 'విజయనగరం జంక్షన్', hindi: 'विजयनगरम जंक्शन' },
  { code: 'CHE', name: 'Srikakulam Road', telugu: 'శ్రీకాకుళం రోడ్', hindi: 'श्रीकाकुलम रोड' },
  { code: 'RJY', name: 'Rajahmundry', telugu: 'రాజమండ్రి', hindi: 'राजमहेन्द्री' },
  { code: 'TDD', name: 'Tadepalligudem', telugu: 'తాడేపల్లిగూడెం', hindi: 'ताडेपल्लीगुडेम' },
  { code: 'BZA', name: 'Vijayawada Jn', telugu: 'విజయవాడ జంక్షన్', hindi: 'विजयवाड़ा जंक्शन' },
  { code: 'KGP', name: 'Kharagpur Jn', telugu: 'ఖరగ్‌పూర్ జంక్షన్', hindi: 'खड़गपुर जंक्शन' },
  { code: 'NDLS', name: 'New Delhi', telugu: 'న్యూఢిల్లీ', hindi: 'नई दिल्ली' },
  { code: 'HYB', name: 'Hyderabad Deccan', telugu: 'హైదరాబాద్ డెక్కన్', hindi: 'हैदराबाद डेक्कन' },
  { code: 'SC', name: 'Secunderabad Jn', telugu: 'సికింద్రాబాద్ జంక్షన్', hindi: 'सिकंदराबाद जंक्शन' }
];

const MULTILINGUAL_HEADERS = [
  {
    lang: 'ENGLISH',
    titleSuffix: 'TRAIN ARRIVAL & DEPARTURE DISPLAY BOARD',
    colTrainNo: 'TRAIN NO',
    colTrainName: 'TRAIN NAME',
    colFromTo: 'FROM / TO',
    colSchTime: 'SCH TIME',
    colExpTime: 'EXP TIME (RAILPULSE)',
    colBand: '80% BAND',
    colPlatform: 'PF',
    colStatus: 'STATUS',
    colFactor: 'AI ETA FACTOR',
    liveBadge: 'AI DYNAMIC FORECAST • LIVE WEBSOCKET'
  },
  {
    lang: 'TELUGU',
    titleSuffix: 'రైలు రాక మరియు బయలుదేరే సమయాల పట్టిక',
    colTrainNo: 'రైలు నం.',
    colTrainName: 'రైలు పేరు',
    colFromTo: 'ప్రారంభం / గమ్యం',
    colSchTime: 'సమయం',
    colExpTime: 'అంచనా సమయం (రైల్‌పల్స్)',
    colBand: '80% శ్రేణి',
    colPlatform: 'ప్లాట్‌ఫాం',
    colStatus: 'స్థితి',
    colFactor: 'కారణం / స్థితి',
    liveBadge: 'ప్రత్యక్ష రైలు సమాచార పట్టిక'
  },
  {
    lang: 'HINDI',
    titleSuffix: 'गाड़ी आगमन एवं प्रस्थान सूचना पट्ट',
    colTrainNo: 'गाड़ी संख्या',
    colTrainName: 'गाड़ी का नाम',
    colFromTo: 'कहाँ से / कहाँ तक',
    colSchTime: 'समय',
    colExpTime: 'अनुमानित समय (रेलपल्स)',
    colBand: '80% रेंज',
    colPlatform: 'प्लेटफ़ॉर्म',
    colStatus: 'स्थिति',
    colFactor: 'पूर्वानुमान कारक',
    liveBadge: 'एआई गतिशील आगमन पूर्वानुमान'
  }
];

export const StationDisplayBoard: React.FC<StationDisplayBoardProps> = ({
  initialStationCode = 'VSKP',
  onNavigateTab
}) => {
  const [stationCode, setStationCode] = useState<string>(initialStationCode.toUpperCase());
  const [boardData, setBoardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [langIndex, setLangIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [flashingRow, setFlashingRow] = useState<string | null>(null);
  const [isTickLoading, setIsTickLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const prevEtasRef = useRef<Record<string, string>>({});

  // Clock tick every second & "Updated X seconds ago"
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
      setSecondsAgo(Math.floor((Date.now() - lastUpdatedTime) / 1000));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [lastUpdatedTime]);

  // Trilingual rotation every 10 seconds
  useEffect(() => {
    const langInterval = setInterval(() => {
      setLangIndex(prev => (prev + 1) % MULTILINGUAL_HEADERS.length);
    }, 10000);
    return () => clearInterval(langInterval);
  }, []);

  // Fetch initial REST data
  const fetchBoardData = async (code: string) => {
    setLoading(true);
    try {
      const res = await api.getStationBoard(code);
      if (res && res.trains) {
        updateBoardState(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBoardState = (data: any) => {
    const trains = data.trains || data.board || [];
    
    // Check if any ETA changed to trigger flash highlight
    let changedTrainId: string | null = null;
    const newEtas: Record<string, string> = {};
    for (const t of trains) {
      const num = t.train_number || t.trainNumber;
      const exp = t.expected_time || t.predicted_arrival;
      newEtas[num] = exp;
      if (prevEtasRef.current[num] && prevEtasRef.current[num] !== exp) {
        changedTrainId = num;
      }
    }
    prevEtasRef.current = newEtas;

    setBoardData(data);
    setLastUpdatedTime(Date.now());
    setSecondsAgo(0);

    if (changedTrainId) {
      setFlashingRow(changedTrainId);
      setTimeout(() => setFlashingRow(null), 3000);
    }
  };

  // Setup WebSocket with fallback polling
  useEffect(() => {
    fetchBoardData(stationCode);

    // Setup station WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/stations/${stationCode}`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.board || payload.trains) {
            updateBoardState(payload);
          }
        } catch (err) {
          console.error('Error parsing station WS message', err);
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch (err) {
      setWsConnected(false);
    }

    // 30s Polling fallback
    const pollInterval = setInterval(() => {
      fetchBoardData(stationCode);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      if (ws) {
        ws.close();
      }
    };
  }, [stationCode]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error('Error attempting fullscreen', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen', err);
      });
      setIsFullscreen(false);
    }
  };

  // Simulate Tick Disturbance Button
  const handleSimulateTick = async () => {
    setIsTickLoading(true);
    try {
      await api.triggerTelemetryTick();
      // Refetch immediately to capture the event
      await fetchBoardData(stationCode);
    } finally {
      setIsTickLoading(false);
    }
  };

  const currentHeaders = MULTILINGUAL_HEADERS[langIndex];
  const activeStation = STATIONS_LIST.find(s => s.code === stationCode) || {
    code: stationCode,
    name: boardData?.station_name || `${stationCode} Junction`,
    telugu: `${stationCode} జంక్షన్`,
    hindi: `${stationCode} जंक्शन`
  };

  const stationDisplayName = langIndex === 1
    ? activeStation.telugu
    : langIndex === 2
    ? activeStation.hindi
    : activeStation.name.toUpperCase();

  const trainsList = boardData?.trains || boardData?.board || [];

  return (
    <div
      ref={containerRef}
      style={{
        background: '#040711',
        minHeight: '100vh',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        padding: isFullscreen ? '1.5rem' : '1.25rem',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Navigation & Controls Bar (Hidden or Compact in Fullscreen) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem',
        background: '#0b1120',
        padding: '0.65rem 1.25rem',
        borderRadius: '10px',
        border: '1px solid #1e293b'
      }}>
        {/* Left: Station Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tv size={20} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
              STATION DISPLAY BOARD
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Select Station:</span>
            <select
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
              style={{
                background: '#131d33',
                border: '1px solid #38bdf8',
                color: '#f8fafc',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'JetBrains Mono',
                cursor: 'pointer'
              }}
            >
              {STATIONS_LIST.map(st => (
                <option key={st.code} value={st.code}>
                  {st.code} — {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Controls, Live Status, Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* WebSocket / Polling Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: wsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${wsConnected ? '#10b981' : '#f59e0b'}`,
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: wsConnected ? '#34d399' : '#fbbf24'
          }}>
            <Radio size={12} className={wsConnected ? 'animate-pulse' : ''} />
            <span>{wsConnected ? 'LIVE WEBSOCKET' : 'POLLING 30s'}</span>
          </div>

          {/* Seconds Ago Counter */}
          <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
            Updated {secondsAgo}s ago
          </div>

          {/* Simulate Tick Quick Injector */}
          <button
            onClick={handleSimulateTick}
            disabled={isTickLoading}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            title="Inject +6m congestion disturbance on VSKP–VZM"
          >
            <RefreshCw size={12} className={isTickLoading ? 'animate-spin' : ''} />
            <span>Simulate Tick</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#f8fafc',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Real Indian Railways Dark Station Board Container */}
      <div style={{
        background: '#070c18',
        border: '3px solid #1e2d4d',
        borderRadius: '12px',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Board Header Banner */}
        <div style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          borderBottom: '3px solid #38bdf8',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Station Title */}
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: '#38bdf8',
              fontFamily: 'JetBrains Mono',
              letterSpacing: '0.1em',
              fontWeight: 700
            }}>
              INDIAN RAILWAYS • {currentHeaders.liveBadge}
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#fbbf24',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(251, 191, 36, 0.4)'
            }}>
              {stationDisplayName} — {currentHeaders.titleSuffix}
            </div>
          </div>

          {/* Live Digital Clock */}
          <div style={{
            background: '#020617',
            border: '2px solid #38bdf8',
            borderRadius: '8px',
            padding: '0.4rem 1rem',
            textAlign: 'right',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
          }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              INDIAN STANDARD TIME (IST)
            </div>
            <div style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              color: '#38bdf8',
              fontFamily: 'JetBrains Mono',
              letterSpacing: '0.08em'
            }}>
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
          </div>
        </div>

        {/* Trilingual Language Indicator Bar */}
        <div style={{
          background: '#0b1329',
          borderBottom: '1px solid #1e293b',
          padding: '0.35rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: langIndex === 0 ? '#38bdf8' : '#64748b', fontWeight: langIndex === 0 ? 800 : 500 }}>
              ● ENGLISH
            </span>
            <span style={{ color: langIndex === 1 ? '#38bdf8' : '#64748b', fontWeight: langIndex === 1 ? 800 : 500 }}>
              ● తెలుగు (TELUGU)
            </span>
            <span style={{ color: langIndex === 2 ? '#38bdf8' : '#64748b', fontWeight: langIndex === 2 ? 800 : 500 }}>
              ● हिन्दी (HINDI)
            </span>
          </div>
          <div style={{ color: '#64748b' }}>
            Rotating every 10s • Public Display API: <code style={{ color: '#38bdf8' }}>GET /api/stations/{stationCode}/board</code>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                background: '#0f172a',
                borderBottom: '2px solid #334155',
                color: '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '0.85rem 1rem' }}>{currentHeaders.colTrainNo}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{currentHeaders.colTrainName}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{currentHeaders.colFromTo}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{currentHeaders.colSchTime}</th>
                <th style={{ padding: '0.85rem 1rem', color: '#38bdf8' }}>{currentHeaders.colExpTime}</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{currentHeaders.colPlatform}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{currentHeaders.colStatus}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{currentHeaders.colFactor}</th>
              </tr>
            </thead>
            <tbody>
              {loading && trainsList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <div>Loading Station Arrival Board...</div>
                  </td>
                </tr>
              ) : trainsList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No scheduled arrivals found for station {stationCode}.
                  </td>
                </tr>
              ) : (
                trainsList.map((t: any, idx: number) => {
                  const tNum = t.train_number || t.trainNumber;
                  const isFlashing = flashingRow === tNum;
                  const delay = Number(t.delay_minutes ?? t.delayMinutes ?? 0);
                  const isVandeBharat = (t.train_type || t.trainType) === 'VANDE_BHARAT';

                  return (
                    <tr
                      key={tNum || idx}
                      onClick={() => onNavigateTab && onNavigateTab('tracking', tNum)}
                      style={{
                        background: isFlashing
                          ? 'rgba(6, 182, 212, 0.25)'
                          : idx % 2 === 0 ? '#070c18' : '#0b1122',
                        borderBottom: '1px solid #172033',
                        transition: 'background 0.3s ease',
                        cursor: onNavigateTab ? 'pointer' : 'default',
                        boxShadow: isFlashing ? 'inset 0 0 15px rgba(6, 182, 212, 0.5)' : 'none'
                      }}
                    >
                      {/* Train Number */}
                      <td style={{
                        padding: '1rem 1rem',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#fbbf24',
                        letterSpacing: '0.05em'
                      }}>
                        {tNum}
                      </td>

                      {/* Train Name */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#f8fafc',
                            letterSpacing: '0.02em'
                          }}>
                            {t.train_name || t.trainName}
                          </span>
                          {isVandeBharat && (
                            <span style={{
                              background: '#3b82f6',
                              color: '#ffffff',
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px'
                            }}>
                              VB
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {t.train_type || t.trainType || 'Superfast'}
                        </div>
                      </td>

                      {/* From / To */}
                      <td style={{
                        padding: '1rem 1rem',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.85rem',
                        color: '#cbd5e1',
                        fontWeight: 700
                      }}>
                        {t.from_to || t.fromTo || `${t.source} → ${t.destination}`}
                      </td>

                      {/* Scheduled Time */}
                      <td style={{
                        padding: '1rem 1rem',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.95rem',
                        color: '#94a3b8',
                        fontWeight: 700
                      }}>
                        {t.scheduled_time || t.scheduledTime || t.scheduled_arrival || '--:--'}
                      </td>

                      {/* RailPulse Expected Time + 80% Band */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          color: '#38bdf8',
                          letterSpacing: '0.03em',
                          textShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
                        }}>
                          {t.expected_time || t.expectedTime || t.predicted_arrival || '--:--'}
                        </div>
                        <div style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: '0.675rem',
                          color: '#64748b',
                          marginTop: '2px'
                        }}>
                          80% band: <strong style={{ color: '#a5b4fc' }}>{t.confidence_band_text || t.confidenceBandText || `[${t.confidence_interval_low || '--'} – ${t.confidence_interval_high || '--'}]`}</strong>
                        </div>
                      </td>

                      {/* Platform */}
                      <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block',
                          background: '#f59e0b',
                          color: '#000000',
                          fontWeight: 900,
                          fontFamily: 'JetBrains Mono',
                          fontSize: '1.05rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '6px',
                          boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
                        }}>
                          {t.platform || '1'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          background: delay <= 2 ? 'rgba(16, 185, 129, 0.2)' :
                                     delay < 15 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          border: `1px solid ${delay <= 2 ? '#10b981' : delay < 15 ? '#f59e0b' : '#ef4444'}`,
                          color: delay <= 2 ? '#34d399' : delay < 15 ? '#fbbf24' : '#f87171',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                          fontFamily: 'JetBrains Mono'
                        }}>
                          {t.status || (delay <= 2 ? 'On time' : `Late by ${Math.round(delay)} min`)}
                        </span>
                      </td>

                      {/* SHAP Primary Cause Factor */}
                      <td style={{ padding: '1rem 1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={12} color="#38bdf8" />
                          <span style={{ color: '#cbd5e1' }}>
                            {t.shap_primary_factor || 'Optimal track adhesion & signal clearance'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Board Footer Notice */}
        <div style={{
          background: '#040711',
          borderTop: '2px solid #1e293b',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.725rem',
          color: '#64748b'
        }}>
          <div>
            * RailPulse Dynamic ETA is calculated via XGBoost machine learning using real-time GPS, section congestion, and track condition parameters.
          </div>
          <div style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
            Team Ignites (ID 144678) • SIH 2026 Prototype
          </div>
        </div>
      </div>
    </div>
  );
};
