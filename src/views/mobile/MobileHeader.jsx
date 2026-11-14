import React from 'react';
import { Shirt, Bell, Megaphone, LogOut, Monitor } from 'lucide-react';

export default function MobileHeader({
  dbConnected,
  onSwitchToDesktop,
  activeUrgentCount = 0,
}) {
  return (
    <header className="bg-gradient-to-b from-[#064e3b] to-[#043e2f] text-white px-4 pt-4 pb-12 rounded-b-[2rem] shadow-lg relative select-none">
      <div className="flex items-center justify-between">
        {/* Logo & Judul Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 p-1 border border-white/20 shadow-inner flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-xl bg-white flex items-center justify-center shadow-xs">
              <Shirt className="w-6 h-6 text-[#064e3b]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-wide text-white leading-tight">
                RK <span className="font-medium italic text-emerald-300">Mobile</span>
              </h1>
            </div>
            <p className="text-[10px] font-semibold text-emerald-100/90 tracking-wider uppercase">
              SISTEM PRODUKSI KONVEKSI
            </p>
          </div>
        </div>

        {/* Action Icons Kanan (Pengumuman, Notifikasi, Switch Desktop) */}
        <div className="flex items-center gap-2">
          {/* Status SQLite */}
          <div
            className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center relative cursor-pointer"
            title={dbConnected ? 'Database SQLite Online' : 'Database Offline'}
          >
            <Megaphone className="w-4 h-4 text-emerald-200" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#064e3b]">
              {dbConnected ? '✓' : '!'}
            </span>
          </div>

          {/* Notifikasi Lonceng */}
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center relative cursor-pointer">
            <Bell className="w-4 h-4 text-emerald-200" />
            {activeUrgentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#064e3b]">
                {activeUrgentCount}
              </span>
            )}
          </div>

          {/* Tombol Beralih ke Desktop */}
          <button
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
            title="Beralih ke Tampilan Desktop"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
