import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function MobileSubHeader({
  title,
  subtitle,
  badgeText,
  badgeColor = 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
  onBack,
}) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white px-4 py-3.5 rounded-b-[1.75rem] shadow-lg border-b border-emerald-900/50 flex items-center justify-between select-none">
      {/* Hanya Tombol Back & Teks Judul */}
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
    </header>
  );
}
