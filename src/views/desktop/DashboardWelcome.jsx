import React, { useMemo } from 'react';
import {
  Sparkles,
  Package,
  Layers,
  Scissors,
  Warehouse,
  Boxes,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  ArrowLeftRight,
  Shirt,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DashboardWelcome({
  products = [],
  categories = [],
  employees = [],
  bahan = [],
  antreanList = [],
  mutasiList = [],
  mutasiGudangJadiList = [],
  onNavigate
}) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Statistik tahapan antrean produksi
  const stageStats = useMemo(() => {
    let waiting = 0;
    let cutting = 0;
    let jahit = 0;
    let qc = 0;
    let finishing = 0;
    let done = 0;
    let urgent = 0;
    let totalQty = 0;

    (antreanList || []).forEach(item => {
      const q = Number(item.qty || 0);
      totalQty += q;
      if (item.prioritas === 'Urgent') urgent++;

      const st = item.status || 'Menunggu Cutting';
      if (st === 'Menunggu Cutting') waiting++;
      else if (st === 'Proses Cutting' || st === 'Sedang Diproses') cutting++;
      else if (st === 'Proses Jahit') jahit++;
      else if (st === 'Proses QC') qc++;
      else if (st === 'Proses Finishing') finishing++;
      else if (st === 'Selesai' || st === 'Menunggu Penerimaan Gudang') done++;
    });

    return { waiting, cutting, jahit, qc, finishing, done, urgent, totalQty };
  }, [antreanList]);

  // Antrean mendesak / aktif untuk tabel pantau ringkas
  const recentAntrean = useMemo(() => {
    return [...(antreanList || [])]
      .sort((a, b) => {
        if (a.prioritas === 'Urgent' && b.prioritas !== 'Urgent') return -1;
        if (a.prioritas !== 'Urgent' && b.prioritas === 'Urgent') return 1;
        return (a.deadline || '').localeCompare(b.deadline || '');
      })
      .slice(0, 5);
  }, [antreanList]);

  return (
    <div className="w-full space-y-1.5 font-sans select-none animate-fade-in pb-4">
      {/* 1. SLIM COMPACT HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg py-1.5 px-3 sm:px-3.5 shadow-[0_2px_4px_rgba(2,132,199,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Shirt className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h2 className="text-[13.5px] font-extrabold text-white tracking-tight">
                Dashboard Operasional Konveksi
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[9.5px] font-extrabold uppercase">
                OVERVIEW
              </span>
            </div>
            <p className="text-[10.5px] text-white/85 mt-0.5 leading-tight">
              Pantauan alur potong, jahit, QC, bahan baku, dan gudang jadi secara terintegrasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden md:flex items-center gap-1 text-[10.5px] font-semibold text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/20 mr-1">
            <Calendar className="w-3 h-3 text-sky-200" />
            <span>{currentDate}</span>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="h-6.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-md text-[11px] font-bold transition-all cursor-pointer border border-white/25 flex items-center gap-1"
          >
            <Package className="w-3 h-3 text-sky-200" />
            <span>Katalog Produk</span>
          </button>
          <button
            onClick={() => onNavigate('antrean')}
            className="h-6.5 px-2.5 bg-white text-[#0369a1] hover:bg-sky-50 rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <Scissors className="w-3 h-3 text-[#0284c7]" />
            <span>Antrean Produksi</span>
          </button>
        </div>
      </div>

      {/* 2. DENSE KPI CARDS GRID (6 ITEM - COMPACT SMALL HEIGHT) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        {/* Produk */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#0284c7] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Produk (SKU)
            </div>
            <div className="text-base font-extrabold text-[#0f172a] mt-0.5 leading-none">
              {products.length} <span className="text-[10px] font-medium text-slate-400">Model</span>
            </div>
          </div>
          <div className="w-6.5 h-6.5 rounded-md bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0 group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
            <Package className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Kategori */}
        <div
          onClick={() => onNavigate('categories')}
          className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#0284c7] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Kategori
            </div>
            <div className="text-base font-extrabold text-[#0f172a] mt-0.5 leading-none">
              {categories.length} <span className="text-[10px] font-medium text-slate-400">Grup</span>
            </div>
          </div>
          <div className="w-6.5 h-6.5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Bahan Baku */}
        <div
          onClick={() => onNavigate('bahan')}
          className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#0284c7] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Bahan Baku
            </div>
            <div className="text-base font-extrabold text-[#059669] mt-0.5 leading-none">
              {bahan.length} <span className="text-[10px] font-medium text-slate-400">Material</span>
            </div>
          </div>
          <div className="w-6.5 h-6.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Boxes className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Karyawan / Tim */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#0284c7] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Karyawan / Tim
            </div>
            <div className="text-base font-extrabold text-purple-700 mt-0.5 leading-none">
              {employees.length} <span className="text-[10px] font-medium text-slate-400">Orang</span>
            </div>
          </div>
          <div className="w-6.5 h-6.5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Antrean Aktif */}
        <div
          onClick={() => onNavigate('antrean')}
          className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#0284c7] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[9.5px] font-bold text-amber-600 uppercase tracking-wider">
              Antrean Produksi
            </div>
            <div className="text-base font-extrabold text-[#d97706] mt-0.5 leading-none">
              {antreanList.length} <span className="text-[10px] font-medium text-slate-400">Batch</span>
            </div>
          </div>
          <div className="w-6.5 h-6.5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Scissors className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Target Volume */}
        <div
          onClick={() => onNavigate('antrean')}
          className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#0284c7] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <div className="text-[9.5px] font-bold text-sky-600 uppercase tracking-wider">
              Total Target Pcs
            </div>
            <div className="text-base font-extrabold text-[#0284c7] mt-0.5 leading-none">
              {stageStats.totalQty.toLocaleString('id-ID')} <span className="text-[10px] font-medium text-slate-400">Pcs</span>
            </div>
          </div>
          <div className="w-6.5 h-6.5 rounded-md bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0 group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. SPLIT SECTION DUA KOLOM COMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 items-start">
        {/* KOLOM KIRI (7/12): STATUS PIPELINE SOP & MINI ANTREAN */}
        <div className="lg:col-span-7 space-y-1.5">
          {/* Box 1: Status Tahapan SOP */}
          <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#0284c7] rounded-full inline-block" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Status Pipeline Alur Produksi (SOP)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('antrean')}
                className="text-[11px] font-bold text-[#0284c7] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Buka Detail</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded bg-amber-50/70 border border-amber-200 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <div className="text-[9.5px] font-bold text-amber-800 leading-tight">Menunggu Cutting</div>
                <div className="text-sm font-extrabold text-amber-900 mt-0.5">{stageStats.waiting}</div>
              </div>

              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded bg-sky-50/70 border border-sky-200 text-center cursor-pointer hover:bg-sky-100/60 transition-colors"
              >
                <div className="text-[9.5px] font-bold text-sky-800 leading-tight">Proses Cutting</div>
                <div className="text-sm font-extrabold text-sky-900 mt-0.5">{stageStats.cutting}</div>
              </div>

              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded bg-indigo-50/70 border border-indigo-200 text-center cursor-pointer hover:bg-indigo-100/60 transition-colors"
              >
                <div className="text-[9.5px] font-bold text-indigo-800 leading-tight">Proses Jahit</div>
                <div className="text-sm font-extrabold text-indigo-900 mt-0.5">{stageStats.jahit}</div>
              </div>

              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded bg-teal-50/70 border border-teal-200 text-center cursor-pointer hover:bg-teal-100/60 transition-colors"
              >
                <div className="text-[9.5px] font-bold text-teal-800 leading-tight">Proses QC</div>
                <div className="text-sm font-extrabold text-teal-900 mt-0.5">{stageStats.qc}</div>
              </div>

              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded bg-emerald-50/70 border border-emerald-200 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
              >
                <div className="text-[9.5px] font-bold text-emerald-800 leading-tight">Finishing</div>
                <div className="text-sm font-extrabold text-emerald-900 mt-0.5">{stageStats.finishing}</div>
              </div>

              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded bg-slate-100 border border-slate-200 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="text-[9.5px] font-bold text-slate-700 leading-tight">Selesai</div>
                <div className="text-sm font-extrabold text-slate-800 mt-0.5">{stageStats.done}</div>
              </div>
            </div>
          </div>

          {/* Box 2: Tabel Pantau Antrean Aktif */}
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="p-1.5 px-2 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#0284c7]" />
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Daftar Antrean Produksi Terkini
                </span>
              </div>
              <button
                onClick={() => onNavigate('antrean')}
                className="text-[10px] font-bold text-[#0284c7] hover:underline cursor-pointer"
              >
                Lihat Semua ({antreanList.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-500 font-bold text-[9.5px] uppercase border-b border-[#cbd5e1]">
                    <th className="py-1 px-1.5 text-center w-7">No</th>
                    <th className="py-1 px-2">No. Antrean</th>
                    <th className="py-1 px-2">Model Produk</th>
                    <th className="py-1 px-1.5 text-center">Target</th>
                    <th className="py-1 px-2 text-center">Status Tahapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1] text-[11px]">
                  {recentAntrean.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-slate-400 text-xs">
                        Belum ada antrean produksi aktif.
                      </td>
                    </tr>
                  ) : (
                    recentAntrean.map((item, idx) => (
                      <tr
                        key={item.id}
                        onClick={() => onNavigate('antrean')}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-1 px-1.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-1 px-2 font-mono font-bold text-[#0284c7] whitespace-nowrap">
                          {item.noAntrian}
                        </td>
                        <td className="py-1 px-2 font-medium text-slate-800 truncate max-w-[150px]">
                          {item.namaProduk || item.sku}
                        </td>
                        <td className="py-1 px-1.5 text-center font-bold text-slate-700">
                          {item.qty} Pcs
                        </td>
                        <td className="py-1 px-2 text-center">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {item.status || 'Menunggu Cutting'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (5/12): AKSES CEPAT MODUL OPERASIONAL */}
        <div className="lg:col-span-5 space-y-1.5">
          <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full inline-block" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Akses Cepat Modul Utama
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {/* 1. Produk */}
              <div
                onClick={() => onNavigate('products')}
                className="p-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] hover:bg-sky-50/70 hover:border-[#0284c7] transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0284c7] truncate leading-tight">
                    Katalog Produk
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Master SKU & Harga</div>
                </div>
              </div>

              {/* 2. Antrean */}
              <div
                onClick={() => onNavigate('antrean')}
                className="p-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] hover:bg-emerald-50/70 hover:border-emerald-600 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 truncate leading-tight">
                    Antrean & SOP
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Cutting, Jahit, QC</div>
                </div>
              </div>

              {/* 3. Mutasi Bahan */}
              <div
                onClick={() => onNavigate('mutasi-bahan')}
                className="p-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] hover:bg-blue-50/70 hover:border-[#0284c7] transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0284c7] truncate leading-tight">
                    Mutasi Bahan
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Kain Masuk/Keluar</div>
                </div>
              </div>

              {/* 4. Mutasi Gudang Jadi */}
              <div
                onClick={() => onNavigate('mutasi-gudang-jadi')}
                className="p-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] hover:bg-indigo-50/70 hover:border-indigo-600 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Warehouse className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate leading-tight">
                    Mutasi Gudang Jadi
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Penerimaan & Rak</div>
                </div>
              </div>

              {/* 5. Karyawan */}
              <div
                onClick={() => onNavigate('employees')}
                className="p-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] hover:bg-purple-50/70 hover:border-purple-600 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-purple-700 truncate leading-tight">
                    Data Karyawan
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Penjahit & Bagian</div>
                </div>
              </div>

              {/* 6. Laporan Gudang */}
              <div
                onClick={() => onNavigate('laporan-stok-gudang')}
                className="p-1.5 rounded-lg border border-slate-200 bg-[#f8fafc] hover:bg-amber-50/70 hover:border-amber-600 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-amber-700 truncate leading-tight">
                    Stok & Laporan
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Cetak & Evaluasi</div>
                </div>
              </div>
            </div>

            {/* Status Footer Pill */}
            <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SQLite DB Terkoneksi</span>
              </div>
              <span className="font-mono text-slate-400">konveksi.ruangtech.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
