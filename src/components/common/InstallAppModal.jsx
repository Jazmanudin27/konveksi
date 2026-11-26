import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Monitor,
  Smartphone,
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstalled }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah berjalan dalam mode standalone PWA
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standaloneMode);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          if (onInstalled) onInstalled();
          if (onClose) onClose();
        }
      } catch (err) {
        console.warn('Gagal memicu install prompt:', err);
      } finally {
        setInstalling(false);
      }
    } else {
      // Jika browser tidak menyediakan prompt otomatis (misal sudah pernah ditolak atau desktop biasa),
      // berikan info visual cara pasang manual via address bar Chrome
      alert('Untuk memasang di Google Chrome:\n1. Klik ikon [Install / Pasang] ⊕ di sebelah kanan address bar browser (dekat tombol bookmark bintang).\n2. Atau klik menu titik 3 (⋮) di Chrome > pilih "Pasang aplikasi Ruang Konveksi".');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn select-none text-slate-800">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
        {/* Header Visual */}
        <div className="relative bg-gradient-to-tr from-[#070d1e] via-[#0b1736] to-[#0284c7] p-6 text-white text-center overflow-hidden">
          {/* Background glowing rings */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-cyan-400 to-sky-500 p-0.5 shadow-xl shadow-cyan-950/60">
            <div className="w-full h-full rounded-[14px] bg-[#070d1e] flex items-center justify-center">
              <img src="/icon.svg" alt="Ruang Konveksi" className="w-11 h-11 object-contain" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-cyan-200 text-[10.5px] font-bold mb-1">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>APLIKASI CHROME PWA</span>
          </div>

          <h3 className="text-lg font-black tracking-tight text-white">
            Pasang Aplikasi Ruang Konveksi
          </h3>
          <p className="text-xs text-cyan-100/90 mt-1 max-w-xs mx-auto">
            Gunakan aplikasi mandiri tanpa tab browser di Laptop / PC & Smartphone
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {isStandalone ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Aplikasi Sudah Terpasang!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Anda saat ini sedang membuka Ruang Konveksi dalam mode aplikasi standalone.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Fitur / Keunggulan */}
              <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Kelebihan Aplikasi Desktop & Mobile:
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Laptop className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Layar Penuh Mandiri (No Address Bar)</span>
                    <p className="text-slate-500 text-[11px]">Tampilan bersih seperti software bawaan Windows / Android.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Akses Cepat 1-Klik dari Desktop</span>
                    <p className="text-slate-500 text-[11px]">Buka langsung dari desktop Windows, Taskbar, atau Home Screen HP.</p>
                  </div>
                </div>
              </div>

              {/* Panduan jika tombol install browser tidak muncul otomatis */}
              <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-cyan-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-cyan-900">
                  <Monitor className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Cara Pasang di Google Chrome Desktop:</span>
                </div>
                <p className="text-[11px] text-cyan-800 leading-relaxed">
                  Lihat ke pojok kanan atas address bar browser Anda (tempat ketik URL), klik ikon <strong>Install ⊕</strong> lalu klik <strong>"Instal"</strong>.
                </p>
                <div className="pt-1 font-bold flex items-center gap-1.5 text-cyan-900">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Cara Pasang di Chrome HP Android:</span>
                </div>
                <p className="text-[11px] text-cyan-800 leading-relaxed">
                  Klik menu titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome &gt; pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>

            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-extrabold text-xs shadow-md shadow-cyan-950/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>{installing ? 'Memasang...' : 'Pasang Sekarang'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}