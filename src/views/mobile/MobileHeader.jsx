import React from 'react';
import { Shirt, Bell, Megaphone, LogOut, Monitor, ShieldCheck, Warehouse } from 'lucide-react';
import { USER_ROLES } from '../../constants/userRoles';

export default function MobileHeader({
  dbConnected,
  onSwitchToDesktop,
  activeUrgentCount = 0,
  onOpenNotifications,
  notificationCount = 0,
  userRole = 'superadmin',
  currentUser = null,
  onLogout = () => {},
}) {
  const displayCount = notificationCount > 0 ? notificationCount : activeUrgentCount;
  const isGudang = userRole === 'gudang';
  const roleCfg = USER_ROLES[userRole] || USER_ROLES.superadmin;
  const roleTitle = roleCfg?.title || (isGudang ? 'Admin Gudang' : 'Super Admin');

  return (
    <header className="bg-gradient-to-b from-[#064e3b] via-[#054338] to-[#04362d] text-white px-4 pt-3.5 pb-6 rounded-b-[2rem] sm:rounded-b-[2.5rem] shadow-lg border-b border-emerald-900/40 select-none relative z-10">
      <div className="flex items-center justify-between">
        {/* Logo & Judul Brand Konveksi */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              {isGudang ? (
                <Warehouse className="w-5 h-5 text-[#064e3b]" />
              ) : (
                <Shirt className="w-5 h-5 text-[#064e3b]" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-white leading-tight truncate">
                Ruang Konveksi <span className="font-medium italic text-emerald-300">Mobile</span>
              </h1>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-emerald-800/80 text-emerald-200 text-[8.5px] font-black uppercase tracking-wider border border-emerald-600/40 truncate">
                {currentUser?.nama || roleTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Action Icons Kanan (Status Database, Notifikasi Urgent, Switch Desktop, LOGOUT ASLI) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Database */}
          <div
            className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
            title={dbConnected ? 'Database Online' : 'Database Offline'}
          >
            <Megaphone className="w-4 h-4 text-emerald-200" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#054338]">
              {dbConnected ? '✓' : '!'}
            </span>
          </div>

          {/* Notifikasi Operasional */}
          <button
            type="button"
            onClick={onOpenNotifications || onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
            title={`${displayCount} Peringatan Operasional`}
          >
            <Bell className="w-4 h-4 text-emerald-200" />
            {displayCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-[#054338] animate-pulse">
                {displayCount > 99 ? '99+' : displayCount}
              </span>
            )}
          </button>

          {/* Tombol Beralih ke Tampilan Desktop Layar Lebar */}
          <button
            type="button"
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
            title="Beralih ke Tampilan Desktop Layar Lebar"
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Tombol Logout Otentik */}
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 rounded-xl bg-rose-500/80 hover:bg-rose-600 active:scale-95 border border-rose-400/40 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
            title="Keluar / Logout Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
