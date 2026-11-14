import React from 'react';
import { ArrowLeft, Monitor, Sparkles } from 'lucide-react';

export default function MobileSubHeader({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200',
  onBack,
  rightAction,
  onSwitchToDesktop,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-xs select-none">
      {/* Tombol Back & Judul Halaman */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#064e3b] border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight truncate leading-tight">
              {title}
            </h1>
            {badgeText && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-bold border shrink-0 ${badgeColor}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] font-medium text-slate-400 truncate leading-none mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Aksi Kanan (Right Action Button / Switch Desktop) */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {rightAction}

        {onSwitchToDesktop && (
          <button
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
            title="Beralih ke Tampilan Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}

