import React from 'react';
import { Shirt, Bell, Megaphone, LogOut } from 'lucide-react';

export default function MobileHeader({
  dbConnected,
  onSwitchToDesktop,
  activeUrgentCount = 0,
}) {
  return (
    <header className="bg-gradient-to-b from-[#064e3b] via-[#054338] to-[#04362d] text-white px-4 pt-4 pb-14 rounded-b-[2.2rem] shadow-md select-none relative z-10">
      <div className="flex items-center justify-between">
        {/* Logo & Judul Brand Konveksi */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Shirt className="w-5 h-5 text-[#064e3b]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-tight text-white leading-tight">
                Ruang Konveksi <span className="font-medium italic text-emerald-300">Mobile</span>
              </h1>
            </div>
            <p className="text-[9px] font-bold text-emerald-100/90 tracking-widest uppercase">
              SISTEM MANAJEMEN OPERASIONAL
            </p>
          </div>
        </div>

        {/* Action Icons Kanan (Status Database, Notifikasi Urgent, Switch Desktop) */}
        <div className="flex items-center gap-2">
          {/* Status SQLite */}
          <div
            className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
            title={dbConnected ? 'Database SQLite Online' : 'Database Offline'}
          >
            <Megaphone className="w-4 h-4 text-emerald-200" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#054338]">
              {dbConnected ? '✓' : '!'}
            </span>
          </div>

          {/* Notifikasi Order Urgent */}
          <div
            onClick={() => onSwitchToDesktop && onSwitchToDesktop()}
            className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
            title={`${activeUrgentCount} Order Prioritas Urgent`}
          >
            <Bell className="w-4 h-4 text-emerald-200" />
            {activeUrgentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#054338] animate-pulse">
                {activeUrgentCount}
              </span>
            )}
          </div>

          {/* Tombol Beralih ke Desktop */}
          <button
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
            title="Beralih ke Tampilan Desktop Layar Lebar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
