import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, Maximize2, Gauge, Navigation } from 'lucide-react';
import { api } from '../services/api';

interface RouteStop {
  code: string;
  name: string;
  lat: number;
  lng: number;
  sequence?: number;
  scheduledArr?: string | null;
  scheduledDep?: string | null;
  predictedArr?: string | null;
  distanceKm?: number;
  isHalt?: boolean;
  platform?: string;
  status?: string;
}

interface PassengerLeafletMapProps {
  trainId: string;
  trainName?: string;
  routeGeometry?: {
    type: string;
    coordinates: [number, number][];
  };
  routeStations?: RouteStop[];
  liveLocation?: any;
  passengerLocation?: { lat: number; lng: number } | null;
}

export const PassengerLeafletMap: React.FC<PassengerLeafletMapProps> = ({
  trainId,
  trainName,
  routeGeometry,
  routeStations,
  liveLocation: propLiveLocation,
  passengerLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const trainMarkerRef = useRef<L.Marker | null>(null);

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [liveLocation, setLiveLocation] = useState<any>(propLiveLocation || null);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Discard previous train state and fetch fresh data whenever trainId changes
  useEffect(() => {
    let isMounted = true;
    
    // Discard previous train state immediately
    setRouteCoords([]);
    setStops([]);
    setLiveLocation(null);

    const loadFreshTrainData = async () => {
      try {
        const journeyRes = await api.getPassengerJourney(trainId);

        if (!isMounted) return;

        if (journeyRes?.success) {
          // Extract real RailRadar GeoJSON coordinates
          const rawGeom = journeyRes.routeGeometry;
          if (rawGeom?.coordinates && Array.isArray(rawGeom.coordinates)) {
            // RailRadar GeoJSON coordinates are [longitude, latitude] -> convert to Leaflet [lat, lng]
            const latLngs: [number, number][] = rawGeom.coordinates.map((c: number[]) => [c[1], c[0]]);
            setRouteCoords(latLngs);
          }

          // Extract real route stations
          if (journeyRes.routeStations && Array.isArray(journeyRes.routeStations)) {
            setStops(journeyRes.routeStations);
          }

          // Extract live GPS state
          setLiveLocation({
            trainNumber: journeyRes.trainNumber || trainId,
            trainName: journeyRes.trainName || trainName,
            latitude: journeyRes.latitude,
            longitude: journeyRes.longitude,
            speed: journeyRes.speed,
            bearing: journeyRes.bearing,
            currentDelay: journeyRes.currentDelay,
            nextStation: journeyRes.nextStation,
            currentStation: journeyRes.currentStation,
            dataSource: journeyRes.dataSource
          });
        } else {
          // Fallback to separate route endpoint
          const routeRes: any = await api.getTrainGeoJSONRoute(trainId);
          if (routeRes?.geojson?.geometry?.coordinates) {
            const latLngs: [number, number][] = routeRes.geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            setRouteCoords(latLngs);
          } else if (routeRes?.features?.[0]?.geometry?.coordinates) {
            const latLngs: [number, number][] = routeRes.features[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            setRouteCoords(latLngs);
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic train map data:', err);
      }
    };

    loadFreshTrainData();
    const interval = setInterval(loadFreshTrainData, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [trainId]);

  // Sync prop changes if passed directly from parent
  useEffect(() => {
    if (routeGeometry?.coordinates && Array.isArray(routeGeometry.coordinates)) {
      const latLngs: [number, number][] = routeGeometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      setRouteCoords(latLngs);
    }
    if (routeStations && Array.isArray(routeStations)) {
      setStops(routeStations);
    }
    if (propLiveLocation) {
      setLiveLocation(propLiveLocation);
    }
  }, [routeGeometry, routeStations, propLiveLocation]);

  // 3. Render dynamic GeoJSON polyline & station markers (only when route or stops change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    trainMarkerRef.current = null;

    // A. Draw Dynamic GeoJSON Railway Track
    if (routeCoords.length > 0) {
      // Glow underlay
      L.polyline(routeCoords, {
        color: '#0284c7',
        weight: 6,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(group);

      // Main track line
      L.polyline(routeCoords, {
        color: '#0284c7',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '8, 6',
        lineCap: 'round'
      }).addTo(group);

      // Auto-fit map bounds to the train's actual route
      map.fitBounds(routeCoords, { padding: [30, 30], maxZoom: 12, animate: true });
    }

    // B. Draw Station Stop Markers
    const displayStops = stops.length > 50 ? stops.filter((s, idx) => s.isHalt || idx % 5 === 0 || idx === 0 || idx === stops.length - 1) : stops;

    displayStops.forEach(stop => {
      if (!stop.lat || !stop.lng || isNaN(stop.lat) || isNaN(stop.lng)) return;

      const isNext = stop.status === 'UPCOMING_NEXT';
      const isPassed = stop.status === 'PASSED';
      const isDest = stop.status === 'DESTINATION' || stop.sequence === stops.length;

      const color = isNext ? '#10b981' : isPassed ? '#94a3b8' : isDest ? '#f59e0b' : '#0284c7';
      const size = isNext ? 12 : isDest ? 10 : 7;

      const stopHtml = `
        <div style="
          width: ${size * 2}px;
          height: ${size * 2}px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 ${isNext ? '10px' : '4px'} ${color};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isNext ? '<div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>' : ''}
        </div>
      `;

      const icon = L.divIcon({
        className: 'station-marker',
        html: stopHtml,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(group);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 160px;">
          <div style="font-weight: 800; font-size: 13px; color: #0284c7; margin-bottom: 2px;">
            ${stop.name} (${stop.code})
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
            Stop #${stop.sequence || '•'} ${stop.distanceKm ? `• ${stop.distanceKm} km` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">
            <div>
              <span style="color: #64748b; display: block; font-size: 9px;">SCHED</span>
              <strong>${stop.scheduledArr || stop.scheduledDep || 'Origin'}</strong>
            </div>
            <div>
              <span style="color: #10b981; display: block; font-size: 9px;">AI ETA</span>
              <strong style="color: #0f766e;">${stop.predictedArr || 'On Time'}</strong>
            </div>
          </div>
          <div style="margin-top: 4px; font-size: 10px; font-weight: 700; color: ${color};">
            ${isNext ? '⚡ NEXT APPROACHING HALT' : isPassed ? '✓ DEPARTED / PASSED' : isDest ? '🏁 FINAL DESTINATION' : 'EN ROUTE'}
          </div>
        </div>
      `);
    });
  }, [routeCoords, stops]);

  // 4. Smoothly Glide Moving Live Train Marker & Passenger GPS Marker
  useEffect(() => {
    const group = layersGroupRef.current;
    if (!group) return;

    // C. Update or Create Real Moving Train Marker
    if (liveLocation && liveLocation.latitude && liveLocation.longitude && !isNaN(liveLocation.latitude)) {
      const lat = liveLocation.latitude;
      const lng = liveLocation.longitude;
      const bearing = liveLocation.bearing || 0;
      const speed = liveLocation.speed || 0;
      const delay = liveLocation.currentDelay || 0;

      const trainHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.3);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981 0%, #0284c7 100%);
            border: 2px solid #ffffff;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${bearing}deg);
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            background: #0f172a;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 1px 4px;
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.2);
            white-space: nowrap;
          ">
            ${speed} km/h
          </div>
        </div>
      `;

      const trainIcon = L.divIcon({
        className: 'train-live-icon',
        html: trainHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      if (trainMarkerRef.current) {
        // Smoothly glide position
        trainMarkerRef.current.setLatLng([lat, lng]);
        trainMarkerRef.current.setIcon(trainIcon);
      } else {
        const tMarker = L.marker([lat, lng], { icon: trainIcon, zIndexOffset: 1000 }).addTo(group);
        trainMarkerRef.current = tMarker;
      }
    }

    // D. Draw Passenger Live Location Marker (if permission granted)
    if (passengerLocation && passengerLocation.lat && passengerLocation.lng) {
      const pLat = passengerLocation.lat;
      const pLng = passengerLocation.lng;

      const passengerHtml = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(56, 189, 248, 0.4);
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #0284c7;
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px rgba(2, 132, 199, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `;

      const passengerIcon = L.divIcon({
        className: 'passenger-live-icon',
        html: passengerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([pLat, pLng], { icon: passengerIcon, zIndexOffset: 950 }).addTo(group);
    }
  }, [liveLocation, passengerLocation, trainName, trainId]);

  const handleCenterTrain = () => {
    const map = mapInstanceRef.current;
    if (map && liveLocation?.latitude && liveLocation?.longitude) {
      map.setView([liveLocation.latitude, liveLocation.longitude], 9, { animate: true });
    }
  };

  const handleZoomFullRoute = () => {
    const map = mapInstanceRef.current;
    if (map && routeCoords.length > 0) {
      map.fitBounds(routeCoords, { padding: [30, 30], animate: true });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '380px' }} />

      {/* Floating Control Toolbar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 500
      }}>
        <button
          type="button"
          onClick={handleCenterTrain}
          className="btn-secondary"
          style={{
            padding: '0.4rem 0.65rem',
            fontSize: '0.75rem',
            background: 'var(--bg-surface)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            gap: '0.4rem'
          }}
          title="Center map on live train position"
        >
          <Locate size={14} color="var(--color-green)" />
          <span>Center Train</span>
        </button>

        <button
          type="button"
          onClick={handleZoomFullRoute}
          className="btn-secondary"
          style={{
            padding: '0.4rem 0.65rem',
            fontSize: '0.75rem',
            background: 'var(--bg-surface)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            gap: '0.4rem'
          }}
          title="Fit full route in view"
        >
          <Maximize2 size={14} color="var(--color-cyan)" />
          <span>Zoom Route</span>
        </button>
      </div>

      {/* Bottom Live Speed & Telemetry HUD Pill */}
      {liveLocation && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.4rem 0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.75rem',
          zIndex: 500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: liveLocation.dataSource === 'RAILRADAR' ? 'var(--color-green)' : 'var(--color-yellow)', fontWeight: 700 }}>
            <span className="radar-live-dot" style={{ background: liveLocation.dataSource === 'RAILRADAR' ? '#10b981' : '#f59e0b' }}></span>
            <span>{liveLocation.dataSource === 'RAILRADAR' ? 'RAILRADAR GPS LIVE' : 'SIMULATED GPS'}</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>|</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
            <Gauge size={13} color="var(--color-cyan)" />
            <strong>{liveLocation.speed || 0} km/h</strong>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>|</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
            <Navigation size={13} color="var(--color-green)" />
            <span>Next: <strong>{liveLocation.nextStation || 'Upcoming'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
