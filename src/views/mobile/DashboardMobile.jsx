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
  Coins,
  PackageCheck,
  Wallet,
  Plus,
  ClipboardList,
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
  userRole = 'superadmin',
  currentUser = null,
}) {
  const isGudang = userRole === 'gudang';

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
    <div className="space-y-3.5 -mt-2 pb-6 relative z-20 select-none">
      {/* 1. KARTU PROFIL PENGGUNA & STATUS / KPI UTAMA */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
              isGudang ? 'bg-amber-600' : 'bg-[#064e3b]'
            }`}>
              {isGudang ? (
                <Warehouse className="w-6 h-6 stroke-[2]" />
              ) : (
                <User className="w-6 h-6 stroke-[2]" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                {currentUser?.nama || (isGudang ? 'Admin Gudang Jadi' : 'Admin Produksi')}
              </h2>
              <p className="text-[10.5px] font-medium text-slate-400 mt-0.5">
                {isGudang
                  ? 'Operator Gudang • Pengendali Stok & Permintaan'
                  : 'ID: KNV-PROD-001 • Super Admin'}
              </p>
            </div>
          </div>
          {isGudang ? (
            <button
              onClick={onOpenAddAntrean}
              className="px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Minta Restock</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('antrean')}
              className="px-3.5 py-1 rounded-full text-xs font-bold text-teal-700 bg-teal-50/70 border border-teal-200/80 hover:bg-teal-100 transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs"
            >
              <span>Rincian</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Metrik Status KPI: Jika Gudang -> Metrik Stok & Mutasi Gudang; Jika Superadmin -> Pipeline Produksi */}
        {isGudang ? (
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
            {/* 1. Total Stok Fisik Pcs */}
            <div
              onClick={() => onNavigate('laporan')}
              className="bg-[#eff6ff] border border-blue-100 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs mb-1">
                <Warehouse className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-blue-950 leading-tight">
                {stats.totalStokGudangPcs.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] font-bold text-blue-700 mt-0.5">Stok Pcs</div>
            </div>

            {/* 2. Permintaan Restock Berjalan */}
            <div
              onClick={() => onNavigate('antrean')}
              className="bg-[#fef3c7] border border-amber-100 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-amber-950 leading-tight">
                {stats.antreanAktif}
              </div>
              <div className="text-[10px] font-bold text-amber-800 mt-0.5">Permintaan</div>
            </div>

            {/* 3. Mutasi Masuk / Siap Terima */}
            <div
              onClick={() => onNavigate('mutasi')}
              className="bg-[#ecfdf5] border border-emerald-100 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs mb-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-emerald-950 leading-tight">
                {stats.selesaiCount}
              </div>
              <div className="text-[10px] font-bold text-emerald-700 mt-0.5">Siap Masuk</div>
            </div>

            {/* 4. Bahan Kain Siap */}
            <div
              onClick={() => onNavigate('bahan')}
              className="bg-[#f0fdfa] border border-teal-100 rounded-2xl py-2 px-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs mb-1">
                <Boxes className="w-4 h-4" />
              </div>
              <div className="text-base font-black text-teal-950 leading-tight">
                {bahan.length}
              </div>
              <div className="text-[10px] font-bold text-teal-700 mt-0.5">Bahan Baku</div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* 2. CARD ESTIMASI ONGKOS & STOK GUDANG JADI */}
      <div className="bg-gradient-to-br from-[#064e3b] via-[#054338] to-[#032d25] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isGudang ? 'Ringkasan Nilai Stok Gudang Jadi' : 'Ringkasan Produksi & Nilai Stok'}
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
              Real-time
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-[11px] text-emerald-200/80 font-medium">Total Stok Fisik</div>
              <div className="text-lg font-black text-white leading-tight mt-0.5">
                {stats.totalStokGudangPcs.toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-emerald-200">Pcs</span>
              </div>
              <div className="text-[10px] text-emerald-300 mt-0.5">Tersedia di Gudang Jadi</div>
            </div>

            <div>
              <div className="text-[11px] text-emerald-200/80 font-medium">Estimasi Nilai Barang</div>
              <div className="text-lg font-black text-amber-300 leading-tight mt-0.5">
                Rp {(stats.totalNilaiStokRp / 1000000).toFixed(1)}Jt
              </div>
              <div className="text-[10px] text-emerald-300 mt-0.5">Siap Dipasarkan</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MENU AKSES CEPAT (GRID ICON GUDANG VS SUPERADMIN) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-4 rounded-full bg-[#064e3b]" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Akses Cepat {isGudang ? 'Gudang Jadi' : 'Operasional'}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          {isGudang ? (
            /* MENU KHUSUS ADMIN GUDANG JADI: Hanya Menu Gudang & Stok */
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
              {/* 1. Input Permintaan Produksi */}
              <button
                onClick={onOpenAddAntrean}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  + Minta Restock
                </span>
              </button>

              {/* 2. Laporan Stok Gudang Jadi */}
              <button
                onClick={() => onNavigate('laporan')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center shadow-md shadow-sky-500/25">
                  <Warehouse className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Stok Gudang
                </span>
              </button>

              {/* 3. Mutasi Gudang Jadi */}
              <button
                onClick={() => onNavigate('mutasi')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Mutasi Stok
                </span>
              </button>

              {/* 4. Stok Bahan Baku */}
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

              {/* 5. Daftar Permintaan Berjalan */}
              <button
                onClick={() => onNavigate('antrean')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <ClipboardList className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Permintaan
                </span>
              </button>

              {/* 6. Master SKU Produk */}
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

              {/* 7. Mode PC Desktop */}
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
          ) : (
            /* MENU SUPER ADMIN: Semua Menu Lengkap */
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
              {/* 1. Tambah Antrean */}
              <button
                onClick={onOpenAddAntrean}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#064e3b] to-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-900/25">
                  <Scissors className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  + Antrean
                </span>
              </button>

              {/* 2. Mutasi Stok */}
              <button
                onClick={() => onNavigate('mutasi')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#0ea5e9] text-white flex items-center justify-center shadow-md shadow-sky-500/25">
                  <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Mutasi Stok
                </span>
              </button>

              {/* 3. Bahan Baku */}
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

              {/* 4. Katalog SKU */}
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

              {/* 5. Tim Jahit */}
              <button
                onClick={() => onNavigate('penjahit')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#14b8a6] text-white flex items-center justify-center shadow-md shadow-teal-500/25">
                  <Users className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Tim Jahit
                </span>
              </button>

              {/* 6. Tim Finishing */}
              <button
                onClick={() => onNavigate('tim-finishing')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <PackageCheck className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Finishing
                </span>
              </button>

              {/* 7. Gudang Jadi */}
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

              {/* 8. Kategori */}
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

              {/* 9. Bayar Upah */}
              <button
                onClick={() => onNavigate('pembayaran-upah')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#d97706] to-[#f59e0b] text-white flex items-center justify-center shadow-md shadow-amber-500/25">
                  <Coins className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Bayar Upah
                </span>
              </button>

              {/* 10. Kasbon */}
              <button
                onClick={() => onNavigate('kasbon')}
                className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#b45309] to-[#d97706] text-white flex items-center justify-center shadow-md shadow-amber-600/25">
                  <Wallet className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight leading-tight">
                  Kasbon
                </span>
              </button>

              {/* 11. Mode PC Desktop */}
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
          )}
        </div>
      </div>

      {/* 4. DAFTAR ANTREAN / PERMINTAAN BERJALAN */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-4 rounded-full bg-[#064e3b]" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              {isGudang ? 'Permintaan Restock Gudang' : 'Antrean Produksi Berjalan'}
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
                  {isGudang ? (
                    <Warehouse className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <Scissors className="w-5 h-5 stroke-[2]" />
                  )}
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
              Belum ada data permintaan produksi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
