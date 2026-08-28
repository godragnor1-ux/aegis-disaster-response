'use client';

import React, { useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  Circle
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Incident, Shelter, SafeRouteResult } from '@/types';
import { ShieldCheck, AlertTriangle, Navigation, MapPin, Hospital } from 'lucide-react';

interface SafeNavigationMapProps {
  startCoords: [number, number];
  destinationCoords: [number, number];
  startName?: string;
  destinationName?: string;
  routeResult: SafeRouteResult | null;
  incidents: Incident[];
  shelters: Shelter[];
}

export const SafeNavigationMap: React.FC<SafeNavigationMapProps> = ({
  startCoords,
  destinationCoords,
  startName = 'Origin Location',
  destinationName = 'Target Safe Haven',
  routeResult,
  incidents,
  shelters,
}) => {
  const mapCenter: [number, number] = [
    (startCoords[0] + destinationCoords[0]) / 2,
    (startCoords[1] + destinationCoords[1]) / 2,
  ];

  const icons = useMemo(() => {
    return {
      origin: L.divIcon({
        className: 'custom-origin-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-cyan-400 opacity-80"></span>
            <div class="relative w-8 h-8 rounded-full bg-cyan-950 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_#00f0ff] font-black text-xs">
              📍
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
      shelter: L.divIcon({
        className: 'custom-dest-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-500 opacity-75"></span>
            <div class="relative w-9 h-9 rounded-xl bg-emerald-950 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shadow-[0_0_20px_#10b981] font-bold text-sm">
              🏥
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      waypoint: L.divIcon({
        className: 'custom-wp-icon',
        html: `
          <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_10px_#00f0ff]"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
      blockedPoint: L.divIcon({
        className: 'custom-blocked-icon',
        html: `
          <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-black shadow-[0_0_15px_#ff003c] animate-pulse">
            ✕
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    };
  }, []);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-tactical-700/80 shadow-2xl relative bg-tactical-950">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        {/* 1. Active Hazard Polygons */}
        {incidents.map((inc) => {
          const isFlood = inc.type === 'flood';
          const isFire = inc.type === 'fire';
          const color = isFlood ? '#00f0ff' : isFire ? '#ff003c' : '#ffb703';

          return (
            <React.Fragment key={inc._id}>
              {inc.dangerPolygon && inc.dangerPolygon.length > 2 && (
                <Polygon
                  positions={inc.dangerPolygon}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.38,
                    weight: 2,
                    dashArray: '5, 5',
                  }}
                >
                  <Popup>
                    <div className="p-1 font-mono text-xs text-white space-y-1">
                      <div className="font-bold text-red-400">{inc.title}</div>
                      <div className="text-[10px] text-slate-300">Hazard Perimeter: Active Inundation / Flame Barrier</div>
                    </div>
                  </Popup>
                </Polygon>
              )}

              <Circle
                center={[inc.location.lat, inc.location.lng]}
                radius={inc.radiusMeters}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 1,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* 2. Direct Impassable Path (Dashed Red) if Hazard Detected */}
        {routeResult?.directPathHazard && routeResult.directPath && (
          <>
            <Polyline
              positions={routeResult.directPath}
              pathOptions={{
                color: '#ff003c',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 8',
              }}
            >
              <Popup>
                <div className="p-1.5 font-mono text-xs text-red-300 space-y-1">
                  <div className="font-bold">⛔ DIRECT PATH IMPASSABLE</div>
                  <div className="text-slate-300 text-[10px]">{routeResult.hazardDetails}</div>
                </div>
              </Popup>
            </Polyline>

            {/* Blocked Hazard Warning Icon at midpoint */}
            {routeResult.directPath.length > 3 && (
              <Marker
                position={routeResult.directPath[Math.floor(routeResult.directPath.length / 2)]}
                icon={icons.blockedPoint}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs text-red-400 font-bold">
                    ⛔ HAZARD INTERSECTION POINT
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* 3. Safest Diverted Evacuation Route (Solid Electric Cyan) */}
        {routeResult?.safeWaypoints && (
          <>
            <Polyline
              positions={routeResult.safeWaypoints}
              pathOptions={{
                color: '#00f0ff',
                weight: 5,
                opacity: 0.95,
              }}
            >
              <Popup>
                <div className="p-1.5 font-mono text-xs text-cyan-300 space-y-1">
                  <div className="font-bold">✅ SAFEST EVACUATION CORRIDOR</div>
                  <div className="text-slate-200 text-[10px]">
                    Distance: {routeResult.distanceKm} km | ETA: ~{routeResult.etaMinutes} mins
                  </div>
                </div>
              </Popup>
            </Polyline>

            {/* Waypoint Milestone Pins */}
            {routeResult.safeWaypoints.slice(1, -1).map((wp, idx) => (
              <Marker key={`nav-wp-${idx}`} position={wp} icon={icons.waypoint}>
                <Popup>
                  <div className="p-1 font-mono text-xs text-slate-200">
                    <span className="font-bold text-cyan-300">Waypoint #{idx + 1}</span>: Clear Standoff Corridor
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* 4. Origin & Destination Markers */}
        <Marker position={startCoords} icon={icons.origin}>
          <Popup>
            <div className="p-1 font-mono text-xs text-cyan-300">
              <div className="font-bold">📍 ORIGIN</div>
              <div className="text-slate-200 text-[11px]">{startName}</div>
            </div>
          </Popup>
        </Marker>

        <Marker position={destinationCoords} icon={icons.shelter}>
          <Popup>
            <div className="p-1.5 font-mono text-xs text-emerald-300 space-y-1">
              <div className="font-bold">🏥 TARGET SAFE HAVEN</div>
              <div className="text-white text-[11px]">{destinationName}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
export default SafeNavigationMap;
