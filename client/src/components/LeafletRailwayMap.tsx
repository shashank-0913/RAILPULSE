import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Locate, Maximize2, Layers, Eye, EyeOff, Radio, Gauge, Clock, Navigation } from 'lucide-react';
import { Train, Station, Section } from '../types';
import { api } from '../services/api';

interface RouteStop {
  code: string;
  name: string;
  lat: number;
  lng: number;
  sequence: number;
  scheduled_arr: string | null;
  scheduled_dep: string | null;
  predicted_arr: string | null;
  distance_km: number;
  platforms: number;
  status: 'PASSED' | 'UPCOMING_NEXT' | 'UPCOMING' | 'DESTINATION';
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
          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const latLngs: [number, number][] = rawCoords.map((c: number[]) => [c[1], c[0]]);
          setGeoJsonRouteCoords(latLngs);

          if (feature.properties) {
            setTotalKm(feature.properties.total_distance_km || 1662);
            setTraversedKm(feature.properties.traversed_distance_km || 875);
            setProgressPercent(feature.properties.progress_percent || 52.6);
          }
        }

        if (routeData && routeData.stops) {
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
    const lat = liveTelemetry?.latitude || selectedTrain?.lat || 17.8420;
    const lng = liveTelemetry?.longitude || selectedTrain?.lng || 83.3320;
    mapInstanceRef.current.setView([lat, lng], 10, { animate: true });
  }, [liveTelemetry, selectedTrain]);

  // Zoom to Complete Route Action
  const handleZoomFullRoute = useCallback(() => {
    if (!mapInstanceRef.current || geoJsonRouteCoords.length === 0) return;
    const bounds = L.latLngBounds(geoJsonRouteCoords);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
  }, [geoJsonRouteCoords]);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.8, 83.3],
        zoom: 7,
        zoomControl: true,
        attributionControl: true
      });

      // Standard OpenStreetMap Tile Layer with Required Attribution (No Paid Map Key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | RailPulse Live GIS'
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Safe window resize listener to redraw tiles cleanly on rotation or viewport resize
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
    const activeRoute: [number, number][] = geoJsonRouteCoords.length > 0 ? geoJsonRouteCoords : [
      [22.5838, 88.3426], [22.3361, 87.3278], [20.4625, 85.8830], [20.2666, 85.8436],
      [20.1772, 85.7412], [19.3150, 84.7941], [18.7725, 84.4172], [18.2949, 83.8938],
      [18.1124, 83.4168], [17.8420, 83.3320], [17.7215, 83.2872], [17.7058, 83.1554],
      [17.6913, 83.0039], [17.0494, 82.1704], [17.0005, 81.7800], [16.8130, 81.5266],
      [16.7107, 81.0952], [16.5186, 80.6200], [13.0827, 80.2707]
    ];

    // Train Current GPS Position
    const trainLat = liveTelemetry?.latitude ?? selectedTrain?.lat ?? 17.8420;
    const trainLng = liveTelemetry?.longitude ?? selectedTrain?.lng ?? 83.3320;
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
    // Find closest vertex to current train coordinate to split traversed vs upcoming
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

    // Traversed Track (Solid Emerald Glow)
    if (traversedPoints.length > 1) {
      L.polyline(traversedPoints, {
        color: '#10b981',
        weight: 4,
        opacity: 0.95
      }).addTo(layers);
    }

    // Remaining Track (Dashed Cyan Route)
    if (remainingPoints.length > 1) {
      L.polyline(remainingPoints, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '6, 6'
      }).addTo(layers);
    }

    // C. Section Congestion Heat Overlays
    if (showCongestion) {
      sections.forEach(sec => {
        const fromSt = stations.find(s => s.code === sec.from);
        const toSt = stations.find(s => s.code === sec.to);
        if (fromSt && toSt) {
          const congColor = sec.congestionLevel === 'CRITICAL' || sec.congestionLevel === 'HIGH' ? '#ef4444' : (sec.congestionLevel === 'MEDIUM' ? '#f59e0b' : '#10b981');
          const congPoly = L.polyline([
            [fromSt.lat, fromSt.lng],
            [toSt.lat, toSt.lng]
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

    // D. Draw Station Stop Markers (from GeoJSON Route Stops)
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

      activeStops.forEach(stop => {
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

        const stMarker = L.circleMarker([stop.lat, stop.lng], {
          radius,
          color: stColor,
          fillColor,
          fillOpacity: 1,
          weight: isNextStop ? 3 : 2
        }).addTo(layers);

        stMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              <strong style="color: #0284c7; font-size: 13px;">#${stop.sequence} ${stop.code} — ${stop.name}</strong>
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.5;">
              <span>Status: <strong style="color: ${isNextStop ? '#0284c7' : isPassed ? '#10b981' : '#64748b'};">${stop.status}</strong></span><br/>
              <span>Distance from Source: <strong>${stop.distance_km} km</strong></span><br/>
              <span>Platforms: <strong>${stop.platforms}</strong></span><br/>
              <span>Scheduled Arrival: <strong>${stop.scheduled_arr || 'Start'}</strong></span><br/>
              <span>Predicted ETA: <strong style="color: #10b981;">${stop.predicted_arr || stop.scheduled_arr || 'N/A'}</strong></span>
            </div>
          </div>
        `);

        stMarker.on('click', () => {
          if (onSelectStation) {
            const fullSt = stations.find(s => s.code === stop.code) || {
              code: stop.code,
              name: stop.name,
              lat: stop.lat,
              lng: stop.lng,
              platforms: stop.platforms,
              zone: 'SCR',
              division: 'Waltair'
            };
            onSelectStation(fullSt);
          }
        });
      });
    }

    // E. Draw Other Monitored Trains along Corridor
    allTrains.filter(t => t.id !== trainNum).forEach(otherTrain => {
      const oDelay = otherTrain.currentDelayMin ?? 0;
      const oColor = oDelay >= 30 ? '#ef4444' : oDelay >= 5 ? '#f59e0b' : '#10b981';
      const oLat = otherTrain.lat ?? 17.0005;
      const oLng = otherTrain.lng ?? 81.8040;

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

    // F. Draw Active Selected Train Marker with Heading Arrow & Pulse Animation
    let markerColor = '#10b981'; // 🟢 ON TIME
    let statusLabel = 'ON TIME';
    if (trainDelay >= 30) {
      markerColor = '#ef4444'; // 🔴 SEVERELY DELAYED
      statusLabel = 'SEVERELY DELAYED';
    } else if (trainDelay >= 5) {
      markerColor = '#f59e0b'; // 🟡 DELAYED
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

        <!-- Directional Bearing Arrow (Rotates based on heading_deg) -->
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

  }, [selectedTrain, allTrains, stations, sections, showCongestion, showStations, geoJsonRouteCoords, routeStops, liveTelemetry]);

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top-Left Controls & Status Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[420px]">
        {/* Layer Info Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-xs font-semibold text-white shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Leaflet + OpenStreetMap Railway GIS</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-mono">#{selectedTrain?.id || '12864'} Route</span>
        </div>

        {/* Map Control Toolbar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-xl flex-wrap">
          <button
            onClick={handleCenterOnTrain}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold transition-colors border border-cyan-500/30 shadow"
            title="Center view on train GPS position"
          >
            <Locate size={14} />
            <span>Center Train</span>
          </button>
          <button
            onClick={handleZoomFullRoute}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors border border-slate-600 shadow"
            title="Fit view to full route corridor"
          >
            <Maximize2 size={14} />
            <span>Zoom Route</span>
          </button>
          <button
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow ${
              showStations ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Toggle station stop markers"
          >
            {showStations ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{showStations ? 'Stations ON' : 'Stations OFF'}</span>
          </button>
          <button
            onClick={() => setShowCongestion(!showCongestion)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow ${
              showCongestion ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Toggle track congestion heatmap overlays"
          >
            <Layers size={14} />
            <span>{showCongestion ? 'Congestion ON' : 'Congestion OFF'}</span>
          </button>
        </div>

        {/* Live Route Progress Bar */}
        <div className="p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-xl text-xs text-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-white flex items-center gap-1">
              <Navigation size={13} color="#06b6d4" />
              Route Progress
            </span>
            <span className="font-mono text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>Traversed: {traversedKm} km</span>
            <span>Total: {totalKm} km</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Right Legend & Data Source Indicator */}
      <div className="absolute bottom-4 right-4 z-10 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-xs text-slate-300 shadow-2xl space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between font-bold text-white text-[11px] uppercase tracking-wider mb-1 border-b border-slate-700/60 pb-1">
          <span>Train Status Key</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
            (liveTelemetry?.data_source || 'SIMULATED') === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {liveTelemetry?.data_source || 'DEMO MODE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/60"></span>
          <span>🟢 On Time (&lt; 5 min delay)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white/60"></span>
          <span>🟡 Delayed (5 – 30 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white/60"></span>
          <span>🔴 Critical Delay (&gt; 30 min)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60 text-[10px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Upcoming Next Stop</span>
        </div>
      </div>
    </div>
  );
};


