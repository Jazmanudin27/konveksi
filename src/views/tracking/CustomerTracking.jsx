import React, { useState, useEffect } from 'react';
import {
  Package,
  Scissors,
  CheckCircle2,
  Clock,
  Sparkles,
  Warehouse,
  Search,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Shirt,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';

// Helper deteksi warna hex
function getVariantColor(varian = '') {
  const v = (varian || '').toUpperCase();
  if (v.includes('HITAM') || v.includes('BLACK')) return '#1e293b';
  if (v.includes('NAVY') || v.includes('BLUE')) return '#1e3a8a';
  if (v.includes('PUTIH') || v.includes('WHITE') || v.includes('BW')) return '#f8fafc';
  if (v.includes('MAROON') || v.includes('MERAH')) return '#991b1b';
  if (v.includes('ARMY')) return '#365314';
  if (v.includes('SAGE')) return '#84a98c';
  if (v.includes('KHAKI') || v.includes('BISKUIT') || v.includes('TANAH')) return '#d4b996';
  if (v.includes('COKSU') || v.includes('COKLAT') || v.includes('MOCCA')) return '#854d0e';
  if (v.includes('GREY') || v.includes('ABU')) return '#64748b';
  if (v.includes('PINK') || v.includes('DUSTY') || v.includes('ROSE')) return '#f43f5e';
  if (v.includes('LILAC') || v.includes('UNGU')) return '#a855f7';
  if (v.includes('KUNING') || v.includes('MUSTARD')) return '#eab308';
  if (v.includes('TERRACOTTA') || v.includes('BATA')) return '#c2410c';
  if (v.includes('TAUPE')) return '#8d7b68';
  return '#64748b';
}

export default function CustomerTracking({ initialNoAntrian = '', onBackToApp }) {
  const [searchInput, setSearchInput] = useState(initialNoAntrian);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Ambil order saat pertama kali dibuka jika initialNoAntrian ada
  useEffect(() => {
    if (initialNoAntrian) {
      setSearchInput(initialNoAntrian);
      fetchOrder(initialNoAntrian);
    }
  }, [initialNoAntrian]);

  const fetchOrder = async (no) => {
    const trimmed = (no || '').trim();
    if (!trimmed) {
      setError('Silakan masukkan nomor antrean atau nomor PO Anda.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.trackOrder(trimmed);
      setOrder(data);
      // Update hash URL tanpa reload
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#track/${encodeURIComponent(data.noAntrian || trimmed)}`);
      }
    } catch (err) {
      setOrder(null);
      setError(
        'Nomor pesanan tidak ditemukan. Pastikan nomor antrean atau nomor PO sudah benar.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrder(searchInput);
  };

  // Hitung persentase progress dan status aktif
  const getProgressInfo = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('gudang') || s === 'selesai') {
      return {
        percent: 100,
        label: 'Produksi Selesai (Siap Kirim / Ambil)',
        step: 6,
        color: 'from-emerald-500 to-teal-500',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (s.includes('finishing')) {
      return {
        percent: 85,
        label: 'Tahap Finishing & Packing',
        step: 5,
        color: 'from-teal-500 to-emerald-500',
        badge: 'bg-teal-100 text-teal-800 border-teal-300',
      };
    }
    if (s.includes('qc')) {
      return {
        percent: 70,
        label: 'Quality Control & Cek Fisik',
        step: 4,
        color: 'from-indigo-500 to-teal-500',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      };
    }
    if (s.includes('jahit')) {
      return {
        percent: 50,
        label: 'Proses Penjahitan (Sewing)',
        step: 3,
        color: 'from-purple-500 to-indigo-500',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    }
    if (s.includes('cutting')) {
      return {
        percent: 30,
        label: 'Pemotongan Pola Kain (Cutting)',
        step: 2,
        color: 'from-blue-500 to-purple-500',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    }
    return {
      percent: 15,
      label: 'Pesanan Diterima (Antrean Cutting)',
      step: 1,
      color: 'from-amber-500 to-blue-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  };

  const progress = order ? getProgressInfo(order.status) : null;

  // Link tracking lengkap untuk dibagikan
  const currentTrackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#track/${encodeURIComponent(order?.noAntrian || searchInput)}`
    : '';

  const handleCopyLink = () => {
    if (!currentTrackingUrl) return;
    navigator.clipboard.writeText(currentTrackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const msg = `Halo kak! Berikut adalah tautan live tracking untuk pesanan PO Konveksi:

📦 *Pesanan:* ${order.namaProduk} (${order.qty} Pcs)
🏷️ *No. Antrean / PO:* ${order.noAntrian}
🎨 *Varian & Size:* ${order.varian || '-'} (${order.ukuran || '-'})
⚡ *Status Terkini:* ${progress?.label}

🔗 *Cek Progres Produksi Real-Time:*
${currentTrackingUrl}

Terima kasih! 🙏`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleContactAdmin = () => {
    const msg = order
      ? `Halo Admin Ruang Konveksi, saya ingin bertanya update status pesanan saya dengan No. Antrean *${order.noAntrian}* (${order.namaProduk}). Terima kasih.`
      : `Halo Admin Ruang Konveksi, saya ingin bertanya seputar pesanan PO saya. Terima kasih.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans select-none flex flex-col">
      {/* Top Brand Navbar */}
      <header className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white px-4 py-3.5 shadow-md border-b border-emerald-900/50 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-[#064e3b]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <h1 className="font-black text-sm tracking-tight text-white">
                  Ruang Konveksi
                </h1>
                <span className="text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 px-2 py-0.2 rounded-full border border-emerald-400/30">
                  Live Tracking
                </span>
              </div>
              <p className="text-[9.5px] font-semibold text-emerald-200/90 leading-none mt-0.5">
                Pantau Status Produksi Pesanan PO Anda
              </p>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Aplikasi</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Search Bar Input */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Masukkan No. Antrean / PO (Cth: ANT-20261115-999)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 bg-[#064e3b] hover:bg-[#043e2f] active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Mencari...</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Lacak</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Details & Stepper */}
        {order ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Kartu Ringkasan Pesanan */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                    {order.noAntrian}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {order.sumberPermintaan || 'PO Pelanggan'}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${progress.badge}`}>
                  {progress.label}
                </span>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {order.namaProduk}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    SKU: {order.sku}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{
                        backgroundColor:
                          order.warnaHex || getVariantColor(order.varian),
                      }}
                    />
                    {order.varian || 'Standar'}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-slate-800">
                    Size: {Array.isArray(order.ukuran) ? order.ukuran[0] : (order.ukuran || '-')}
                  </span>
                </div>
              </div>

              {/* Grid Target Qty & Tanggal */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Target Qty</span>
                  <span className="font-black text-sm text-slate-900">{order.qty || 50} Pcs</span>
                </div>
                <div className="p-2 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Tgl Masuk</span>
                  <span className="font-bold text-xs text-slate-800">{order.tglMasuk || '-'}</span>
                </div>
                <div className="p-2 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Estimasi Selesai</span>
                  <span className="font-bold text-xs text-emerald-800">{order.deadline || '-'}</span>
                </div>
              </div>

              {/* Progress Bar Persentase */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Progres Pengerjaan</span>
                  <span className="font-black text-emerald-700">{progress.percent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${progress.color} transition-all duration-700 shadow-sm`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stepper Timeline Tahapan SOP Produksi */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Timeline Tahapan Produksi</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Step {progress.step} dari 6
                </span>
              </div>

              <div className="space-y-3 relative">
                {[
                  {
                    step: 1,
                    title: '1. Pesanan Diterima & Masuk Antrean',
                    desc: 'PO diverifikasi dan dijadwalkan ke meja pemotongan pola.',
                    date: order.tglMasuk,
                    isDone: progress.step > 1,
                    isCurrent: progress.step === 1,
                  },
                  {
                    step: 2,
                    title: '2. Pemotongan Pola Kain (Cutting)',
                    desc: 'Kain digelar dan dipotong sesuai pola spesifikasi ukuran pesanan.',
                    date: order.tglSerahCutting,
                    isDone: progress.step > 2,
                    isCurrent: progress.step === 2,
                  },
                  {
                    step: 3,
                    title: '3. Penjahitan & Perakitan (Sewing)',
                    desc: 'Potongan kain dijahit dan dirakit oleh tim penjahit konveksi.',
                    date: order.tglSerahJahit,
                    isDone: progress.step > 3,
                    isCurrent: progress.step === 3,
                  },
                  {
                    step: 4,
                    title: '4. Quality Control & Cek Fisik (QC)',
                    desc: 'Pemeriksaan standar jahitan, ukuran, dan kerapian benang.',
                    date: order.tglSerahQc,
                    extra: order.statusQc ? `Hasil: ${order.statusQc}` : null,
                    isDone: progress.step > 4,
                    isCurrent: progress.step === 4,
                  },
                  {
                    step: 5,
                    title: '5. Finishing, Steam & Packing',
                    desc: 'Pembersihan sisa benang, setrika uap, dan pengemasan plastik.',
                    date: order.tglSerahFinishing,
                    isDone: progress.step > 5,
                    isCurrent: progress.step === 5,
                  },
                  {
                    step: 6,
                    title: '6. Selesai & Masuk Gudang Jadi',
                    desc: 'Pakaian siap diambil di konveksi atau diserahkan ke ekspedisi.',
                    date: order.tglSerahGudang,
                    isDone: progress.step === 6,
                    isCurrent: progress.step === 6,
                  },
                ].map((st) => (
                  <div
                    key={st.step}
                    className={`flex items-start gap-3 p-2.5 rounded-2xl transition-all ${
                      st.isCurrent
                        ? 'bg-emerald-50/80 border border-emerald-300'
                        : st.isDone
                        ? 'bg-slate-50/60 border border-transparent'
                        : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-black transition-colors ${
                        st.isDone
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : st.isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {st.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : st.step}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <h4
                          className={`text-xs font-bold ${
                            st.isCurrent ? 'text-emerald-950 font-black' : 'text-slate-800'
                          }`}
                        >
                          {st.title}
                        </h4>
                        {st.date && (
                          <span className="font-mono text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.2 rounded-md border border-slate-200">
                            {st.date}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {st.desc}
                      </p>
                      {st.extra && (
                        <div className="mt-1 text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block border border-teal-200">
                          {st.extra}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aksi Berbagi & Hubungi CS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bagikan ke WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs rounded-2xl border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold">Link Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin Link Tracking</span>
                  </>
                )}
              </button>
            </div>

            {/* Hubungi Admin Card */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-[#04362d] text-white rounded-3xl flex items-center justify-between gap-3 shadow-md">
              <div>
                <h4 className="font-extrabold text-xs">Ada Pertanyaan Seputar Pesanan?</h4>
                <p className="text-[10.5px] text-emerald-200/90 mt-0.5">
                  Tim customer service siap membantu cek detail spesifikasi pesanan Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleContactAdmin}
                className="px-3.5 py-2 bg-white text-[#064e3b] text-xs font-black rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Chat CS
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <Search className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Lacak Status Produksi PO Anda
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Ketik nomor antrean (contoh: <code className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded">ANT-20261115-999</code>) pada kolom pencarian di atas untuk melihat progres pengerjaan baju secara langsung.
              </p>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <p className="font-semibold text-slate-600">Ruang Konveksi • Sistem Manajemen Operasional Produksi</p>
        <p className="text-[10.5px] text-slate-400 mt-0.5">Pembaruan status otomatis tersinkronisasi langsung dari meja produksi</p>
      </footer>
    </div>
  );
}

