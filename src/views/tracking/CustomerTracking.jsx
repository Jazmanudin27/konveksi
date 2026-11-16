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
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Shirt,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  CheckCircle,
  PhoneCall,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';

// Helper deteksi warna hex untuk swatch varian
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
  return '#10b981';
}

export default function CustomerTracking({ initialNoAntrian = '' }) {
  const [searchInput, setSearchInput] = useState(initialNoAntrian);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#track/${encodeURIComponent(data.noAntrian || trimmed)}`);
      }
    } catch (err) {
      setOrder(null);
      setError(
        'Nomor pesanan tidak ditemukan. Pastikan nomor antrean atau nomor PO sudah sesuai.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrder(searchInput);
  };

  // Helper kalkulasi status & tahapan SOP
  const getProgressInfo = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('gudang') || s === 'selesai') {
      return {
        percent: 100,
        label: 'Produksi Selesai (Siap Ambil / Kirim)',
        step: 6,
        color: 'from-emerald-500 via-teal-500 to-emerald-600',
        badgeBg: 'bg-emerald-500 text-white',
        pulseColor: 'bg-emerald-400',
        subtitle: 'Pesanan telah melewati seluruh tahapan SOP & tersimpan aman di Gudang Jadi.',
      };
    }
    if (s.includes('finishing')) {
      return {
        percent: 85,
        label: 'Tahap Finishing & Packing',
        step: 5,
        color: 'from-emerald-500 via-teal-500 to-cyan-500',
        badgeBg: 'bg-teal-600 text-white',
        pulseColor: 'bg-teal-400',
        subtitle: 'Sedang proses buang sisa benang, setrika uap rapi, dan pengemasan plastik.',
      };
    }
    if (s.includes('qc')) {
      return {
        percent: 70,
        label: 'Quality Control & Inspeksi Fisik',
        step: 4,
        color: 'from-indigo-500 via-teal-500 to-emerald-500',
        badgeBg: 'bg-indigo-600 text-white',
        pulseColor: 'bg-indigo-400',
        subtitle: 'Tim QC sedang memeriksa ketepatan ukuran, kerapian jahitan, dan standar kualitas.',
      };
    }
    if (s.includes('jahit')) {
      return {
        percent: 50,
        label: 'Proses Penjahitan (Sewing)',
        step: 3,
        color: 'from-purple-500 via-indigo-500 to-teal-500',
        badgeBg: 'bg-purple-600 text-white',
        pulseColor: 'bg-purple-400',
        subtitle: 'Potongan kain sedang dirakit dan dijahit oleh tim penjahit konveksi.',
      };
    }
    if (s.includes('cutting')) {
      return {
        percent: 30,
        label: 'Pemotongan Pola Kain (Cutting)',
        step: 2,
        color: 'from-blue-500 via-cyan-500 to-teal-500',
        badgeBg: 'bg-blue-600 text-white',
        pulseColor: 'bg-blue-400',
        subtitle: 'Bahan kain sedang digelar, digambar pola, dan dipotong presisi.',
      };
    }
    return {
      percent: 15,
      label: 'Pesanan Diterima (Antrean Cutting)',
      step: 1,
      color: 'from-amber-500 via-orange-500 to-emerald-500',
      badgeBg: 'bg-amber-600 text-white',
      pulseColor: 'bg-amber-400',
      subtitle: 'Pesanan telah tercatat di sistem antrean dan bersiap untuk proses potong pola.',
    };
  };

  const progress = order ? getProgressInfo(order.status) : null;

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
    const msg = `Halo kak! Berikut tautan live tracking untuk pesanan PO Konveksi kami:

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

  // Definisi 6 tahapan timeline
  const timelineSteps = order
    ? [
        {
          step: 1,
          title: 'Pesanan Diterima & Masuk Antrean',
          desc: 'Spesifikasi model, varian warna, dan target volume telah tervalidasi di sistem.',
          date: order.tglMasuk,
          icon: Clock,
          isDone: progress.step > 1,
          isCurrent: progress.step === 1,
        },
        {
          step: 2,
          title: 'Pemotongan Pola Bahan (Cutting)',
          desc: 'Bahan kain digelar dan dipotong sesuai pola spesifikasi ukuran pesanan.',
          date: order.tglSerahCutting,
          icon: Scissors,
          isDone: progress.step > 2,
          isCurrent: progress.step === 2,
        },
        {
          step: 3,
          title: 'Penjahitan & Perakitan (Sewing)',
          desc: 'Komponen potongan kain dirakit dan dijahit rapi oleh tim penjahit.',
          date: order.tglSerahJahit,
          icon: Shirt,
          isDone: progress.step > 3,
          isCurrent: progress.step === 3,
        },
        {
          step: 4,
          title: 'Quality Control & Cek Fisik (QC)',
          desc: 'Pemeriksaan standar ukuran, ketepatan jahitan, dan tidak ada cacat bahan.',
          date: order.tglSerahQc,
          extra: order.statusQc ? `Hasil Inspeksi: ${order.statusQc}` : null,
          icon: ShieldCheck,
          isDone: progress.step > 4,
          isCurrent: progress.step === 4,
        },
        {
          step: 5,
          title: 'Finishing, Steam & Packing',
          desc: 'Pembersihan sisa benang, setrika uap suhu tinggi, dan pengemasan plastik rapi.',
          date: order.tglSerahFinishing,
          icon: PackageCheck,
          isDone: progress.step > 5,
          isCurrent: progress.step === 5,
        },
        {
          step: 6,
          title: 'Selesai & Siap Diambil / Dikirim',
          desc: 'Produk jadi telah masuk ke Gudang Jadi & siap diambil atau diserahkan ke kurir.',
          date: order.tglSerahGudang,
          icon: Warehouse,
          isDone: progress.step === 6,
          isCurrent: progress.step === 6,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans select-none flex flex-col">
      {/* 1. HERO HEADER WITH CURVED BORDER RADIUS & MODERN GRADIENT */}
      <header className="relative bg-gradient-to-br from-[#064e3b] via-[#043d2e] to-[#022c22] text-white pt-7 pb-16 px-4 shadow-[0_12px_32px_rgba(6,78,59,0.22)] rounded-b-[2.5rem] sm:rounded-b-[3.5rem] border-b border-emerald-500/20 overflow-hidden">
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-teal-400/15 blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-600/5 blur-3xl pointer-events-none" />

        <div className="max-w-xl mx-auto relative z-10 space-y-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/20 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-inner">
                  <Shirt className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-base sm:text-lg tracking-tight text-white leading-tight">
                    Ruang Konveksi
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Tracking
                  </span>
                </div>
                <p className="text-[11px] font-medium text-emerald-200/80 leading-none mt-1">
                  Pantau Real-Time Status Produksi Pesanan PO Anda
                </p>
              </div>
            </div>
          </div>

          {/* Search Box Di Dalam Curved Hero */}
          <div className="pt-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center shadow-xl rounded-2xl sm:rounded-full overflow-hidden bg-white/95 backdrop-blur-md p-1 border border-white/40 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
                <Search className="w-4 h-4 ml-3.5 text-slate-400 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ketik No. Antrean / PO (Cth: ANT-20261115-999)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-10 px-3 bg-transparent text-xs sm:text-sm font-mono font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl sm:rounded-full transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span>Mencari...</span>
                  ) : (
                    <>
                      <span>Lacak</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-500/90 backdrop-blur-md border border-rose-400 text-white text-xs font-semibold flex items-center gap-2 shadow-md animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA (FLOATING OVER HERO) */}
      <main className="max-w-xl mx-auto w-full px-4 -mt-8 flex-1 pb-8 space-y-4 relative z-20">
        {order ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KARTU STATUS UTAMA - DESAIN MODERN & ELEGAN */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* 1. Header Banner Status Aktif Berwarna */}
              <div className={`p-4 sm:p-5 bg-gradient-to-r ${progress.color} text-white relative overflow-hidden`}>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                      <Activity className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/90">
                          Status Terkini • Tahap {progress.step} dari 6
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                        {progress.label}
                      </h3>
                    </div>
                  </div>

                  {/* Persentase Besar & Badge No Antrean */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-mono font-bold text-xs bg-black/20 text-white px-2.5 py-1 rounded-xl backdrop-blur-md border border-white/20">
                      {order.noAntrian}
                    </span>
                    <span className="font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-xs">
                      {progress.percent}%
                    </span>
                  </div>
                </div>

                {/* 6-Segment Progress Bar Indicator */}
                <div className="mt-4 pt-3 border-t border-white/20">
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((st) => (
                      <div key={st} className="flex flex-col gap-1">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            st < progress.step
                              ? 'bg-white shadow-xs'
                              : st === progress.step
                              ? 'bg-white animate-pulse shadow-md ring-2 ring-white/50'
                              : 'bg-white/25'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-white/85 mt-2">
                    <span>1. Antrean</span>
                    <span>2. Cutting</span>
                    <span className={progress.step === 3 ? 'text-white font-extrabold underline' : ''}>3. Jahit</span>
                    <span>4. QC</span>
                    <span>5. Finishing</span>
                    <span>6. Gudang</span>
                  </div>
                </div>
              </div>

              {/* 2. Rincian Produk Pesanan */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shrink-0 p-1 shadow-inner">
                    <div className="w-full h-full rounded-xl bg-white flex items-center justify-center shadow-xs">
                      <Shirt className="w-7 h-7 text-emerald-800" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                        {order.sku}
                      </span>
                      {order.sumberPermintaan && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {order.sumberPermintaan}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate" title={order.namaProduk}>
                      {order.namaProduk}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              order.warnaHex || getVariantColor(order.varian),
                          }}
                        />
                        <span>{order.varian || 'Standar'}</span>
                      </span>
                      <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        Size: {Array.isArray(order.ukuran) ? order.ukuran[0] : (order.ukuran || 'All Size')}
                      </span>
                      {order.kategori && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          • {order.kategori}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Kartu Metrik Rapi Berikon (Target Qty, Tgl Masuk, Estimasi Siap) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                  {/* Target Qty */}
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-100 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <Layers className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wide">Target Qty</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-mono font-black text-base sm:text-lg text-slate-900 leading-none">
                        {order.qty || 50}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 ml-1">Pcs</span>
                    </div>
                    <span className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Volume Pesanan</span>
                  </div>

                  {/* Tgl Masuk */}
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-50/70 to-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wide">Tgl Masuk</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 leading-none truncate block">
                        {order.tglMasuk || '-'}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Mulai Antrean</span>
                  </div>

                  {/* Estimasi Siap */}
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-white border border-emerald-200 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wide">Estimasi Siap</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-800 leading-none truncate block">
                        {order.deadline || '-'}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-bold text-emerald-600 mt-0.5">Target Selesai</span>
                  </div>
                </div>

                {/* Info Text Tahapan Aktif */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    {progress.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* TIMELINE TAHAPAN SOP PRODUKSI (CONNECTED STEPPER) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Timeline Tahapan Produksi</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Tahap {progress.step} dari 6
                </span>
              </div>

              {/* Connected Vertical Timeline */}
              <div className="relative pl-3 space-y-4">
                {/* Garis vertikal penghubung */}
                <div className="absolute left-[27px] top-4 bottom-6 w-0.5 bg-slate-200 pointer-events-none" />

                {timelineSteps.map((st) => {
                  const IconComponent = st.icon;
                  return (
                    <div
                      key={st.step}
                      className={`relative flex items-start gap-3.5 p-3 rounded-2xl transition-all ${
                        st.isCurrent
                          ? 'bg-emerald-50/90 border border-emerald-300 shadow-sm'
                          : st.isDone
                          ? 'bg-slate-50/70 border border-slate-100'
                          : 'opacity-40 bg-transparent'
                      }`}
                    >
                      {/* Step Circle Badge */}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition-all shadow-xs ${
                          st.isDone
                            ? 'bg-emerald-600 text-white'
                            : st.isCurrent
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-200/70 shadow-md animate-pulse'
                            : 'bg-white text-slate-400 border border-slate-300'
                        }`}
                      >
                        {st.isDone ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <IconComponent className="w-4 h-4" />
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <h4
                            className={`text-xs sm:text-sm font-bold ${
                              st.isCurrent
                                ? 'text-emerald-950 font-black'
                                : st.isDone
                                ? 'text-slate-800'
                                : 'text-slate-500'
                            }`}
                          >
                            {st.step}. {st.title}
                          </h4>
                          {st.date && (
                            <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                              {st.date}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
                          {st.desc}
                        </p>
                        {st.extra && (
                          <div className="mt-1.5 text-[10.5px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md inline-block border border-teal-200">
                            {st.extra}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOMBOL BAGIKAN & SALIN LINK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bagikan ke WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
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

            {/* HUBUNGI ADMIN CS CARD */}
            <div className="p-4 bg-gradient-to-r from-[#064e3b] to-[#04362d] text-white rounded-3xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-white">Butuh Informasi Tambahan?</h4>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    Hubungi tim CS kami jika ada pertanyaan seputar spesifikasi pesanan Anda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleContactAdmin}
                className="px-4 py-2.5 bg-white text-[#064e3b] text-xs font-black rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Chat CS
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-3.5 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <Search className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                Lacak Status Produksi PO Anda
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Ketik nomor antrean (contoh: <code className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">ANT-20261115-999</code>) pada kolom pencarian di atas untuk melihat progres pengerjaan baju secara langsung.
              </p>
            </div>
          )
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <p className="font-semibold text-slate-600">Ruang Konveksi • Sistem Operasional Produksi</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Status diperbarui otomatis tersinkronisasi dari meja kerja produksi</p>
      </footer>
    </div>
  );
}
