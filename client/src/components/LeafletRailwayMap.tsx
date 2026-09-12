import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Locate, Maximize2, Layers, Eye, EyeOff, Radio, Gauge, Clock, Navigation } from 'lucide-react';
import { Train, Station, Section } from '../types';
import { api } from '../services/api';
import { IR_STATION_DATABASE } from '../services/indianRailwaysData';

interface RouteStop {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
  sequence?: number;
  scheduled_arr?: string | null;
  scheduled_dep?: string | null;
  predicted_arr?: string | null;
  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;
  predictedArrival?: string | null;
  distance_km?: number;
  distanceKm?: number;
  platforms?: number;
  status?: 'PASSED' | 'UPCOMING_NEXT' | 'UPCOMING' | 'DESTINATION';
}

interface LeafletRailwayMapProps {
  selectedTrain: Train | null;
  allTrains: Train[];
  stations: Station[];
  sections: Section[];
  onSelectTrain?: (train: Train) => void;
  onSelectStation?: (station: Station) => void;
  onNavigateTab?: (tab: string, trainId?: string) => void;
}

export const LeafletRailwayMap: React.FC<LeafletRailwayMapProps> = ({
  selectedTrain,
  allTrains,
  stations,
  sections,
  onSelectTrain,
  onSelectStation,
  onNavigateTab
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const trainMarkerRef = useRef<L.Marker | null>(null);

  const [showCongestion, setShowCongestion] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [geoJsonRouteCoords, setGeoJsonRouteCoords] = useState<[number, number][]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const [progressPercent, setProgressPercent] = useState<number>(52.6);
  const [traversedKm, setTraversedKm] = useState<number>(875);
  const [totalKm, setTotalKm] = useState<number>(1662);

  // 1. Fetch live GeoJSON route & stops for active train
  useEffect(() => {
    let isMounted = true;
    const trainId = selectedTrain?.id || '12864';

    const fetchRouteAndLive = async () => {
      try {
        const [routeData, liveData] = await Promise.all([
          api.getTrainGeoJSONRoute(trainId),
          api.getTrainLive(trainId)
        ]);

        if (!isMounted) return;

        if (routeData && routeData.features && routeData.features[0]) {
          const feature = routeData.features[0];
          const rawCoords = feature.geometry?.coordinates || [];
          // Filter and validate coordinates [lng, lat] -> [lat, lng]
          const latLngs: [number, number][] = rawCoords
            .filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
            .map((c: number[]) => [Number(c[1]), Number(c[0])]);

          if (latLngs.length > 0) {
            setGeoJsonRouteCoords(latLngs);
          }

          if (feature.properties) {
            setTotalKm(feature.properties.total_distance_km || 1662);
            setTraversedKm(feature.properties.traversed_distance_km || 875);
            setProgressPercent(feature.properties.progress_percent || 52.6);
          }
        }

        if (routeData && routeData.stops && Array.isArray(routeData.stops)) {
          setRouteStops(routeData.stops);
        }

        if (liveData) {
          setLiveTelemetry(liveData);
        }
      } catch (err) {
        console.error('Error fetching live map route data:', err);
      }
    };

    fetchRouteAndLive();
    const interval = setInterval(fetchRouteAndLive, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedTrain?.id]);

  // Center on Train Action
  const handleCenterOnTrain = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const lat = Number(liveTelemetry?.latitude) || Number(selectedTrain?.lat) || 17.8420;
    const lng = Number(liveTelemetry?.longitude) || Number(selectedTrain?.lng) || 83.3320;
    if (!isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.setView([lat, lng], 10, { animate: true });
    }
  }, [liveTelemetry, selectedTrain]);

  // Zoom to Complete Route Action
  const handleZoomFullRoute = useCallback(() => {
    if (!mapInstanceRef.current || geoJsonRouteCoords.length === 0) return;
    try {
      const bounds = L.latLngBounds(geoJsonRouteCoords);
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
      }
    } catch (e) {
      console.warn('Invalid route bounds:', e);
    }
  }, [geoJsonRouteCoords]);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.8420, 83.3320],
        zoom: 7,
        zoomControl: true,
        attributionControl: true
      });

      // Dark Matter Tile Layer for Professional Railway Control Room HUD
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> | RailPulse Live GIS'
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      const handleResize = () => {
        requestAnimationFrame(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
      };

      window.addEventListener('resize', handleResize);
      const initTimer = setTimeout(handleResize, 250);

      return () => {
        clearTimeout(initTimer);
        window.removeEventListener('resize', handleResize);
        map.remove();
        mapInstanceRef.current = null;
      };
    }
  }, []);

  // 3. Render Layers whenever coordinates, telemetry, or view toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // Fallback corridor coordinates if GeoJSON is loading
    const defaultCorridor: [number, number][] = [
      [22.5838, 88.3426], [22.3361, 87.3278], [20.4625, 85.8830], [20.2666, 85.8436],
      [20.1772, 85.7412], [19.3150, 84.7941], [18.7725, 84.4172], [18.2949, 83.8938],
      [18.1124, 83.4168], [17.8420, 83.3320], [17.7215, 83.2872], [17.7058, 83.1554],
      [17.6913, 83.0039], [17.0494, 82.1704], [17.0005, 81.7800], [16.8130, 81.5266],
      [16.7107, 81.0952], [16.5186, 80.6200], [13.0827, 80.2707]
    ];

    const activeRoute = geoJsonRouteCoords.length > 0 ? geoJsonRouteCoords : defaultCorridor;

    // Train Current GPS Position (Safe numbers)
    const trainLat = Number(liveTelemetry?.latitude) || Number(selectedTrain?.lat) || 17.8420;
    const trainLng = Number(liveTelemetry?.longitude) || Number(selectedTrain?.lng) || 83.3320;
    const trainSpeed = liveTelemetry?.speed_kmh ?? selectedTrain?.speedKmH ?? 72;
    const trainDelay = liveTelemetry?.current_delay_min ?? selectedTrain?.currentDelayMin ?? 12;
    const trainHeading = liveTelemetry?.bearing_deg ?? liveTelemetry?.heading_deg ?? selectedTrain?.headingDeg ?? 35;
    const trainName = liveTelemetry?.train_name || selectedTrain?.name || 'Howrah - SMVB Express';
    const trainNum = liveTelemetry?.train_number || selectedTrain?.id || '12864';
    const dataSource = liveTelemetry?.data_source || 'SIMULATED';

    // A. Draw Base Railway Track (Full Route Line)
    L.polyline(activeRoute, {
      color: '#334155',
      weight: 6,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(layers);

    // B. Draw Traversed Route (Glow / Active Track Progress)
    let closestIdx = 0;
    let minDistance = Infinity;
    activeRoute.forEach((pt, idx) => {
      const dist = Math.hypot(pt[0] - trainLat, pt[1] - trainLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    const traversedPoints = [...activeRoute.slice(0, closestIdx + 1), [trainLat, trainLng] as [number, number]];
    const remainingPoints = [[trainLat, trainLng] as [number, number], ...activeRoute.slice(closestIdx + 1)];

    if (traversedPoints.length > 1) {
      L.polyline(traversedPoints, {
        color: '#10b981',
        weight: 4,
        opacity: 0.95
      }).addTo(layers);
    }

    if (remainingPoints.length > 1) {
      L.polyline(remainingPoints, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '6, 6'
      }).addTo(layers);
    }

    // C. Section Congestion Heat Overlays
    if (showCongestion && Array.isArray(sections)) {
      sections.forEach(sec => {
        const fromSt = stations.find(s => s.code === sec.from) || (IR_STATION_DATABASE as any)[sec.from];
        const toSt = stations.find(s => s.code === sec.to) || (IR_STATION_DATABASE as any)[sec.to];

        if (fromSt && toSt && !isNaN(Number(fromSt.lat)) && !isNaN(Number(fromSt.lng)) && !isNaN(Number(toSt.lat)) && !isNaN(Number(toSt.lng))) {
          const congColor = sec.congestionLevel === 'CRITICAL' || sec.congestionLevel === 'HIGH' ? '#ef4444' : (sec.congestionLevel === 'MEDIUM' ? '#f59e0b' : '#10b981');
          const congPoly = L.polyline([
            [Number(fromSt.lat), Number(fromSt.lng)],
            [Number(toSt.lat), Number(toSt.lng)]
          ], {
            color: congColor,
            weight: 7,
            opacity: 0.65
          }).addTo(layers);

          congPoly.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 190px;">
              <strong style="color: #0369a1; font-size: 13px;">Section: ${sec.from} &rarr; ${sec.to}</strong><br/>
              <div style="margin-top: 4px; padding: 2px 6px; background: ${congColor}22; border-radius: 4px; font-weight: bold; color: ${congColor};">
                Congestion: ${sec.congestionLevel} (${sec.currentOccupancy}% Occupancy)
              </div>
              <div style="margin-top: 6px; font-size: 11px; color: #475569;">
                <span>Active Trains: <strong>${sec.activeTrains}</strong></span><br/>
                <span>Avg Speed: <strong>${sec.avgSpeedKmH} km/h</strong> (MPS: ${sec.maxSpeed} km/h)</span>
              </div>
            </div>
          `);
        }
      });
    }

    // D. Draw Station Stop Markers (with coordinate resolution safeguards)
    if (showStations) {
      const activeStops = routeStops.length > 0 ? routeStops : stations.map((st, idx) => ({
        code: st.code,
        name: st.name,
        lat: st.lat,
        lng: st.lng,
        sequence: idx + 1,
        scheduled_arr: '18:30',
        scheduled_dep: '18:35',
        predicted_arr: '18:42',
        distance_km: idx * 80,
        platforms: st.platforms,
        status: (idx < 10 ? 'PASSED' : idx === 10 ? 'UPCOMING_NEXT' : 'UPCOMING') as any
      }));

      activeStops.forEach((stop, idx) => {
        // Resolve station coordinates safely
        const knownStation = stations.find(s => s.code === stop.code) || (IR_STATION_DATABASE as any)[stop.code];
        const stLat = Number(stop.lat) || Number(knownStation?.lat);
        const stLng = Number(stop.lng) || Number(knownStation?.lng);

        if (isNaN(stLat) || isNaN(stLng) || !stLat || !stLng) {
          return; // Skip station if coordinates cannot be resolved
        }

        const isNextStop = stop.status === 'UPCOMING_NEXT' || (selectedTrain && selectedTrain.nextStation === stop.code);
        const isPassed = stop.status === 'PASSED';
        const isDest = stop.status === 'DESTINATION';

        let stColor = '#64748b';
        let fillColor = '#1e293b';
        let radius = 5;

        if (isNextStop) {
          stColor = '#06b6d4';
          fillColor = '#22d3ee';
          radius = 8;
        } else if (isDest) {
          stColor = '#f59e0b';
          fillColor = '#fbbf24';
          radius = 7;
        } else if (isPassed) {
          stColor = '#475569';
          fillColor = '#0f172a';
          radius = 4.5;
        }

        const stMarker = L.circleMarker([stLat, stLng], {
          radius,
          color: stColor,
          fillColor,
          fillOpacity: 1,
          weight: isNextStop ? 3 : 2
        }).addTo(layers);

        const stSeq = stop.sequence || idx + 1;
        const stName = stop.name || knownStation?.name || stop.code;
        const stSched = stop.scheduled_arr || stop.scheduledArrival || 'Start';
        const stPred = stop.predicted_arr || stop.predictedArrival || stSched;

        stMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              <strong style="color: #0284c7; font-size: 13px;">#${stSeq} ${stop.code} — ${stName}</strong>
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.5;">
              <span>Status: <strong style="color: ${isNextStop ? '#0284c7' : isPassed ? '#10b981' : '#64748b'};">${stop.status || (isNextStop ? 'UPCOMING_NEXT' : 'SCHEDULED')}</strong></span><br/>
              <span>Scheduled Arrival: <strong>${stSched}</strong></span><br/>
              <span>Predicted ETA: <strong style="color: #10b981;">${stPred}</strong></span>
            </div>
          </div>
        `);

        stMarker.on('click', () => {
          if (onSelectStation) {
            const fullSt = stations.find(s => s.code === stop.code) || {
              code: stop.code,
              name: stName,
              lat: stLat,
              lng: stLng,
              platforms: stop.platforms || 4,
              zone: 'SCR',
              division: 'Waltair'
            };
            onSelectStation(fullSt);
          }
        });
      });
    }

    // E. Draw Other Monitored Trains along Corridor
    if (Array.isArray(allTrains)) {
      allTrains.filter(t => t.id !== trainNum).forEach(otherTrain => {
        const oDelay = otherTrain.currentDelayMin ?? 0;
        const oColor = oDelay >= 30 ? '#ef4444' : oDelay >= 5 ? '#f59e0b' : '#10b981';
        const oLat = Number(otherTrain.lat) || 17.0005;
        const oLng = Number(otherTrain.lng) || 81.8040;

        if (isNaN(oLat) || isNaN(oLng)) return;

        const oIconHtml = `
          <div style="
            width: 26px;
            height: 26px;
            background: ${oColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 8px ${oColor}88;
            cursor: pointer;
          ">
            <span style="font-size: 10px;">🚆</span>
          </div>
        `;

        const oMarker = L.marker([oLat, oLng], {
          icon: L.divIcon({
            className: 'other-train-marker',
            html: oIconHtml,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        }).addTo(layers);

        oMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #0369a1;">#${otherTrain.id} - ${otherTrain.name}</strong><br/>
            <span>Delay: <strong>+${oDelay}m</strong> | Speed: <strong>${otherTrain.speedKmH} km/h</strong></span><br/>
            <span>Route: ${otherTrain.origin} &rarr; ${otherTrain.destination}</span>
          </div>
        `);

        oMarker.on('click', () => {
          if (onSelectTrain) onSelectTrain(otherTrain);
        });
      });
    }

    // F. Draw Active Selected Train Marker with Heading Arrow & Pulse Animation
    let markerColor = '#10b981';
    let statusLabel = 'ON TIME';
    if (trainDelay >= 30) {
      markerColor = '#ef4444';
      statusLabel = 'SEVERELY DELAYED';
    } else if (trainDelay >= 5) {
      markerColor = '#f59e0b';
      statusLabel = 'DELAYED';
    }

    const trainIconHtml = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        background: ${markerColor};
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 18px ${markerColor}dd;
        cursor: pointer;
        transition: transform 0.4s ease-out;
      ">
        <span style="font-size: 16px;">🚆</span>

        <!-- Directional Bearing Arrow -->
        <div style="
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          background: #0f172a;
          border: 2px solid ${markerColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${trainHeading}deg);
          box-shadow: 0 0 6px rgba(0,0,0,0.8);
        ">
          <span style="font-size: 9px; color: ${markerColor}; line-height: 1; font-weight: 900;">▲</span>
        </div>

        <!-- Live Pulse Ping Ring -->
        <div style="
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2.5px solid ${markerColor};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `;

    const customTrainIcon = L.divIcon({
      className: 'live-active-train-marker',
      html: trainIconHtml,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    if (!isNaN(trainLat) && !isNaN(trainLng)) {
      const activeTrainMarker = L.marker([trainLat, trainLng], {
        icon: customTrainIcon,
        zIndexOffset: 1000
      }).addTo(layers);

      activeTrainMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <strong style="color: #0369a1; font-size: 13px;">#${trainNum} ${trainName}</strong>
          </div>
          <div style="margin-top: 4px; padding: 3px 6px; background: ${markerColor}22; border: 1px solid ${markerColor}55; border-radius: 4px; font-weight: bold; color: ${markerColor};">
            ${statusLabel}: ${trainDelay > 0 ? `+${trainDelay}m` : '0m (On Time)'}
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #475569; line-height: 1.5;">
            <span>Live Speed: <strong>${trainSpeed} km/h</strong> | Heading: <strong>${trainHeading}&deg;</strong></span><br/>
            <span>GPS Block: <strong>${liveTelemetry?.current_location_name || selectedTrain?.currentLocationName || 'Simhachalam North'}</strong></span><br/>
            <span>Next Station: <strong>${liveTelemetry?.next_station_name || selectedTrain?.nextStationName || 'Vizianagaram'}</strong></span><br/>
            <span>Predicted Arrival: <strong style="color: #10b981;">${liveTelemetry?.predicted_arrival || selectedTrain?.predictedNextArrival || '18:42'}</strong></span><br/>
            <span>Telemetry Stream: <strong style="color: ${dataSource === 'LIVE' ? '#10b981' : '#f59e0b'};">${dataSource} MODE</strong></span>
          </div>
        </div>
      `);

      trainMarkerRef.current = activeTrainMarker;
    }

  }, [selectedTrain, allTrains, stations, sections, showCongestion, showStations, geoJsonRouteCoords, routeStops, liveTelemetry]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '580px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--card-shadow)',
      background: 'var(--bg-panel-primary)'
    }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />

      {/* Floating Top-Left Controls & Status Badges */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '420px'
      }}>
        {/* Layer Info Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '8px',
          background: 'rgba(11, 25, 43, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#ffffff',
          boxShadow: 'var(--card-shadow)'
        }}>
          <span className="radar-live-dot" />
          <span>Leaflet + OpenStreetMap Railway GIS</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>#{selectedTrain?.id || '12864'} Route</span>
        </div>

        {/* Map Control Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem',
          borderRadius: '10px',
          background: 'rgba(11, 25, 43, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleCenterOnTrain}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.725rem', borderColor: 'rgba(0, 217, 255, 0.3)', color: 'var(--accent-cyan)' }}
            title="Center view on train GPS position"
          >
            <Locate size={13} />
            <span>Center Train</span>
          </button>
          <button
            onClick={handleZoomFullRoute}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.725rem' }}
            title="Fit view to full route corridor"
          >
            <Maximize2 size={13} />
            <span>Zoom Route</span>
          </button>
          <button
            onClick={() => setShowStations(!showStations)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: showStations ? '1px solid rgba(0, 217, 255, 0.4)' : '1px solid var(--border-subtle)',
              background: showStations ? 'rgba(0, 217, 255, 0.15)' : 'var(--bg-panel-tertiary)',
              color: showStations ? 'var(--accent-cyan)' : 'var(--text-muted)'
            }}
            title="Toggle station stop markers"
          >
            {showStations ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showStations ? 'Stations ON' : 'Stations OFF'}</span>
          </button>
          <button
            onClick={() => setShowCongestion(!showCongestion)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: showCongestion ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              background: showCongestion ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-panel-tertiary)',
              color: showCongestion ? '#fbbf24' : 'var(--text-muted)'
            }}
            title="Toggle track congestion heatmap overlays"
          >
            <Layers size={13} />
            <span>{showCongestion ? 'Congestion ON' : 'Congestion OFF'}</span>
          </button>
        </div>

        {/* Live Route Progress Bar */}
        <div style={{
          padding: '0.65rem 0.75rem',
          borderRadius: '10px',
          background: 'rgba(11, 25, 43, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)',
          fontSize: '0.75rem',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Navigation size={13} color="var(--accent-cyan)" />
              Route Progress
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', background: 'var(--bg-panel-tertiary)', borderRadius: '9999px', height: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                background: 'linear-gradient(90deg, #10b981 0%, #00D9FF 100%)',
                height: '100%',
                borderRadius: '9999px',
                width: `${progressPercent}%`,
                transition: 'width 0.5s ease'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            <span>Traversed: {traversedKm} km</span>
            <span>Total: {totalKm} km</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Right Legend & Data Source Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 10,
        padding: '0.75rem',
        borderRadius: '10px',
        background: 'rgba(11, 25, 43, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.725rem',
        color: 'var(--text-secondary)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        minWidth: '190px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: '#ffffff', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem', marginBottom: '0.15rem' }}>
          <span>Train Status Key</span>
          <span style={{
            fontSize: '0.625rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            fontWeight: 700,
            background: (liveTelemetry?.data_source || 'SIMULATED') === 'LIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: (liveTelemetry?.data_source || 'SIMULATED') === 'LIVE' ? '#34d399' : '#fbbf24',
            border: `1px solid ${(liveTelemetry?.data_source || 'SIMULATED') === 'LIVE' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
          }}>
            {liveTelemetry?.data_source || 'DEMO MODE'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '1.5px solid #ffffff' }} />
          <span>On Time (&lt; 5 min delay)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', border: '1.5px solid #ffffff' }} />
          <span>Delayed (5 – 30 min)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid #ffffff' }} />
          <span>Critical Delay (&gt; 30 min)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderTop: '1px solid rgba(36, 52, 77, 0.5)', paddingTop: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
          <span>Upcoming Next Stop</span>
        </div>
      </div>
    </div>
  );
};
