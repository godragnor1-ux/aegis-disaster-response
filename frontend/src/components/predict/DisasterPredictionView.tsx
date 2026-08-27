'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wind,
  Droplets,
  Activity,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Compass
} from 'lucide-react';

export const DisasterPredictionView: React.FC = () => {
  const [predictions, setPredictions] = useState<{
    cycloneForecast: {
      systemName: string;
      category: string;
      currentWindSpeedKmh: number;
      pressureHPa: number;
      projectedLandfallHours: number;
      trajectoryPoints: { hoursOut: number; lat: number; lng: number; windKmh: number; stormSurgeMeters: number; coneRadiusKm: number }[];
      highestRiskSectors: string[];
      recommendedEvacuationWindow: string;
    };
    floodSurgeTimeline: { timeLabel: string; rainfallMm: number; riverLevelMeters: number; dangerThreshold: number; status: string }[];
    seismicForecast: {
      primaryQuakeMagnitude: number;
      epicenter: { lat: number; lng: number };
      depthKm: number;
      aftershockProbabilityNext24h: string;
      expectedMaxMagnitude: number;
      vulnerableStructuresCount: number;
    };
  } | null>(null);

  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(2);
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  useEffect(() => {
    fetch(`${serverUrl}/api/prediction/forecast`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPredictions(data);
        }
      })
      .catch((err) => console.error('Prediction fetch error:', err));
  }, [serverUrl]);

  if (!predictions) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center font-mono text-slate-400">
        <TrendingUp className="w-8 h-8 text-tactical-accent animate-spin mx-auto mb-2" />
        <span>COMPUTING PREDICTIVE METEOROLOGICAL & SEISMIC MODELS...</span>
      </div>
    );
  }

  const { cycloneForecast, floodSurgeTimeline, seismicForecast } = predictions;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-yellow-400 animate-pulse" />
            DISASTER PREDICTION & SCENARIO SIMULATION ENGINE
          </h2>
          <p className="text-xs font-mono text-slate-400">
            STORM TRACK CONE OF UNCERTAINTY, HYDROLOGICAL FLOOD SURGE TIMELINE & SEISMIC AFTERSHOCK DECAY
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        <div className="tactical-card p-4 rounded-xl border border-yellow-500/40 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
            <div className="flex items-center gap-2 text-yellow-400 font-bold">
              <Wind className="w-4 h-4" />
              <span>CYCLONE TRACKING</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-600 font-bold text-[10px]">
              {cycloneForecast.category}
            </span>
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="text-sm font-bold text-white">{cycloneForecast.systemName}</div>
            <div className="flex justify-between text-[11px]">
              <span>Max Sustained Winds:</span>
              <span className="text-yellow-400 font-bold">{cycloneForecast.currentWindSpeedKmh} km/h</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Central Barometric Pressure:</span>
              <span className="text-cyan-400 font-bold">{cycloneForecast.pressureHPa} hPa</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Projected Landfall In:</span>
              <span className="text-red-400 font-bold animate-pulse">~{cycloneForecast.projectedLandfallHours} Hours</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-tactical-700">
            <span className="text-[11px] text-slate-400 block font-bold">Cone of Uncertainty Milestones:</span>
            {cycloneForecast.trajectoryPoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-tactical-900 border border-tactical-700/60 flex items-center justify-between text-[10px]"
              >
                <span className="font-bold text-cyan-300">+{pt.hoursOut}h</span>
                <span>{pt.lat.toFixed(2)}°N, {pt.lng.toFixed(2)}°E</span>
                <span className="text-yellow-400 font-bold">{pt.windKmh} km/h</span>
                <span className="text-red-400 font-bold">Surge {pt.stormSurgeMeters}m</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded bg-red-950/60 border border-red-600/60 text-[11px] text-red-200">
            <strong>Evacuation Advisory:</strong> {cycloneForecast.recommendedEvacuationWindow}
          </div>
        </div>

        <div className="tactical-card p-4 rounded-xl border border-cyan-500/40 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Droplets className="w-4 h-4" />
              <span>HYDROLOGICAL SURGE</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold text-[10px]">
              BARRIER GAUGE
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 block">Forecasted Gauge Level vs Breach Threshold (5.0m):</span>
            {floodSurgeTimeline.map((item, idx) => {
              const isBreached = item.riverLevelMeters >= item.dangerThreshold;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedTimelineIndex(idx)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedTimelineIndex === idx
                      ? 'bg-tactical-800 border-cyan-400 shadow-md'
                      : 'bg-tactical-900 border-tactical-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-[11px]">{item.timeLabel} Forecast</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isBreached ? 'bg-red-900 text-red-200' : 'bg-cyan-900 text-cyan-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Precipitation: <strong className="text-cyan-300">{item.rainfallMm} mm</strong></span>
                    <span>River Height: <strong className={isBreached ? 'text-red-400' : 'text-cyan-300'}>{item.riverLevelMeters}m</strong></span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${isBreached ? 'bg-red-500' : 'bg-cyan-400'}`}
                      style={{ width: `${Math.min(100, (item.riverLevelMeters / 7.0) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tactical-card p-4 rounded-xl border border-rose-500/40 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Activity className="w-4 h-4" />
              <span>SEISMIC AFTERSHOCK DECAY</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600 font-bold text-[10px]">
              M{seismicForecast.primaryQuakeMagnitude} EVENT
            </span>
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between text-[11px]">
              <span>Primary Quake Epicenter Depth:</span>
              <span className="text-white font-bold">{seismicForecast.depthKm} km</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>24h Aftershock Likelihood:</span>
              <span className="text-red-400 font-bold text-sm">{seismicForecast.aftershockProbabilityNext24h}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Expected Max Aftershock:</span>
              <span className="text-yellow-400 font-bold">Magnitude {seismicForecast.expectedMaxMagnitude}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Compromised Masonry Structures:</span>
              <span className="text-red-400 font-bold">{seismicForecast.vulnerableStructuresCount} buildings</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-tactical-900 border border-tactical-700 space-y-1 text-[11px] text-slate-300">
            <div className="font-bold text-rose-300">⚠️ USAR Tactical Directive:</div>
            <p>
              Maintain acoustic listening silence windows every 30 minutes. Clear all structural overhangs within 50m of designated rescue zones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
