import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function UnrealBridgeStatus({ connected, checking, info }) {
  if (checking) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
        <span className="text-amber-400 text-[9px] font-medium">Connecting...</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
        <div className="relative">
          <Wifi className="w-3 h-3 text-green-400" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        </div>
        <span className="text-green-400 text-[9px] font-medium">
          {info?.engine_version ? `UE ${info.engine_version}` : 'Connected'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
      <WifiOff className="w-3 h-3 text-red-400/60" />
      <span className="text-red-400/60 text-[9px] font-medium">Offline</span>
    </div>
  );
}