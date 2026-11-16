import React, { useState, useMemo } from 'react';
import {
  User,
  Check,
  Flame,
  Clock,
  CheckCircle2,
  Scissors,
  Boxes,
  ArrowLeftRight,
  Package,
  Users,
  Warehouse,
  Tag,
  Monitor,
  ChevronRight,
  Layers,
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
  // Normalisasi data dan perhitungan KPI yang akurat dari database real
  const stats = useMemo(() => {
    const normalizedList = antreanList.map((item) => {
      const qty = Number(item.qty ?? item.targetQty ?? 0);
      const status = item.status || item.statusTahapan || 'Menunggu Cutting';
      const prioritas = (item.prioritas || 'Normal').toLowerCase();
      const noAntrian = item.noAntrian || item.noAntrean || `ANT-${item.id}`;
      const namaProduk = item.namaProduk || item.modelProduk || 'Kaos Polos Combed 30s';
      return {
        ...item,
        qty,
        status,
        prioritas,
        noAntrian,
        namaProduk,
      };
    });

    const totalAntrean = normalizedList.length;
    const antreanAktif = normalizedList.filter(
      (a) => a.status !== 'Selesai Gudang' && a.status !== 'Selesai'
    ).length;
    const totalTargetPcs = normalizedList.reduce((acc, a) => acc + a.qty, 0);

    const siapPotong = normalizedList.filter(
      (a) => a.status === 'Menunggu Cutting' || a.status === 'Draft'
    ).length;
    const urgentCount = normalizedList.filter(
      (a) => a.prioritas === 'urgent' && a.status !== 'Selesai Gudang' && a.status !== 'Selesai'
    ).length;
    const prosesJahit = normalizedList.filter(
      (a) => a.status === 'Proses Jahit' || a.status === 'Proses Cutting'
    ).length;
    const selesaiCount = normalizedList.filter(
      (a) => a.status === 'Selesai Gudang' || a.status === 'Selesai' || a.status === 'Proses QC'
    ).length;

    // Target potong & jahit vs target finishing & gudang
    const targetPotongJahit = normalizedList
      .filter((a) => a.status === 'Proses Cutting' || a.status === 'Proses Jahit' || a.status === 'Menunggu Cutting')
      .reduce((acc, a) => acc + a.qty, 0);
    const targetFinishing = normalizedList
      .filter((a) => a.status === 'Proses QC' || a.status === 'Proses Finishing' || a.status === 'Selesai Gudang')
      .reduce((acc, a) => acc + a.qty, 0);

    // Total stok fisik produk di gudang
    const totalStokGudangPcs = products.reduce((acc, p) => acc + (Number(p.stok) || 0), 0);
    const totalNilaiStokRp = products.reduce(
      (acc, p) => acc + (Number(p.stok) || 0) * (Number(p.harga) || 0),
      0
    );

    return {
      normalizedList,
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
    <div className="space-y-3.5 -mt-2 pb-6 relative z-20">
      {/* 1. KARTU PROFIL ADMIN PRODUKSI & 4 STATUS PIPELINE KONVEKSI */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#064e3b] shadow-xs shrink-0">
              <User className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">Admin Produksi</h2>
              <p className="text-[10.5px] font-medium text-slate-400 mt-0.5">ID: KNV-PROD-001 • Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('antrean')}
            className="px-3.5 py-1 rounded-full text-xs font-bold text-teal-700 bg-teal-50/70 border border-teal-200/80 hover:bg-teal-100 transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs"
          >
            <span>Rincian</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Metrik Status Operasional Konveksi (Menggantikan Hadir/Sakit/Izin/Alfa) */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
          {/* 1. Siap Potong (Mint Green) */}
          <div
            onClick={() => onNavigate('antrean')}
            className="bg-[#ecfdf5] border border-emerald-100/80 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs mb-1">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="text-base font-black text-emerald-950 leading-tight">
              {stats.siapPotong}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 mt-0.5">Siap Potong</div>
          </div>

          {/* 2. Urgent (Pink / Rose) */}
          <div
            onClick={() => onNavigate('antrean')}
            className="bg-[#fff1f2] border border-rose-100/80 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-base font-black text-rose-950 leading-tight">
              {stats.urgentCount}
            </div>
            <div className="text-[10px] font-bold text-rose-700 mt-0.5">Urgent</div>
          </div>

          {/* 3. Proses Jahit (Peach / Orange) */}
          <div
            onClick={() => onNavigate('antrean')}
            className="bg-[#fffbeb] border border-amber-100/80 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-base font-black text-amber-950 leading-tight">
              {stats.prosesJahit}
            </div>
            <div className="text-[10px] font-bold text-amber-700 mt-0.5">Sedang Jahit</div>
          </div>

          {/* 4. Selesai / QC (Cyan / Teal) */}
          <div
            onClick={() => onNavigate('antrean')}
            className="bg-[#f0fdfa] border border-teal-100/80 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-base font-black text-teal-950 leading-tight">
              {stats.selesaiCount}
            </div>
            <div className="text-[10px] font-bold text-teal-700 mt-0.5">QC & Selesai</div>
          </div>
        </div>
      </div>

      {/* 2. KARTU VOLUME TARGET ORDER PRODUKSI (DATA ASLI DARI ANTREAN REAL-TIME) */}
      <div className="bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#1e40af] text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-500/20 relative overflow-hidden">
        {/* Konten Utama Angka Besar */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TOTAL TARGET VOLUME ORDER</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {Number(stats.totalTargetPcs || 0).toLocaleString('id-ID')} Pcs
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Scissors className="w-5 h-5 text-blue-100" />
          </div>
        </div>

        {/* Dua Sub-Kotak Putih di Bawah Kartu Biru */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="bg-white rounded-2xl p-3 text-slate-800 shadow-xs">
            <div className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
              POTONG & JAHIT
            </div>
            <div className="text-sm sm:text-base font-black text-blue-600 mt-0.5">
              {Number(stats.targetPotongJahit || 0).toLocaleString('id-ID')} Pcs
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 text-slate-800 shadow-xs">
            <div className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
              FINISHING & GUDANG
            </div>
            <div className="text-sm sm:text-base font-black text-amber-600 mt-0.5">
              {Number(stats.targetFinishing || 0).toLocaleString('id-ID')} Pcs
            </div>
          </div>
        </div>
      </div>

      {/* 3. MENU OPERASIONAL KONVEKSI (Menggantikan Menu Layanan Santri) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <span className="w-1.5 h-4 rounded-full bg-[#064e3b]" />
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Menu Operasional Konveksi
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {/* 1. Antrean SOP (Hijau) */}
            <button
              onClick={() => onNavigate('antrean')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                <Scissors className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Antrean SOP
              </span>
            </button>

            {/* 2. Mutasi Bahan (Biru) */}
            <button
              onClick={() => onNavigate('mutasi')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Mutasi Bahan
              </span>
            </button>

            {/* 3. Bahan Baku (Cyan / Teal) */}
            <button
              onClick={() => onNavigate('bahan')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0891b2] to-[#06b6d4] text-white flex items-center justify-center shadow-md shadow-cyan-500/25">
                <Boxes className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Bahan Baku
              </span>
            </button>

            {/* 4. Katalog SKU (Orange) */}
            <button
              onClick={() => onNavigate('produk')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                <Package className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Katalog SKU
              </span>
            </button>

            {/* 5. Tim Jahit / Karyawan (Teal) */}
            <button
              onClick={() => onNavigate('karyawan')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center shadow-md shadow-teal-500/25">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Tim Jahit
              </span>
            </button>

            {/* 6. Gudang Jadi (Sky Blue) */}
            <button
              onClick={() => onNavigate('laporan')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shadow-md shadow-sky-500/25">
                <Warehouse className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Gudang Jadi
              </span>
            </button>

            {/* 7. Kategori Produk (Rose / Merah) */}
            <button
              onClick={() => onNavigate('kategori')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#e11d48] to-[#fb7185] text-white flex items-center justify-center shadow-md shadow-rose-500/25">
                <Tag className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Kategori
              </span>
            </button>

            {/* 8. Mode PC Desktop (Dark Slate) */}
            <button
              onClick={onSwitchToDesktop}
              className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0f172a] to-[#334155] text-white flex items-center justify-center shadow-md shadow-slate-900/25">
                <Monitor className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                Tampilan PC
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ANTREAN PRODUKSI BERJALAN (Menggantikan Kegiatan Pesantren) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-4 rounded-full bg-[#064e3b]" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Antrean Produksi Berjalan
            </h3>
          </div>
          <button
            onClick={() => onNavigate('antrean')}
            className="text-xs font-bold text-emerald-700 flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel / List Kartu Antrean Konveksi */}
        <div className="space-y-2">
          {stats.normalizedList.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 leading-tight line-clamp-1">
                    {item.namaProduk}
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">
                    {item.noAntrian} • <span className="font-semibold text-slate-700">{item.qty || 50} Pcs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    item.status === 'Proses Jahit'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : item.status === 'Proses Cutting'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {item.status || 'Siap Potong'}
                </span>
                {item.status !== 'Selesai Gudang' && item.status !== 'Selesai' && (
                  <button
                    onClick={() => onNextStatus(item)}
                    className="p-1.5 rounded-xl bg-[#064e3b] text-white hover:bg-[#043e2f] active:scale-95 transition-all cursor-pointer"
                    title="Lanjut proses berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {stats.normalizedList.length === 0 && (
            <div className="bg-white rounded-3xl p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200">
              Belum ada antrean produksi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
