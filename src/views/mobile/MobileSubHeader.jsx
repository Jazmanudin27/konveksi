import React from 'react';
import { ArrowLeft, Monitor, Sparkles, Bell } from 'lucide-react';

export default function MobileSubHeader({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
  onBack,
  rightAction,
  onSwitchToDesktop,
  onOpenNotifications,
  notificationCount = 0,
}) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white px-4 py-3 rounded-b-2xl shadow-md border-b border-emerald-900/50 flex items-center justify-between select-none">
      {/* Bagian Kiri: Tombol Back & Judul Halaman */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-sm sm:text-base text-white tracking-tight truncate leading-tight">
              {title}
            </h1>
            {badgeText && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border shrink-0 ${badgeColor}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10.5px] font-semibold text-emerald-200/90 truncate leading-none mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bagian Kanan: Aksi Cepat, Notifikasi & Switch Desktop */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {rightAction}

        {/* Tombol Notifikasi Bell */}
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs relative"
            title={`${notificationCount} Notifikasi Operasional`}
          >
            <Bell className="w-4 h-4 text-emerald-200" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-[#064e3b] animate-pulse">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {onSwitchToDesktop && (
          <button
            onClick={onSwitchToDesktop}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Beralih ke Tampilan Desktop PC"
          >
            <Monitor className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
