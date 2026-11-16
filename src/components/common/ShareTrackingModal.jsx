import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Shirt,
  Sparkles,
} from 'lucide-react';

export default function ShareTrackingModal({
  isOpen,
  onClose,
  item,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const noAntrian = item.noAntrian || item.noAntrean || `ANT-${item.id}`;
  const namaProduk = item.namaProduk || item.modelProduk || 'Produk PO';
  const qty = item.qty || item.targetQty || 50;
  const status = item.status || item.statusTahapan || 'Menunggu Cutting';

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#track/${encodeURIComponent(noAntrian)}`
    : `https://konveksi.ruangtech.com/#track/${encodeURIComponent(noAntrian)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = `Halo kak! Terima kasih telah mempercayakan produksi di Ruang Konveksi 😊.

Berikut adalah tautan pelacakan real-time (live tracking) proses produksi pesanan kakak:

📦 *Pesanan:* ${namaProduk} (${qty} Pcs)
🔖 *No. PO / Antrean:* ${noAntrian}
⚡ *Status Pengerjaan:* ${status}

🔗 *Pantau langsung progresnya di sini:*
${trackingUrl}

Terima kasih banyak! 🙏`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenPage = () => {
    window.open(trackingUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Share2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Bagikan Link Tracking</h3>
              <p className="text-[10px] text-emerald-200/90">Kirim tautan progres PO ke pelanggan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-200 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Isi Card */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Card Info Singkat */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-xs text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                {noAntrian}
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {qty} Pcs
              </span>
            </div>
            <div className="font-extrabold text-slate-800 text-xs truncate">
              {namaProduk}
            </div>
            <div className="text-[10.5px] text-slate-500">
              Status: <span className="font-bold text-emerald-700">{status}</span>
            </div>
          </div>

          {/* Kolom URL Tracking */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
              Tautan Live Tracking Customer:
            </label>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-100 border border-slate-300">
              <input
                type="text"
                readOnly
                value={trackingUrl}
                className="w-full bg-transparent text-[11px] font-mono text-slate-700 truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
                title="Salin Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Tombol Aksi Cepat */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Otomatis ke WhatsApp Customer</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2 px-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-black">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenPage}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

