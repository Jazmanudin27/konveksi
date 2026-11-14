import React, { useState } from 'react';
import {
  Menu,
  Maximize2,
  Minimize2,
  Smartphone,
  Download,
  Database,
  Shirt,
  Sparkles
} from 'lucide-react';
import { useClock } from '../../hooks/useClock';

export default function TopHeader({ onToggleSidebar, dbConnected, onSwitchToMobile }) {
  const timeStr = useClock();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="h-12 bg-[#0b1329] text-slate-300 border-b border-slate-800/90 px-3 md:px-4 flex items-center justify-between shadow-md sticky top-0 z-30 select-none">
      {/* Tombol Sidebar, Brand Logo, & Layar Penuh */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/70 flex items-center justify-center shadow-xs"
          title="Buka / Tutup Menu"
        >
          <Menu className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Brand Logo di Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-600 p-0.5 shadow-sm shadow-cyan-950/50 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[6px] bg-[#0b1329]/60 flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5 text-cyan-200" />
            </div>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-white text-xs tracking-wide">RUANG KONVEKSI</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[9px] font-semibold text-cyan-400/80 uppercase tracking-widest leading-none">
              Sistem Manajemen
            </p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60 hidden md:flex items-center justify-center ml-1"
          title="Layar Penuh"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-300" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bagian Kanan Header */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Status Database SQLite */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
            dbConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
          }`}
          title={
            dbConnected
              ? 'Terhubung ke Database SQLite (konveksi.db di port 3008)'
              : 'Server backend belum jalan, memakai mock data sementara'
          }
        >
          <Database className="w-3 h-3 text-cyan-400" />
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{dbConnected ? 'SQLite Online' : 'SQLite Offline'}</span>
        </div>

        {/* Tombol Beralih ke Versi Mobile */}
        <button
          onClick={onSwitchToMobile}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700/80 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
          title="Beralih ke Tampilan Mobile Smartphone"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Versi Mobile</span>
        </button>

        {/* Jam Real-time */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/60 text-[11px] font-medium font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{timeStr}</span>
        </div>

        {/* Tombol Pasang / Install Aplikasi */}
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer border border-emerald-500/40">
          <Download className="w-3.5 h-3.5" />
          <span>Install Aplikasi</span>
        </button>
      </div>
    </header>
  );
}
