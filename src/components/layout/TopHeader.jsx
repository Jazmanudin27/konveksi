import React, { useState } from 'react';
import {
  Menu,
  Maximize2,
  Minimize2,
  Shirt,
  Sparkles,
  LogOut,
  Download
} from 'lucide-react';
import { useClock } from '../../hooks/useClock';

export default function TopHeader({
  onToggleSidebar,
  currentUser = null,
  onLogout = null,
  onOpenInstallModal = null,
  isInstalled = false,
}) {
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
        {/* Tombol Install App Chrome */}
        {!isInstalled && onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-800/60 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            title="Pasang Aplikasi Ruang Konveksi ke Chrome"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Tombol Logout Akun */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            title={currentUser ? `Keluar dari akun @${currentUser.username}` : 'Keluar dari Akun'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}

        {/* Jam Real-time */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/60 text-[11px] font-medium font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
