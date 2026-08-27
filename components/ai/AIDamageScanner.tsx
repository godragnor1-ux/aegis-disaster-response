'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Layers,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { DamageAnalysisResult } from '@/types';

const sampleImages = [
  {
    id: 'collapse',
    title: 'Commercial Multi-Story Collapse',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
    type: 'collapse'
  },
  {
    id: 'flood',
    title: 'Urban Flash Flood Submersion',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=60',
    type: 'flood'
  },
  {
    id: 'fire',
    title: 'Gas Pipeline Fire & Smoke Plume',
    url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=800&auto=format&fit=crop&q=60',
    type: 'fire'
  }
];

export const AIDamageScanner: React.FC = () => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(sampleImages[0].url);
  const [selectedType, setSelectedType] = useState<string>(sampleImages[0].type);
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DamageAnalysisResult | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  const handleRunAnalysis = async (imgUrl: string, type: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${serverUrl}/api/ai/damage-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imgUrl,
          incidentType: type
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error('AI Damage Analysis Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        setCustomFilePreview(resultStr);
        setSelectedImageUrl(resultStr);
        setSelectedType('custom_upload');
        handleRunAnalysis(resultStr, 'custom_upload');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            AI COMPUTER VISION DAMAGE ASSESSMENT SCANNER
          </h2>
          <p className="text-xs font-mono text-slate-400">
            NEURAL NETWORK CLASSIFICATION OF STRUCTURAL COLLAPSE, FLOOD DEPTH & HAZARD BOUNDING BOXES
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="tactical-card p-3 rounded-xl space-y-2 font-mono text-xs">
            <span className="text-slate-400 block font-bold">Select Drone / Citizen Feed Source:</span>
            <div className="grid grid-cols-3 gap-2">
              {sampleImages.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedImageUrl(sample.url);
                    setSelectedType(sample.type);
                    setCustomFilePreview(null);
                    handleRunAnalysis(sample.url, sample.type);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    selectedImageUrl === sample.url && !customFilePreview
                      ? 'bg-tactical-800 border-purple-500 text-purple-300 font-bold shadow-md'
                      : 'bg-tactical-900 border-tactical-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{sample.title}</span>
                </button>
              ))}
            </div>

            <label className="mt-2 w-full py-2 rounded-lg bg-tactical-900 border border-tactical-700 hover:border-purple-400 text-slate-300 text-center font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Upload Custom Disaster Photo</span>
              <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
            </label>
          </div>

          <div className="tactical-card p-2 rounded-2xl relative overflow-hidden border border-purple-500/40 shadow-2xl">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <img
                src={selectedImageUrl}
                alt="Damage Preview"
                className="w-full h-full object-cover"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-xs flex flex-col items-center justify-center z-20">
                  <div className="w-full h-1 bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)] animate-bounce" />
                  <span className="font-mono text-xs text-purple-200 font-bold mt-4 tracking-widest animate-pulse">
                    RUNNING NEURAL VISION INFERENCE (YOLOv8 + RESNET)...
                  </span>
                </div>
              )}

              {showBoxes && analysisResult && !isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none">
                  {analysisResult.boundingBoxes.map((box, i) => {
                    const [ymin, xmin, ymax, xmax] = box.box;
                    const top = `${ymin * 100}%`;
                    const left = `${xmin * 100}%`;
                    const width = `${(xmax - xmin) * 100}%`;
                    const height = `${(ymax - ymin) * 100}%`;

                    return (
                      <div
                        key={i}
                        className="absolute border-2 transition-all"
                        style={{
                          top,
                          left,
                          width,
                          height,
                          borderColor: box.color,
                          backgroundColor: `${box.color}20`,
                          boxShadow: `0 0 10px ${box.color}60`
                        }}
                      >
                        <span
                          className="absolute -top-5 left-0 px-1.5 py-0.2 text-[9px] font-mono font-bold text-white uppercase rounded shadow"
                          style={{ backgroundColor: box.color }}
                        >
                          {box.label} ({(box.confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-2 font-mono text-xs text-slate-300">
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-tactical-900 border border-tactical-700 text-purple-300 hover:bg-tactical-800"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}</span>
              </button>

              <button
                onClick={() => handleRunAnalysis(selectedImageUrl, selectedType)}
                disabled={isAnalyzing}
                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
              >
                {isAnalyzing ? 'Scanning...' : 'Re-Run AI Scan'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {analysisResult ? (
            <div className="space-y-4">
              <div className="tactical-card p-4 rounded-xl border-2 border-red-500/60 font-mono space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">AI TRIAGE ASSESSMENT</span>
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-600 font-bold text-xs">
                    {analysisResult.triageCategory}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold text-white">
                    {analysisResult.overallSeverity.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-slate-400">
                    Model Confidence: <span className="text-purple-400 font-bold">{(analysisResult.confidenceScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="tactical-card p-4 rounded-xl space-y-3 font-mono text-xs">
                <h4 className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Structural & Hazard Telemetry
                </h4>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Remaining Structural Integrity:</span>
                      <span className="text-red-400 font-bold">{analysisResult.metrics.structuralIntegrityPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${analysisResult.metrics.structuralIntegrityPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Flood Inundation Level:</span>
                      <span className="text-cyan-400 font-bold">~{analysisResult.metrics.floodDepthEstMeters}m</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Heavy Extrication Machinery Needed:</span>
                      <span className="text-yellow-400 font-bold">
                        {analysisResult.metrics.heavyMachineryRequired ? 'YES (CRANES / HYDRAULICS)' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tactical-card p-4 rounded-xl space-y-2 font-mono text-xs">
                <h4 className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Detected Critical Hazards
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  {analysisResult.detectedHazards.map((hazard, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{hazard}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tactical-card p-4 rounded-xl bg-purple-950/40 border border-purple-500/50 space-y-1.5 font-mono text-xs">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>RECOMMENDED ACTION DIRECTIVE</span>
                </div>
                <p className="text-purple-100 text-[11px]">
                  {analysisResult.recommendedAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="tactical-card p-8 rounded-xl text-center space-y-3 font-mono text-xs text-slate-400">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
              <p>Click &ldquo;Re-Run AI Scan&rdquo; or select a photo above to compute structural damage metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
