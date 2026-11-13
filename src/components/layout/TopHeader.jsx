import React, { useState } from 'react';
import { Menu, Maximize2, Minimize2, Smartphone, Download, Database } from 'lucide-react';
import { useClock } from '../../hooks/useClock';

export default function TopHeader({ onToggleSidebar, dbConnected }) {
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
    <header className="h-12 bg-white border-b border-slate-200 px-3 md:px-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Tombol Sidebar & Layar Penuh */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
          title="Buka / Tutup Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 hidden sm:flex"
          title="Layar Penuh"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bagian Kanan */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Database SQLite */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
            dbConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={
            dbConnected
              ? 'Terhubung ke Database SQLite (konveksi.db di port 3001)'
              : 'Server backend belum jalan, memakai mock data sementara'
          }
        >
          <Database className="w-3 h-3 text-cyan-600" />
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{dbConnected ? 'SQLite Online' : 'SQLite Offline'}</span>
        </div>

        {/* Status Mobile */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
          <Smartphone className="w-3 h-3" />
          <span>Konveksi Mobile</span>
        </div>

        {/* Jam Real-time */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{timeStr}</span>
        </div>

        {/* Tombol Pasang */}
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>Install Aplikasi</span>
        </button>
      </div>
    </header>
  );
}

