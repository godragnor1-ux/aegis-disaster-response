'use client';

import React, { useState } from 'react';
import { MessageSquare, PhoneCall, Copy, CheckCircle2, ShieldAlert, Sparkles, Radio } from 'lucide-react';
import { encodeSOSMessage } from '@utils/smsCompression';

interface SMSFallbackCardProps {
  location?: { lat: number; lng: number };
  emergencyType?: string;
  urgency?: string;
  peopleCount?: number;
  batteryLevel?: number;
  gatewayPhone?: string;
}

export const SMSFallbackCard: React.FC<SMSFallbackCardProps> = ({
  location = { lat: 28.6185, lng: 77.2115 },
  emergencyType = 'trapped',
  urgency = 'critical',
  peopleCount = 1,
  batteryLevel = 92,
  gatewayPhone = '+15559110101',
}) => {
  const [copied, setCopied] = useState(false);

  const smsCode = encodeSOSMessage({
    location,
    emergencyType,
    urgency,
    peopleCount,
    batteryLevel,
  });

  const smsUri = `sms:${gatewayPhone}?body=${encodeURIComponent(smsCode)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(smsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="tactical-card p-5 rounded-2xl border border-amber-500/50 space-y-4 font-mono text-xs shadow-2xl bg-tactical-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-700 pb-2.5">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>ZERO-INTERNET SMS FALLBACK DISPATCH</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500 text-[10px] font-bold">
          58 BYTES
        </span>
      </div>

      <p className="text-slate-300 text-xs">
        When internet or cellular data is blacked out, dispatch can be triggered via standard cellular SMS directly to the Civil Defense Gateway.
      </p>

      {/* Encoded SMS String Display */}
      <div className="p-3 rounded-xl bg-black/80 border border-tactical-700 flex items-center justify-between gap-2">
        <span className="text-cyan-300 font-mono text-xs font-bold truncate select-all">{smsCode}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-slate-300 hover:text-white flex-shrink-0 transition-colors"
          title="Copy SMS code"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Native Launch Action */}
      <div className="space-y-2">
        <a
          href={smsUri}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>📲 LAUNCH NATIVE SMS TO CIVIL DEFENSE ({gatewayPhone})</span>
        </a>
        <div className="text-[10px] text-slate-500 text-center">
          Works without mobile data, Wi-Fi, or app connectivity.
        </div>
      </div>
    </div>
  );
};
export default SMSFallbackCard;
