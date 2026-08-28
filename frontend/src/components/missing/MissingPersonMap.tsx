'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MissingPerson } from '@/types';
import { MapPin, Phone, Heart, Users, CheckCircle } from 'lucide-react';

interface MissingPersonMapProps {
  persons: MissingPerson[];
  onSelectPerson?: (person: MissingPerson) => void;
}

export const MissingPersonMap: React.FC<MissingPersonMapProps> = ({ persons, onSelectPerson }) => {
  const center: [number, number] = [28.6250, 77.2200];

  const createPersonIcon = (person: MissingPerson) => {
    const borderColor =
      person.status === 'missing'
        ? '#ef4444'
        : person.status === 'spotted'
        ? '#f59e0b'
        : person.status === 'sheltered'
        ? '#06b6d4'
        : '#10b981';

    return L.divIcon({
      className: 'custom-missing-pin',
      html: `
        <div class="relative group cursor-pointer">
          <div class="w-11 h-11 rounded-full border-2 overflow-hidden shadow-lg" style="border-color: ${borderColor}; box-shadow: 0 0 14px ${borderColor};">
            <img src="${person.photoUrl}" class="w-full h-full object-cover" alt="${person.name}" />
          </div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black border border-white" style="background-color: ${borderColor};">
            ${person.status === 'missing' ? '!' : '✓'}
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  };

  const createTipIcon = () => {
    return L.divIcon({
      className: 'custom-tip-pin',
      html: `
        <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] text-black font-black shadow-[0_0_10px_#f59e0b] animate-bounce">
          👁️
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-tactical-700/80 shadow-2xl relative bg-tactical-950">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {persons.map((person) => {
          const lat = person.lastSeenLocation?.lat || 28.6185;
          const lng = person.lastSeenLocation?.lng || 77.2115;

          return (
            <React.Fragment key={person._id}>
              {/* Last Seen Location Pin */}
              <Marker
                position={[lat, lng]}
                icon={createPersonIcon(person)}
                eventHandlers={{
                  click: () => onSelectPerson && onSelectPerson(person),
                }}
              >
                <Popup>
                  <div className="p-2 font-mono text-xs max-w-[240px] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 flex-shrink-0">
                        <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm leading-tight">{person.name}</div>
                        <div className="text-[10px] text-slate-400">Age: {person.age} ({person.gender})</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      <strong>Last Seen:</strong> {person.lastSeenLocation.addressName}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      <strong>Medical:</strong> {person.medicalConditions}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                      <span className="text-[9px] uppercase font-bold text-cyan-400">
                        STATUS: {person.status}
                      </span>
                      <span className="text-[9px] text-slate-500">{person.tips.length} tips</span>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Radius of interest */}
              <Circle
                center={[lat, lng]}
                radius={400}
                pathOptions={{
                  color: person.status === 'missing' ? '#ef4444' : '#06b6d4',
                  fillColor: person.status === 'missing' ? '#ef4444' : '#06b6d4',
                  fillOpacity: 0.12,
                  weight: 1,
                }}
              />

              {/* Community Sighting Tips Pins */}
              {person.tips.map((tip, tIdx) => {
                if (tip.location?.lat && tip.location?.lng) {
                  return (
                    <Marker
                      key={`tip-${person._id}-${tIdx}`}
                      position={[tip.location.lat, tip.location.lng]}
                      icon={createTipIcon()}
                    >
                      <Popup>
                        <div className="p-2 font-mono text-xs max-w-[220px] space-y-1">
                          <div className="font-bold text-amber-400">👁️ SIGHTING TIP: {person.name}</div>
                          <div className="text-slate-300 text-[11px]">&ldquo;{tip.comment}&rdquo;</div>
                          <div className="text-[10px] text-slate-500">
                            By {tip.reporterName} • {new Date(tip.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
export default MissingPersonMap;
