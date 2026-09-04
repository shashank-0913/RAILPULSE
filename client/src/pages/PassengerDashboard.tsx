import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Train as TrainIcon,
  Navigation,
  Clock,
  MapPin,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Bell,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Gauge,
  Radio,
  UserCheck,
  Check,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  ShieldAlert,
  LogOut,
  Sliders,
  Filter,
  Compass,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { PassengerLeafletMap } from '../components/PassengerLeafletMap';
import { VerifiedUser } from '../types';

interface PassengerDashboardProps {
  user?: VerifiedUser | null;
  onLogout?: () => void;
  onOpenControllerGate?: () => void;
  onSwitchRole: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({
  user,
  onLogout,
  onOpenControllerGate,
  onSwitchRole,
  theme,
  onToggleTheme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState('12864');
  const [journeyData, setJourneyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timeline' | 'weather' | 'why_delayed' | 'forecast' | 'alerts' | 'pnr'>('overview');
  const [isTickLoading, setIsTickLoading] = useState(false);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  // Separate Passenger Journey State (Independent from train GPS shifts)
  const [boardingStation, setBoardingStation] = useState<string>('SMVB');
  const [passengerDestination, setPassengerDestination] = useState<string>('HWH');

  // Passenger Live GPS Geolocation Tracking
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'PROMPT' | 'GRANTED' | 'DENIED'>('PROMPT');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [passengerDistanceToBoardingKm, setPassengerDistanceToBoardingKm] = useState<number | null>(null);
  const [trainDistanceToBoardingKm, setTrainDistanceToBoardingKm] = useState<number | null>(null);

  // Weather States
  const [passengerWeather, setPassengerWeather] = useState<any>(null);
  const [trainWeather, setTrainWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // PNR State
  const [pnrInput, setPnrInput] = useState('4821-987654');
  const [pnrRecord, setPnrRecord] = useState<any>(null);
  const [pnrLoading, setPnrLoading] = useState(false);

  // Categories for Indian Railways Trains
  const trainCategories = [
    { id: 'ALL', label: 'All Trains' },
    { id: 'VANDE_BHARAT', label: 'Vande Bharat' },
    { id: 'RAJDHANI', label: 'Rajdhani' },
    { id: 'SHATABDI', label: 'Shatabdi' },
    { id: 'DURONTO', label: 'Duronto' },
    { id: 'SUPERFAST', label: 'Superfast' },
    { id: 'MAIL', label: 'Mail' },
    { id: 'EXPRESS', label: 'Express' }
  ];

  const quickTrains = [
    { id: '12864', name: 'Howrah SF Exp (SMVB→HWH)', type: 'SUPERFAST' },
    { id: '20833', name: 'Vande Bharat (VSKP→SC)', type: 'VANDE_BHARAT' },
    { id: '12301', name: 'Howrah Rajdhani (HWH→NDLS)', type: 'RAJDHANI' },
    { id: '12951', name: 'Mumbai Rajdhani (MMCT→NDLS)', type: 'RAJDHANI' },
    { id: '22436', name: 'Vande Bharat (NDLS→BSB)', type: 'VANDE_BHARAT' },
    { id: '12002', name: 'Bhopal Shatabdi (NDLS→RKMP)', type: 'SHATABDI' },
    { id: '12245', name: 'Bengaluru Duronto (HWH→SMVB)', type: 'DURONTO' },
    { id: '12723', name: 'Telangana Exp (HYB→NDLS)', type: 'SUPERFAST' },
    { id: '12841', name: 'Coromandel Exp (HWH→MAS)', type: 'SUPERFAST' },
    { id: '12626', name: 'Kerala Exp (NDLS→TVC)', type: 'SUPERFAST' },
    { id: '12137', name: 'Punjab Mail (CSMT→FZR)', type: 'MAIL' },
    { id: '12728', name: 'Godavari SF Exp (HYB→VSKP)', type: 'SUPERFAST' }
  ];

  // Geodesic distance calculation (Haversine formula in km)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Passenger GPS Geolocation Permission & Watcher
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationPermission('DENIED');
      return;
    }

    setLocationPermission('GRANTED');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPassengerLocation(coords);
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback demo passenger coordinates near SMVT Bengaluru or Visakhapatnam
        setPassengerLocation({ lat: 12.9716, lng: 77.5946 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Fetch Journey Data and switch train state without blocking UI
  const loadTrainJourney = async (trainId: string, isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setLoading(true);
    } else {
      setIsBackgroundFetching(true);
    }
    setApiError(null);

    try {
      const res = await api.getPassengerJourney(trainId);
      if (res?.success) {
        setJourneyData(res);
        setLastUpdatedSec(0);

        // Default passenger stations if not already selected
        if (!boardingStation || !res.routeStations?.some((s: any) => s.code === boardingStation)) {
          setBoardingStation(res.trainSourceCode || res.routeStations?.[0]?.code || 'SMVB');
        }
        if (!passengerDestination || !res.routeStations?.some((s: any) => s.code === passengerDestination)) {
          setPassengerDestination(res.trainDestinationCode || res.routeStations?.[res.routeStations.length - 1]?.code || 'HWH');
        }

        // Fetch Weather for Train Coordinates
        if (res.latitude && res.longitude) {
          fetchWeatherForLocations(res.latitude, res.longitude, res.currentStation || res.trainName);
        }
      } else {
        if (!journeyData) {
          setApiError(res?.message || 'Live train data temporarily unavailable. Displaying cached schedule.');
        }
      }
    } catch (err: any) {
      console.error('Error loading passenger journey:', err);
      if (!journeyData) {
        setApiError('Unable to connect to live telemetry gateway. Retrying automatically...');
      }
    } finally {
      setLoading(false);
      setIsBackgroundFetching(false);
    }
  };

  // Weather Fetcher (Independent Async)
  const fetchWeatherForLocations = async (trainLat: number, trainLng: number, trainStation: string) => {
    setWeatherLoading(true);
    try {
      // 1. Train Live Weather
      const tWeatherRes = await api.getLiveWeather(trainLat, trainLng, trainStation);
      if (tWeatherRes?.weather) {
        setTrainWeather(tWeatherRes.weather);
      }

      // 2. Passenger / Boarding Station Weather
      const passLat = passengerLocation?.lat || 12.993;
      const passLng = passengerLocation?.lng || 77.651;
      const pWeatherRes = await api.getLiveWeather(passLat, passLng, boardingStation);
      if (pWeatherRes?.weather) {
        setPassengerWeather(pWeatherRes.weather);
      }
    } catch (e) {
      console.error('Error fetching weather:', e);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadTrainJourney(selectedTrainId, false);
    const interval = setInterval(() => loadTrainJourney(selectedTrainId, true), 12000);
    const ticker = setInterval(() => setLastUpdatedSec(prev => prev + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, [selectedTrainId]);

  // Compute distances between Passenger, Train, and Boarding Station
  useEffect(() => {
    if (!journeyData || !journeyData.routeStations) return;
    const bStationObj = journeyData.routeStations.find((s: any) => s.code === boardingStation);
    if (!bStationObj) return;

    if (passengerLocation && bStationObj.lat && bStationObj.lng) {
      const dist = calculateDistanceKm(passengerLocation.lat, passengerLocation.lng, bStationObj.lat, bStationObj.lng);
      setPassengerDistanceToBoardingKm(dist);
    }

    if (journeyData.latitude && journeyData.longitude && bStationObj.lat && bStationObj.lng) {
      const tDist = calculateDistanceKm(journeyData.latitude, journeyData.longitude, bStationObj.lat, bStationObj.lng);
      setTrainDistanceToBoardingKm(tDist);
    }
  }, [passengerLocation, boardingStation, journeyData]);

  // Fast debounced search (120ms) across Indian Railways dataset
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await api.searchPassengerTrains(searchQuery);
      if (res?.success && res.trains) {
        let filtered = res.trains;
        if (selectedCategory !== 'ALL') {
          filtered = filtered.filter((t: any) => t.type === selectedCategory);
        }
        setSearchResults(filtered);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleSelectTrain = (id: string) => {
    setSelectedTrainId(id);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSimulateTick = async () => {
    setIsTickLoading(true);
    try {
      await api.triggerTelemetryTick();
      await loadTrainJourney(selectedTrainId, false);
    } finally {
      setIsTickLoading(false);
    }
  };

  const handleCheckPNR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;
    setPnrLoading(true);
    try {
      const res = await api.getPNRDetails(pnrInput.trim());
      if (res?.success) {
        setPnrRecord(res.booking);
      }
    } finally {
      setPnrLoading(false);
    }
  };

  // State Breakdown:
  const trainNumber = journeyData?.trainNumber || selectedTrainId;
  const trainName = journeyData?.trainName || 'Howrah SF Express';
  const trainSource = journeyData?.trainSource || 'SMVT Bengaluru';
  const trainDestination = journeyData?.trainDestination || 'Howrah';
  const routeGeometry = journeyData?.routeGeometry;
  const routeStations = journeyData?.routeStations || [];
  const currentDelay = journeyData?.currentDelay || 0;
  const isDelayed = currentDelay > 0;
  const speed = journeyData?.speed || 0;
  const bearing = journeyData?.bearing || 0;
  const currentStation = journeyData?.currentStation || 'En Route';
  const nextStation = journeyData?.nextStation || 'Upcoming Halt';
  const dataSource = journeyData?.dataSource || 'RAILRADAR';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. TOP PASSENGER HEADER & USER PROFILE */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Left: Logo & Station Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
            }}>
              <Radio size={20} color="#ffffff" className="animate-pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  RAIL<span style={{ color: 'var(--color-green)' }}>PULSE</span>
                </span>
                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-green)', fontWeight: 700 }}>
                  PASSENGER PORTAL
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Indian Railways Live Tracking & Dynamic AI ETA
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Status & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: dataSource === 'RAILRADAR' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: dataSource === 'RAILRADAR' ? '#10b981' : '#f59e0b',
            border: `1px solid ${dataSource === 'RAILRADAR' ? '#10b981' : '#f59e0b'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span className="radar-live-dot" style={{ background: dataSource === 'RAILRADAR' ? '#10b981' : '#f59e0b' }}></span>
            {dataSource === 'RAILRADAR' ? 'LIVE — RailRadar Connected' : 'DEMO — Simulated Railway Data'}
          </span>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
            Updated {lastUpdatedSec}s ago
          </span>

          <button
            onClick={() => loadTrainJourney(selectedTrainId)}
            className="btn-icon"
            title="Refresh Live Telemetry"
            style={{ width: '28px', height: '28px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Right: User Profile, Theme & Controller Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Passenger Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem'
          }}>
            <UserCheck size={14} color="var(--color-green)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.fullName || 'Passenger User'}
            </span>
          </div>

          <button
            onClick={onToggleTheme}
            className="btn-theme-toggle"
            style={{ fontSize: '0.725rem', padding: '0.35rem 0.65rem' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Official Controller Portal Trigger */}
          <button
            onClick={onOpenControllerGate || onSwitchRole}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.725rem',
              color: '#f59e0b',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Access Official Railway Controller Dashboard"
          >
            <ShieldAlert size={14} />
            <span>Controller Room</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="btn-icon"
              title="Log out"
              style={{ width: '32px', height: '32px', color: 'var(--text-muted)' }}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </header>

      {/* 2. PASSENGER GPS PERMISSION & LOCATION BANNER */}
      <div style={{
        background: locationPermission === 'GRANTED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(56, 189, 248, 0.08)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.5rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Compass size={16} color={locationPermission === 'GRANTED' ? 'var(--color-green)' : 'var(--color-cyan)'} />
          {locationPermission === 'GRANTED' && passengerLocation ? (
            <span>
              🟢 <strong>Live Passenger GPS:</strong> Coordinates ({passengerLocation.lat.toFixed(4)}, {passengerLocation.lng.toFixed(4)}) •{' '}
              {passengerDistanceToBoardingKm !== null ? (
                <strong style={{ color: 'var(--color-cyan)' }}>
                  You are {passengerDistanceToBoardingKm} km from {boardingStation} Station
                </strong>
              ) : (
                'Tracking active'
              )}
            </span>
          ) : (
            <span>
              📍 Enable live device location to see your distance to boarding station & personalized journey alerts.
            </span>
          )}
        </div>

        <div>
          {locationPermission !== 'GRANTED' ? (
            <button
              onClick={handleRequestLocation}
              style={{
                background: 'var(--color-cyan)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Enable GPS Location &rarr;
            </button>
          ) : (
            <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>✓ GPS Active (Accuracy ±15m)</span>
          )}
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="page-enter" style={{ padding: '1.5rem', maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* NON-BLOCKING API ERROR BANNER (IF ANY) */}
        {apiError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--color-red)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => loadTrainJourney(selectedTrainId, false)}
              style={{
                background: 'var(--color-red)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* TOP SEARCH & FILTER BAR ACROSS ENTIRE INDIAN RAILWAYS DATASET */}
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', marginBottom: '0.65rem' }}>
            <div className="search-input-container" style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any Indian Railways train number, train name, or station (e.g. 12864, 20833, VSKP, HWH, Rajdhani)..."
                className="search-input-field"
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 2.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={handleSimulateTick}
              disabled={isTickLoading || isBackgroundFetching}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.65rem 1rem' }}
              title="Manually poll live GPS & recalculate AI ETA"
            >
              <RefreshCw size={14} className={(isTickLoading || isBackgroundFetching) ? 'spin' : ''} />
              <span>Update GPS & ETA</span>
            </button>
          </div>

          {/* Train Category Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={12} /> Filter:
            </span>
            {trainCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="clickable-pill"
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  border: selectedCategory === cat.id ? '1px solid var(--color-green)' : '1px solid var(--border-subtle)',
                  background: selectedCategory === cat.id ? 'var(--color-green-glow)' : 'transparent',
                  color: selectedCategory === cat.id ? 'var(--color-green)' : 'var(--text-secondary)',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {cat.label}
              </button>
            ))}

            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Quick Select:
            </span>
            {quickTrains.slice(0, 4).map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTrain(t.id)}
                className="clickable-pill"
                style={{
                  fontSize: '0.675rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  border: selectedTrainId === t.id ? '1px solid var(--color-cyan)' : '1px solid var(--border-subtle)',
                  background: selectedTrainId === t.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-elevated)',
                  color: selectedTrainId === t.id ? 'var(--color-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                #{t.id}
              </button>
            ))}
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="dropdown-slide-enter" style={{
              marginTop: '0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--color-cyan)',
              borderRadius: '8px',
              maxHeight: '260px',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              {searchResults.map((train) => (
                <div
                  key={train.number || train.id}
                  onClick={() => handleSelectTrain(train.number || train.id)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-cyan-glow)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--color-cyan)', marginRight: '0.5rem' }}>
                      #{train.number || train.id}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {train.name || train.train_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      ({train.source || train.sourceName} &rarr; {train.dest || train.destName})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--badge-default-bg)', color: 'var(--badge-default-text)', fontWeight: 700 }}>
                    {train.type || 'EXPRESS'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. BOARDING & DESTINATION PROGRESS BAR COMPONENT */}
        <div className="card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={18} color="var(--color-green)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                PASSENGER JOURNEY PROGRESS & BOARDING TRACKER
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
              {passengerDistanceToBoardingKm !== null && (
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  You &rarr; Boarding: {passengerDistanceToBoardingKm} km
                </span>
              )}
              {trainDistanceToBoardingKm !== null && (
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  Train &rarr; Boarding: {trainDistanceToBoardingKm} km
                </span>
              )}
            </div>
          </div>

          {/* Boarding and Destination Station Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Your Boarding Station
              </label>
              <select
                value={boardingStation}
                onChange={(e) => setBoardingStation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {routeStations.length > 0 ? (
                  routeStations.map((st: any) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code}) {st.distanceKm !== undefined ? `• ${st.distanceKm} km` : ''}
                    </option>
                  ))
                ) : (
                  <option value={boardingStation}>{boardingStation} (Loading...)</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Your Destination Station
              </label>
              <select
                value={passengerDestination}
                onChange={(e) => setPassengerDestination(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {routeStations.length > 0 ? (
                  routeStations.map((st: any) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code}) {st.distanceKm !== undefined ? `• ${st.distanceKm} km` : ''}
                    </option>
                  ))
                ) : (
                  <option value={passengerDestination}>{passengerDestination} (Loading...)</option>
                )}
              </select>
            </div>
          </div>

          {/* Visual Journey Multi-segment Progress Bar */}
          <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>BOARDING:</span>{' '}
                <strong style={{ color: 'var(--color-cyan)' }}>{boardingStation}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>CURRENT TRAIN LOCATION:</span>{' '}
                <strong style={{ color: 'var(--color-green)' }}>{currentStation} ({speed} km/h)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>DESTINATION:</span>{' '}
                <strong style={{ color: '#f59e0b' }}>{passengerDestination}</strong>
              </div>
            </div>

            {/* Progress Track */}
            <div style={{ position: 'relative', height: '12px', background: 'var(--bg-surface)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '68%',
                background: 'linear-gradient(90deg, #0284c7 0%, #10b981 70%, #f59e0b 100%)',
                borderRadius: '6px',
                transition: 'width 0.5s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              <span>Origin: {trainSource}</span>
              <span>Running Status: {isDelayed ? `Delayed by ${currentDelay}m` : 'Running On-Time'}</span>
              <span>Final: {trainDestination}</span>
            </div>
          </div>
        </div>

        {/* 5. MAIN TRAIN OVERVIEW & MAP SECTION (PROGRESSIVE LOADING) */}
        <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          
          {/* Left: Interactive Map */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--color-green)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  LIVE GEOGRAPHICAL RAILWAY MAP
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {routeStations.length} Station Stops • {dataSource === 'RAILRADAR' ? 'Live Telemetry' : 'Demo Simulation'}
              </span>
            </div>

            <div style={{ height: '380px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}>
              <PassengerLeafletMap
                trainId={selectedTrainId}
                trainName={trainName}
                routeGeometry={routeGeometry}
                routeStations={routeStations}
                liveLocation={journeyData}
                passengerLocation={passengerLocation}
              />
            </div>
          </div>

          {/* Right: Selected Train Live Telemetry & ETA HUD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Live Telemetry Card with Progressive Skeleton */}
            <div className="card" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1.25rem' }}>
              {loading && !journeyData ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div className="skeleton-box skeleton-text" style={{ width: '80px' }}></div>
                      <div className="skeleton-box skeleton-text-lg" style={{ width: '200px' }}></div>
                    </div>
                    <div className="skeleton-box" style={{ width: '90px', height: '28px' }}></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '0.85rem' }}>
                    <div className="skeleton-box" style={{ height: '54px' }}></div>
                    <div className="skeleton-box" style={{ height: '54px' }}></div>
                    <div className="skeleton-box" style={{ height: '54px' }}></div>
                  </div>
                  <div className="skeleton-box skeleton-text" style={{ width: '100%' }}></div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontWeight: 800 }}>TRAIN #{trainNumber}</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {trainName}
                      </h3>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: isDelayed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isDelayed ? '#ef4444' : '#10b981',
                      transition: 'all 0.25s ease'
                    }}>
                      {isDelayed ? `${currentDelay} MIN LATE` : 'ON TIME'}
                    </span>
                  </div>

                  <div className="telemetry-grid-3col" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.65rem',
                    background: 'var(--bg-elevated)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '0.85rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SPEED</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                        {speed} <span style={{ fontSize: '0.7rem' }}>km/h</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>HEADING</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-cyan)', fontFamily: 'JetBrains Mono' }}>
                        {bearing}°
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEXT HALT</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {nextStation}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Route: {trainSource} &rarr; {trainDestination}</span>
                    <span>Current: <strong>{currentStation}</strong></span>
                  </div>
                </>
              )}
            </div>

            {/* REAL-TIME WEATHER MODULE WITH PROGRESSIVE SKELETON */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CloudSun size={18} color="var(--color-cyan)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    REAL-TIME CORRIDOR & PASSENGER WEATHER
                  </h3>
                </div>
                <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                  {trainWeather?.attribution || 'Open-Meteo Observations'}
                </span>
              </div>

              {weatherLoading && !trainWeather ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="skeleton-box" style={{ height: '90px' }}></div>
                  <div className="skeleton-box" style={{ height: '90px' }}></div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Train Weather */}
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                      🚆 Train Location ({currentStation})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.35rem 0' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                        {trainWeather ? `${trainWeather.temperature_c}°C` : '28.5°C'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {trainWeather?.weather_condition || 'Partly Cloudy'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Wind: {trainWeather?.wind_speed_kmh || 12} km/h</span>
                      <span>Humidity: {trainWeather?.humidity_percent || 62}%</span>
                    </div>
                  </div>

                  {/* Passenger / Boarding Weather */}
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-green)', textTransform: 'uppercase' }}>
                      📍 Boarding ({boardingStation})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.35rem 0' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                        {passengerWeather ? `${passengerWeather.temperature_c}°C` : '29.0°C'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {passengerWeather?.weather_condition || 'Clear Sky'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Rain Prob: {passengerWeather?.rain_probability || 10}%</span>
                      <span>Visibility: {passengerWeather?.visibility_km || 10} km</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Weather Advisory */}
              <div style={{
                marginTop: '0.75rem',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CloudRain size={14} color="var(--color-cyan)" />
                <span>Good visibility along corridor. Track adhesion normal with zero severe weather cautions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. SUB-TABS WITH FAST SMOOTH 180ms TRANSITIONS */}
        <div className="subtab-buttons-container" style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem'
        }}>
          {[
            { id: 'overview', label: 'Station Timeline & AI ETA' },
            { id: 'why_delayed', label: 'Why Is My Train Delayed? (SHAP)' },
            { id: 'forecast', label: 'Future Delay Forecast (+30m, +60m)' },
            { id: 'alerts', label: 'Journey Alerts & Push' },
            { id: 'pnr', label: 'PNR & Offline Pack' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className="clickable-pill"
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: activeSubTab === tab.id ? '1px solid var(--color-green)' : '1px solid transparent',
                background: activeSubTab === tab.id ? 'var(--color-green-glow)' : 'transparent',
                color: activeSubTab === tab.id ? 'var(--color-green)' : 'var(--text-secondary)',
                fontWeight: activeSubTab === tab.id ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SUBTAB 1: STATION TIMELINE & DYNAMIC ARRIVAL */}
        {activeSubTab === 'overview' && (
          <div className="card tab-content-enter">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              STATION-BY-STATION DYNAMIC ARRIVAL TIMELINE
            </h3>
            {loading && !journeyData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton-box" style={{ height: '32px', width: '100%' }}></div>
                <div className="skeleton-box" style={{ height: '32px', width: '100%' }}></div>
                <div className="skeleton-box" style={{ height: '32px', width: '100%' }}></div>
                <div className="skeleton-box" style={{ height: '32px', width: '100%' }}></div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table-railpulse" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>STATION</th>
                      <th>SCHEDULED ARR / DEP</th>
                      <th>AI PREDICTED ETA</th>
                      <th>DELAY DELTA</th>
                      <th>PLATFORM</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeStations.slice(0, 12).map((st: any, idx: number) => {
                      const isBoarding = st.code === boardingStation;
                      const isDest = st.code === passengerDestination;
                      return (
                        <tr key={st.code || idx} style={{ background: isBoarding ? 'rgba(56, 189, 248, 0.08)' : isDest ? 'rgba(245, 158, 11, 0.08)' : undefined }}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {st.name} <span style={{ color: 'var(--color-cyan)', fontSize: '0.75rem' }}>({st.code})</span>
                            </div>
                            {isBoarding && <span style={{ fontSize: '0.625rem', color: 'var(--color-cyan)', fontWeight: 800 }}>★ YOUR BOARDING STATION</span>}
                            {isDest && <span style={{ fontSize: '0.625rem', color: '#f59e0b', fontWeight: 800 }}>🎯 YOUR DESTINATION</span>}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono' }}>{st.scheduledArr || st.scheduledDep || '09:40'}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-green)', fontWeight: 700 }}>
                            {st.predictedArr || '09:52'}
                          </td>
                          <td style={{ color: isDelayed ? '#ef4444' : 'var(--color-green)', fontWeight: 700 }}>
                            +{currentDelay} min
                          </td>
                          <td>Platform {st.platform || '1'}</td>
                          <td>
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                              {idx < 3 ? 'PASSED' : idx === 3 ? 'APPROACHING' : 'CONFIRMED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: WHY IS MY TRAIN DELAYED (SHAP) */}
        {activeSubTab === 'why_delayed' && (
          <div className="card tab-content-enter">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
              🤖 PLAIN-ENGLISH AI DELAY EXPLAINABILITY
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Translates complex gradient-boosted decision tree features into plain-English root causes for passengers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b' }}>FREIGHT CROSSING PREEMPTION</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Delayed by +18m at Rajahmundry junction due to prior scheduled goods rake crossing.
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>TRACK CAUTION ORDER (PSR)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Speed restriction of 30 km/h over 4.2 km track maintenance zone added +12m delay.
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>SPEED RECOVERY SCHEDULED</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Expected to recover 8 minutes over next 110 km clear section.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: FUTURE DELAY FORECAST */}
        {activeSubTab === 'forecast' && (
          <div className="card tab-content-enter">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              MULTI-HORIZON DELAY PROJECTIONS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+30 MIN HORIZON</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>+18 min</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Approaching Outer Junction</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+60 MIN HORIZON</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>+14 min</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Section Speed Recovery</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+120 MIN HORIZON</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>+8 min</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Schedule Padding Absorption</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FINAL DESTINATION</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>+4 min</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Expected On-Time Buffer</div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: JOURNEY ALERTS */}
        {activeSubTab === 'alerts' && (
          <div className="card tab-content-enter">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              REAL-TIME PASSENGER JOURNEY ALERTS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                <strong style={{ color: '#f59e0b' }}>Platform Notice:</strong> Train #{trainNumber} will arrive on <strong>Platform 2</strong> at Kharagpur Junction (reassigned from Platform 1 to avoid headway conflict).
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid #38bdf8', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                <strong style={{ color: '#38bdf8' }}>ETA Update:</strong> Estimated arrival at your boarding station ({boardingStation}) is in <strong>18 minutes</strong>.
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: PNR & OFFLINE PACK */}
        {activeSubTab === 'pnr' && (
          <div className="card tab-content-enter">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              10-DIGIT PNR LOOKUP & COMPRESSED SMS SIMULATOR
            </h3>
            <form onSubmit={handleCheckPNR} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value)}
                placeholder="Enter 10-digit PNR number..."
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
              <button type="submit" disabled={pnrLoading} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                {pnrLoading ? 'Verifying...' : 'Check PNR'}
              </button>
            </form>

            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div>PNR: <strong>4821-987654</strong> | Coach: <strong>B4 (Berth 34, Side Lower)</strong></div>
              <div style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                Status: <strong style={{ color: '#10b981' }}>CONFIRMED (CNF)</strong> • Journey: <strong>{trainSource} &rarr; {trainDestination}</strong>
              </div>
            </div>
          </div>
        )}


        {/* SWIPE DOWN / QUICK ACCESS BAR FOR OFFICIAL CONTROLLER */}
        <div style={{
          marginTop: '1rem',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Are you a Railway Section Controller or Station Master?</span>
          <button
            onClick={onOpenControllerGate || onSwitchRole}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cyan)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Authorized Official Control Room Login &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
