import React, { useState, useMemo } from 'react';
import {
  User,
  Check,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CreditCard,
  Scissors,
  Boxes,
  ArrowLeftRight,
  Package,
  Users,
  Warehouse,
  Tag,
  Monitor,
  ChevronRight,
  Flame,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function DashboardMobile({
  antreanList = [],
  products = [],
  bahan = [],
  employees = [],
  categories = [],
  onNavigate,
  onOpenAddAntrean,
  onNextStatus,
  onSwitchToDesktop,
}) {
  // Tab toggle pada kartu biru (Antrean Produksi vs Stok Gudang)
  const [activeKpiTab, setActiveKpiTab] = useState('antrean');

  // Perhitungan statistik
  const stats = useMemo(() => {
    const totalAntrean = antreanList.length;
    const antreanAktif = antreanList.filter(
      (a) => a.statusTahapan !== 'Selesai Gudang' && a.statusTahapan !== 'Selesai'
    ).length;
    const totalTargetPcs = antreanList.reduce((acc, a) => acc + (Number(a.targetQty) || 0), 0);

    const siapPotong = antreanList.filter(
      (a) => !a.statusTahapan || a.statusTahapan === 'Menunggu Cutting'
    ).length;
    const urgentCount = antreanList.filter(
      (a) => (a.prioritas || '').toLowerCase() === 'urgent' && a.statusTahapan !== 'Selesai Gudang'
    ).length;
    const prosesJahit = antreanList.filter(
      (a) => a.statusTahapan === 'Proses Jahit' || a.statusTahapan === 'Proses Cutting'
    ).length;
    const selesaiCount = antreanList.filter(
      (a) => a.statusTahapan === 'Selesai Gudang' || a.statusTahapan === 'Selesai'
    ).length;

    // Target potong & jahit vs target finishing
    const targetPotongJahit = antreanList
      .filter((a) => a.statusTahapan === 'Proses Cutting' || a.statusTahapan === 'Proses Jahit' || a.statusTahapan === 'Menunggu Cutting')
      .reduce((acc, a) => acc + (Number(a.targetQty) || 0), 0);
    const targetFinishing = antreanList
      .filter((a) => a.statusTahapan === 'Proses QC' || a.statusTahapan === 'Proses Finishing' || a.statusTahapan === 'Selesai Gudang')
      .reduce((acc, a) => acc + (Number(a.targetQty) || 0), 0);

    // Total stok fisik produk di gudang
    const totalStokGudangPcs = products.reduce((acc, p) => acc + (Number(p.stok) || 0), 0);
    const totalNilaiStokRp = products.reduce(
      (acc, p) => acc + (Number(p.stok) || 0) * (Number(p.harga) || 0),
      0
    );

    return {
      totalAntrean,
      antreanAktif,
      totalTargetPcs,
      siapPotong,
      urgentCount,
      prosesJahit,
      selesaiCount,
      targetPotongJahit,
      targetFinishing,
      totalStokGudangPcs,
      totalNilaiStokRp,
    };
  }, [antreanList, products]);

  return (
    <div className="space-y-4 -mt-8 pb-4">
      {/* 1. FLOATING PROFILE CARD (PERSIS SEPERTI GAMBAR) */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#064e3b]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Admin Produksi</h2>
              <p className="text-[10px] font-medium text-slate-400">NIK: KNV-001 • Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('antrean')}
            className="px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-0.5 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <span>Rincian</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Mini Stat Badges (Pastel Hijau, Merah, Kuning, Biru) */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
          {/* Badge 1: Siap Potong (Hijau) */}
          <div className="bg-[#f0fdf4] border border-emerald-100 rounded-xl py-2 px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs mb-1">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div className="text-sm font-black text-emerald-900">{stats.siapPotong}</div>
            <div className="text-[9.5px] font-semibold text-emerald-700">Siap Potong</div>
          </div>

          {/* Badge 2: Urgent (Merah) */}
          <div className="bg-[#fef2f2] border border-rose-100 rounded-xl py-2 px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs mb-1">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="text-sm font-black text-rose-900">{stats.urgentCount}</div>
            <div className="text-[9.5px] font-semibold text-rose-700">Urgent</div>
          </div>

          {/* Badge 3: Proses (Kuning / Orange) */}
          <div className="bg-[#fffbeb] border border-amber-100 rounded-xl py-2 px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-sm font-black text-amber-900">{stats.prosesJahit}</div>
            <div className="text-[9.5px] font-semibold text-amber-700">Proses</div>
          </div>

          {/* Badge 4: Selesai (Teal / Biru) */}
          <div className="bg-[#f0fdfa] border border-teal-100 rounded-xl py-2 px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-sm font-black text-teal-900">{stats.selesaiCount}</div>
            <div className="text-[9.5px] font-semibold text-teal-700">Selesai</div>
          </div>
        </div>
      </div>

      {/* 2. BLUE FINANCIAL & PRODUCTION CARD (PERSIS KARTU TAGIHAN DI GAMBAR) */}
      <div className="bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#1e40af] text-white rounded-3xl p-4 shadow-md shadow-blue-500/15 relative overflow-hidden">
        {/* Switcher Tab Pill di atas */}
        <div className="flex items-center gap-1 bg-blue-900/40 p-1 rounded-2xl w-fit mb-3 border border-white/10">
          <button
            onClick={() => setActiveKpiTab('antrean')}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeKpiTab === 'antrean'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-blue-100 hover:text-white'
            }`}
          >
            Antrean Order
          </button>
          <button
            onClick={() => setActiveKpiTab('gudang')}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeKpiTab === 'gudang'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-blue-100 hover:text-white'
            }`}
          >
            Stok Gudang
          </button>
        </div>

        {/* Konten Utama Kartu */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {activeKpiTab === 'antrean' ? 'TOTAL TARGET VOLUME PRODUKSI' : 'TOTAL ESTIMASI NILAI STOK GUDANG'}
            </div>
            <div className="text-2xl font-black tracking-tight text-white mt-0.5">
              {activeKpiTab === 'antrean'
                ? `${stats.totalTargetPcs.toLocaleString('id-ID')} Pcs`
                : `Rp ${stats.totalNilaiStokRp.toLocaleString('id-ID')}`}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Dua Sub-Kotak Putih di Bawah Kartu Biru */}
        <div className="grid grid-cols-2 gap-2 mt-3.5">
          <div className="bg-white rounded-2xl p-2.5 text-slate-800 shadow-xs">
            <div className="text-[9.5px] font-bold text-slate-400 uppercase">
              {activeKpiTab === 'antrean' ? 'POTONG & JAHIT' : 'TOTAL FISIK'}
            </div>
            <div className="text-sm font-black text-blue-600 mt-0.5">
              {activeKpiTab === 'antrean'
                ? `${stats.targetPotongJahit.toLocaleString('id-ID')} Pcs`
                : `${stats.totalStokGudangPcs.toLocaleString('id-ID')} Pcs`}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-2.5 text-slate-800 shadow-xs">
            <div className="text-[9.5px] font-bold text-slate-400 uppercase">
              {activeKpiTab === 'antrean' ? 'FINISHING / SELESAI' : 'TOTAL SKU'}
            </div>
            <div className="text-sm font-black text-amber-600 mt-0.5">
              {activeKpiTab === 'antrean'
                ? `${stats.targetFinishing.toLocaleString('id-ID')} Pcs`
                : `${products.length} Varian`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MENU LAYANAN KONVEKSI (GRID 8 IKON PERSIS SEPERTI GAMBAR) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <span className="w-1 h-3.5 rounded-full bg-[#064e3b]" />
          <h3 className="font-extrabold text-xs text-slate-800 tracking-wide">
            Menu Layanan Konveksi
          </h3>
        </div>

        <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-100">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {/* 1. Antrean SOP */}
            <button
              onClick={() => onNavigate('antrean')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Antrean SOP
              </span>
            </button>

            {/* 2. Mutasi Bahan */}
            <button
              onClick={() => onNavigate('mutasi')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Mutasi Bahan
              </span>
            </button>

            {/* 3. Stok Bahan */}
            <button
              onClick={() => onNavigate('bahan')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Stok Bahan
              </span>
            </button>

            {/* 4. Katalog SKU */}
            <button
              onClick={() => onNavigate('produk')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Katalog SKU
              </span>
            </button>

            {/* 5. Karyawan */}
            <button
              onClick={() => onNavigate('karyawan')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Tim Jahit
              </span>
            </button>

            {/* 6. Gudang Jadi */}
            <button
              onClick={() => onNavigate('laporan')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Warehouse className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Gudang Jadi
              </span>
            </button>

            {/* 7. Kategori */}
            <button
              onClick={() => onNavigate('kategori')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Tag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Kategori
              </span>
            </button>

            {/* 8. Mode Desktop */}
            <button
              onClick={onSwitchToDesktop}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-700/20 group-hover:scale-105 transition-transform">
                <Monitor className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                Tampilan PC
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ANTREAN & KEGIATAN PRODUKSI BERJALAN (HORIZONTAL CARDS CAROUSEL) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-3.5 rounded-full bg-[#064e3b]" />
            <h3 className="font-extrabold text-xs text-slate-800 tracking-wide">
              Antrean Produksi Terkini
            </h3>
          </div>
          <button
            onClick={() => onNavigate('antrean')}
            className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel / List Kartu Antrean Berjalan */}
        <div className="space-y-2">
          {antreanList.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3 shadow-xs border border-slate-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800 leading-tight line-clamp-1">
                    {item.modelProduk}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.noAntrean} • <span className="font-semibold text-slate-600">{item.targetQty} Pcs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                    item.statusTahapan === 'Proses Jahit'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : item.statusTahapan === 'Proses Cutting'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {item.statusTahapan || 'Tunggu'}
                </span>
                {item.statusTahapan !== 'Selesai Gudang' && item.statusTahapan !== 'Selesai' && (
                  <button
                    onClick={() => onNextStatus(item)}
                    className="p-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                    title="Lanjut ke tahap berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {antreanList.length === 0 && (
            <div className="bg-white rounded-2xl p-5 text-center text-xs text-slate-400 border border-dashed border-slate-200">
              Belum ada antrean produksi aktif
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
