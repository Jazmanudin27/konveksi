import React from 'react';
import { Shirt, Sparkles, Monitor } from 'lucide-react';

export default function MobileHeader({ dbConnected, onSwitchToDesktop }) {
  return (
    <header className="h-14 bg-[#0b1329] text-white px-3 flex items-center justify-between border-b border-slate-800 shrink-0 z-30 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-600 p-0.5 shadow-sm shrink-0 flex items-center justify-center">
          <div className="w-full h-full rounded-[6px] bg-[#0b1329]/50 flex items-center justify-center">
            <Shirt className="w-4 h-4 text-cyan-200" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight">RUANG KONVEKSI</h1>
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>
          <p className="text-[9.5px] font-semibold text-cyan-400/90 uppercase tracking-wider leading-none">
            Mobile Edition
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Status Database */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            dbConnected
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="hidden xs:inline">{dbConnected ? 'Online' : 'Offline'}</span>
        </div>

        {/* Tombol Switch ke Mode Desktop */}
        <button
          onClick={onSwitchToDesktop}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors cursor-pointer"
          title="Beralih ke Tampilan Desktop Layar Lebar"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Desktop</span>
        </button>
      </div>
    </header>
  );
}

