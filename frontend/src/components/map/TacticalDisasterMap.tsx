'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useSocket } from '@/context/SocketContext';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Circle,
  Polyline,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Compass,
  MapPin,
  Flame,
  Droplets,
  AlertCircle,
  ShieldCheck,
  Navigation,
  Activity,
  Play,
  Pause,
  Maximize2,
  Camera,
  Battery,
  Users
} from 'lucide-react';

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const TacticalDisasterMap: React.FC = () => {
  const { incidents, sosBeacons, responders, shelters, setActiveTab } = useEmergency();
  const { socket } = useSocket();

  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6185, 77.2150]);
  const [zoomLevel, setZoomLevel] = useState<number>(13);

  // Map Tile Providers (Mapbox / CartoDB / Esri Satellite)
  const [tileProvider, setTileProvider] = useState<'mapbox_dark' | 'satellite' | 'carto_dark' | 'osm'>('mapbox_dark');
  const [mapboxToken, setMapboxToken] = useState<string>(
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWVnaXMtcHVsc2UiLCJhIjoiY2x6cHVsc2VnbTAwMTJrb2Rlc2luZXRhIn0.demo'
  );

  // Layer Visibility
  const [showFloods, setShowFloods] = useState(true);
  const [showFires, setShowFires] = useState(true);
  const [showCollapses, setShowCollapses] = useState(true);
  const [showSOS, setShowSOS] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRadarGrid, setShowRadarGrid] = useState(true);
  const [showDynamicRoute, setShowDynamicRoute] = useState(true);
  const [showHeatmapCircles, setShowHeatmapCircles] = useState(true);

  // Real-time Fleet Simulation State
  const [isSimulatingFleet, setIsSimulatingFleet] = useState(false);
  const fleetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Routing Demonstration Overlay
  const safeRouteWaypoints: [number, number][] = [
    [28.6185, 77.2115], // Origin: SOS-8812 (Trapped in Flood Balcony)
    [28.6110, 77.2020], // Waypoint 1: Avoid Flood Inundation Barrier
    [28.6020, 77.1980], // Waypoint 2: Elevated Ridge Highway
    [28.5950, 77.2050], // Destination: Indira Memorial Sports Complex Shelter
  ];

  const directBlockedPath: [number, number][] = [
    [28.6185, 77.2115],
    [28.6060, 77.2180], // Direct hazard intersection (Flood & Gas Fire)
    [28.5950, 77.2050],
  ];

  // Custom Neon Leaflet Markers
  const icons = useMemo(() => {
    return {
      sosRed: L.divIcon({
        className: 'custom-sos-icon',
        html: `<div class="relative flex items-center justify-center">
                 <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-red-500 opacity-90"></span>
                 <span class="absolute inline-flex h-6 w-6 rounded-full bg-red-600/40 animate-pulse"></span>
                 <div class="relative w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-800 border-2 border-white flex items-center justify-center shadow-[0_0_20px_#ff003c] text-[10px] text-white font-black">SOS</div>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      sosYellow: L.divIcon({
        className: 'custom-sos-yellow',
        html: `<div class="relative flex items-center justify-center">
                 <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-amber-500 opacity-80"></span>
                 <div class="relative w-6 h-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-[0_0_15px_#ffb703] text-[10px] text-black font-black">!</div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
      responderBoat: L.divIcon({
        className: 'custom-resp-boat',
        html: `<div class="w-9 h-9 rounded-xl bg-cyan-950 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_#00f0ff] font-bold text-sm">⛵</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      responderMedic: L.divIcon({
        className: 'custom-resp-medic',
        html: `<div class="w-9 h-9 rounded-xl bg-emerald-950 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shadow-[0_0_15px_#00e676] font-bold text-sm">🚑</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      responderFire: L.divIcon({
        className: 'custom-resp-fire',
        html: `<div class="w-9 h-9 rounded-xl bg-orange-950 border-2 border-orange-400 text-orange-300 flex items-center justify-center shadow-[0_0_15px_#f97316] font-bold text-sm">🚒</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      responderK9: L.divIcon({
        className: 'custom-resp-k9',
        html: `<div class="w-9 h-9 rounded-xl bg-purple-950 border-2 border-purple-400 text-purple-300 flex items-center justify-center shadow-[0_0_15px_#b5179e] font-bold text-sm">🐕</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      responderDrone: L.divIcon({
        className: 'custom-resp-drone',
        html: `<div class="w-9 h-9 rounded-xl bg-sky-950 border-2 border-sky-400 text-sky-300 flex items-center justify-center shadow-[0_0_15px_#38bdf8] font-bold text-sm">🛸</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      shelter: L.divIcon({
        className: 'custom-shelter-icon',
        html: `<div class="w-9 h-9 rounded-xl bg-emerald-950 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.7)] font-bold text-sm">🏥</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      waypoint: L.divIcon({
        className: 'custom-waypoint-icon',
        html: `<div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_#00f0ff]"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    };
  }, []);

  const getResponderIcon = (role: string) => {
    if (role === 'swift_water') return icons.responderBoat;
    if (role === 'paramedic') return icons.responderMedic;
    if (role === 'firefighter') return icons.responderFire;
    if (role === 'k9_search') return icons.responderK9;
    if (role === 'drone_pilot') return icons.responderDrone;
    return icons.responderMedic;
  };

  // Real-Time Fleet Movement Simulation
  useEffect(() => {
    if (isSimulatingFleet) {
      fleetIntervalRef.current = setInterval(() => {
        if (responders.length > 0 && socket) {
          const randomIdx = Math.floor(Math.random() * responders.length);
          const targetResp = responders[randomIdx];
          const latDelta = (Math.random() - 0.5) * 0.003;
          const lngDelta = (Math.random() - 0.5) * 0.003;

          const updatedPos = {
            lat: +(targetResp.location.lat + latDelta).toFixed(5),
            lng: +(targetResp.location.lng + lngDelta).toFixed(5),
          };

          socket.emit('responder:update_location', {
            responderId: targetResp._id,
            location: updatedPos,
            status: 'en_route',
          });
        }
      }, 2500);
    } else {
      if (fleetIntervalRef.current) {
        clearInterval(fleetIntervalRef.current);
      }
    }
    return () => {
      if (fleetIntervalRef.current) clearInterval(fleetIntervalRef.current);
    };
  }, [isSimulatingFleet, responders, socket]);

  // Tile Provider URL with Mapbox AI Vector & Satellite fallback
  const getTileUrl = () => {
    if (tileProvider === 'mapbox_dark' && mapboxToken && mapboxToken.startsWith('pk.')) {
      return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
    }
    if (tileProvider === 'satellite') {
      if (mapboxToken && mapboxToken.startsWith('pk.')) {
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      }
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (tileProvider === 'osm') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    // High-performance Dark Matter GIS tiles (CartoDB / Mapbox Dark equivalent)
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[640px] rounded-2xl overflow-hidden border border-tactical-700/80 shadow-2xl bg-tactical-950">
      {/* Top Left: Map Tile Provider & Tactical Layer HUD */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-xs">
        <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/40 shadow-2xl backdrop-blur-xl space-y-3 font-mono text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-tactical-700/60 pb-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Layers className="w-4 h-4 text-tactical-accent" />
              <span>GIS RADAR CONTROLS</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Map Tile Style Switcher */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-bold">MAP ENGINE & BASEMAP:</label>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                onClick={() => setTileProvider('mapbox_dark')}
                className={`p-1.5 rounded-lg border text-center font-bold transition-all ${
                  tileProvider === 'mapbox_dark'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                    : 'bg-tactical-900 border-tactical-700 text-slate-400 hover:text-white'
                }`}
              >
                🌌 Mapbox Dark
              </button>
              <button
                onClick={() => setTileProvider('satellite')}
                className={`p-1.5 rounded-lg border text-center font-bold transition-all ${
                  tileProvider === 'satellite'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                    : 'bg-tactical-900 border-tactical-700 text-slate-400 hover:text-white'
                }`}
              >
                🛰️ Satellite Recon
              </button>
            </div>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              onClick={() => setShowSOS(!showSOS)}
              className={`p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                showSOS ? 'bg-red-950 border-red-500 text-red-300 font-bold' : 'bg-tactical-900 border-tactical-800 text-slate-500'
              }`}
            >
              <span>🚨 SOS ({sosBeacons.length})</span>
              <span>{showSOS ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowResponders(!showResponders)}
              className={`p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                showResponders ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold' : 'bg-tactical-900 border-tactical-800 text-slate-500'
              }`}
            >
              <span>🚁 Fleet ({responders.length})</span>
              <span>{showResponders ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowFloods(!showFloods)}
              className={`p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                showFloods ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold' : 'bg-tactical-900 border-tactical-800 text-slate-500'
              }`}
            >
              <span>🌊 Floods</span>
              <span>{showFloods ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowFires(!showFires)}
              className={`p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                showFires ? 'bg-orange-950 border-orange-500 text-orange-300 font-bold' : 'bg-tactical-900 border-tactical-800 text-slate-500'
              }`}
            >
              <span>🔥 Fires</span>
              <span>{showFires ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                showShelters ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold' : 'bg-tactical-900 border-tactical-800 text-slate-500'
              }`}
            >
              <span>🏥 Shelters</span>
              <span>{showShelters ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowDynamicRoute(!showDynamicRoute)}
              className={`p-1.5 rounded-lg flex items-center justify-between border transition-all ${
                showDynamicRoute ? 'bg-tactical-800 border-cyan-400 text-cyan-300 font-bold' : 'bg-tactical-900 border-tactical-800 text-slate-500'
              }`}
            >
              <span>🛣️ Safe Routes</span>
              <span>{showDynamicRoute ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Real-Time Live Fleet Simulation Toggle */}
          <button
            onClick={() => setIsSimulatingFleet(!isSimulatingFleet)}
            className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              isSimulatingFleet
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-tactical-800 hover:bg-tactical-700 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {isSimulatingFleet ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulatingFleet ? 'LIVE GPS FLEET SIM ACTIVE' : '⚡ SIMULATE FLEET MOVEMENT'}</span>
          </button>
        </div>
      </div>

      {/* Top Right: Route & Hazard Telemetry HUD */}
      <div className="absolute top-4 right-4 z-[1000] hidden sm:flex flex-col gap-2 max-w-sm">
        <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/40 font-mono text-xs text-slate-300 shadow-2xl backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between border-b border-tactical-700 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Compass className="w-4 h-4 text-tactical-accent animate-spin" />
              <span>DYNAMIC ROUTE SOLVER</span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 text-[9px] font-bold">
              AI OPTIMIZED
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Direct Straight Path:</span>
              <span className="text-red-400 font-bold">⛔ Blocked by Flood Inundation</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Diverted Evacuation Path:</span>
              <span className="text-cyan-300 font-bold">✅ 4.2 km (ETA ~8 min)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Safe Haven:</span>
              <span className="text-emerald-400 font-bold">Indira Sports Complex</span>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Overlay Grid Animation */}
      {showRadarGrid && (
        <div className="absolute inset-0 z-[500] pointer-events-none radar-grid opacity-25">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-tactical-accent/20">
            <div className="w-full h-full animate-radar-slow origin-center bg-gradient-to-tr from-tactical-accent/20 via-transparent to-transparent rounded-full" />
          </div>
        </div>
      )}

      {/* Leaflet Map View */}
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapController center={mapCenter} zoom={zoomLevel} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; Mapbox'
          url={getTileUrl()}
        />

        {/* Dynamic Safe Route Polyline (Electric Cyan Solid) */}
        {showDynamicRoute && (
          <>
            <Polyline
              positions={safeRouteWaypoints}
              pathOptions={{
                color: '#00f0ff',
                weight: 5,
                opacity: 0.9,
                dashArray: undefined,
              }}
            >
              <Popup>
                <div className="p-1 font-mono text-xs text-cyan-300 space-y-1">
                  <div className="font-bold">✅ AI COMPUTED SAFE EVACUATION ROUTE</div>
                  <div className="text-slate-300 text-[11px]">Distance: 4.2 km | Bypasses active flood barrier</div>
                </div>
              </Popup>
            </Polyline>

            {/* Direct Blocked Hazard Path (Red Dashed) */}
            <Polyline
              positions={directBlockedPath}
              pathOptions={{
                color: '#ff003c',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 8',
              }}
            >
              <Popup>
                <div className="p-1 font-mono text-xs text-red-300 space-y-1">
                  <div className="font-bold">⛔ DIRECT PATH IMPASSABLE</div>
                  <div className="text-red-200 text-[11px]">Direct path blocked by 2.4m floodwater and structural debris</div>
                </div>
              </Popup>
            </Polyline>

            {/* Waypoint Pins */}
            {safeRouteWaypoints.map((wp, idx) => (
              <Marker key={`wp-${idx}`} position={wp} icon={icons.waypoint}>
                <Popup>
                  <div className="p-1 font-mono text-xs text-slate-200">
                    <span className="font-bold text-cyan-300">Waypoint {idx + 1}</span>: Clear corridor
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* Danger Zone Polygons: Floods */}
        {showFloods &&
          incidents
            .filter((inc) => inc.type === 'flood' && inc.dangerPolygon?.length > 2)
            .map((inc) => (
              <React.Fragment key={`flood-${inc._id}`}>
                <Polygon
                  positions={inc.dangerPolygon}
                  pathOptions={{
                    color: '#00f0ff',
                    fillColor: '#00f0ff',
                    fillOpacity: 0.35,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1.5 font-mono text-xs">
                      <div className="font-bold text-cyan-400 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{inc.title}</span>
                      </div>
                      <div className="text-slate-300 text-[11px]">{inc.description}</div>
                      <div className="text-cyan-300 font-bold">
                        Water Level: {inc.hazardMetrics.waterDepthMeters}m | Severity: {inc.severity.toUpperCase()}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
                {showHeatmapCircles && (
                  <Circle
                    center={[inc.location.lat, inc.location.lng]}
                    radius={inc.radiusMeters}
                    pathOptions={{
                      color: '#0284c7',
                      fillColor: '#0284c7',
                      fillOpacity: 0.18,
                      weight: 1
                    }}
                  />
                )}
              </React.Fragment>
            ))}

        {/* Danger Zone Polygons: Fire */}
        {showFires &&
          incidents
            .filter((inc) => inc.type === 'fire' && inc.dangerPolygon?.length > 2)
            .map((inc) => (
              <React.Fragment key={`fire-${inc._id}`}>
                <Polygon
                  positions={inc.dangerPolygon}
                  pathOptions={{
                    color: '#ff003c',
                    fillColor: '#ff003c',
                    fillOpacity: 0.45,
                    weight: 2,
                    dashArray: '4, 4'
                  }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1.5 font-mono text-xs">
                      <div className="font-bold text-red-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{inc.title}</span>
                      </div>
                      <div className="text-slate-300 text-[11px]">{inc.description}</div>
                      <div className="text-red-300 font-bold">
                        Temp: {inc.hazardMetrics.temperatureCelsius}°C | Damage: {inc.hazardMetrics.structuralDamageIndex}%
                      </div>
                    </div>
                  </Popup>
                </Polygon>
                {showHeatmapCircles && (
                  <Circle
                    center={[inc.location.lat, inc.location.lng]}
                    radius={inc.radiusMeters}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: 0.22,
                      weight: 1
                    }}
                  />
                )}
              </React.Fragment>
            ))}

        {/* Danger Zone Polygons: Structural Collapse */}
        {showCollapses &&
          incidents
            .filter((inc) => inc.type === 'collapse' && inc.dangerPolygon?.length > 2)
            .map((inc) => (
              <React.Fragment key={`collapse-${inc._id}`}>
                <Polygon
                  positions={inc.dangerPolygon}
                  pathOptions={{
                    color: '#ffb703',
                    fillColor: '#ffb703',
                    fillOpacity: 0.4,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1.5 font-mono text-xs">
                      <div className="font-bold text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{inc.title}</span>
                      </div>
                      <div className="text-slate-300 text-[11px]">{inc.description}</div>
                      <div className="text-yellow-300 font-bold">
                        Structural Damage Index: {inc.hazardMetrics.structuralDamageIndex}%
                      </div>
                    </div>
                  </Popup>
                </Polygon>
                {showHeatmapCircles && (
                  <Circle
                    center={[inc.location.lat, inc.location.lng]}
                    radius={inc.radiusMeters}
                    pathOptions={{
                      color: '#eab308',
                      fillColor: '#eab308',
                      fillOpacity: 0.18,
                      weight: 1
                    }}
                  />
                )}
              </React.Fragment>
            ))}

        {/* SOS Beacon Distress Pins (With Live Photo Thumbnails) */}
        {showSOS &&
          sosBeacons.map((beacon) => (
            <Marker
              key={beacon._id}
              position={[beacon.location.lat, beacon.location.lng]}
              icon={beacon.urgency === 'critical' ? icons.sosRed : icons.sosYellow}
            >
              <Popup>
                <div className="p-2 space-y-2 font-mono text-xs max-w-[260px]">
                  <div className="flex items-center justify-between border-b border-tactical-700 pb-1">
                    <span className="font-bold text-red-400">{beacon.sosId}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 text-red-300 border border-red-600 uppercase font-bold">
                      {beacon.urgency}
                    </span>
                  </div>

                  <div className="text-slate-200">
                    <div className="font-bold text-white text-sm">{beacon.userName}</div>
                    <div className="text-[11px] text-slate-400">Emergency: <strong className="text-red-300">{beacon.emergencyType}</strong></div>
                    <div className="text-[11px] text-slate-400">Survivors: <strong>{beacon.peopleCount}</strong> | Battery: <strong className="text-emerald-400">{beacon.batteryLevel}%</strong></div>
                  </div>

                  {/* Dual Camera Snapshot Previews */}
                  <div className="flex gap-1.5">
                    {beacon.frontCameraImage && (
                      <div className="w-1/2 h-16 rounded overflow-hidden border border-tactical-700 bg-black">
                        <img src={beacon.frontCameraImage} alt="Front" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {beacon.backCameraImage && (
                      <div className="w-1/2 h-16 rounded overflow-hidden border border-tactical-700 bg-black">
                        <img src={beacon.backCameraImage} alt="Rear" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {beacon.notes && (
                    <div className="p-1.5 rounded bg-tactical-900 border border-tactical-700 text-[11px] text-slate-300 italic">
                      &ldquo;{beacon.notes}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => setActiveTab('routing')}
                      className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors"
                    >
                      Route Rescue
                    </button>
                    <button
                      onClick={() => setActiveTab('dispatch')}
                      className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
                    >
                      Auto Dispatch
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Responders GPS Live Moving Markers */}
        {showResponders &&
          responders.map((resp) => (
            <Marker
              key={resp._id}
              position={[resp.location.lat, resp.location.lng]}
              icon={getResponderIcon(resp.role)}
            >
              <Popup>
                <div className="p-2 space-y-1.5 font-mono text-xs">
                  <div className="font-bold text-cyan-400 text-sm">{resp.callsign}</div>
                  <div className="text-slate-200">{resp.name}</div>
                  <div className="text-[11px] text-slate-400">Role: <strong className="text-cyan-300">{resp.role.toUpperCase()}</strong></div>
                  <div className="text-[11px] text-slate-400">Vehicle: <strong className="text-slate-200">{resp.vehicleType}</strong></div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-emerald-400 uppercase">{resp.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Safe Shelters */}
        {showShelters &&
          shelters.map((shelt) => (
            <Marker
              key={shelt._id}
              position={[shelt.location.lat, shelt.location.lng]}
              icon={icons.shelter}
            >
              <Popup>
                <div className="p-2 space-y-1.5 font-mono text-xs max-w-[240px]">
                  <div className="font-bold text-emerald-400 text-sm">{shelt.name}</div>
                  <div className="text-[11px] text-slate-300">{shelt.location.address}</div>
                  <div className="text-[11px] text-slate-400">
                    Occupancy: <strong className="text-white">{shelt.occupied} / {shelt.capacity} Beds</strong>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (shelt.occupied / shelt.capacity) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('shelters')}
                    className="w-full mt-1 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors"
                  >
                    View Relief Inventory
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};
