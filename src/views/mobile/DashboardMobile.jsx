import React, { useMemo } from 'react';
import {
  Scissors,
  Clock,
  Package,
  Boxes,
  Plus,
  ArrowLeftRight,
  ChevronRight,
} from 'lucide-react';

export default function DashboardMobile({
  antreanList = [],
  products = [],
  bahan = [],
  employees = [],
  onNavigate,
  onOpenAddAntrean,
  onNextStatus,
}) {
  const stats = useMemo(() => {
    const totalAntrean = antreanList.length;
    const antreanAktif = antreanList.filter(
      (a) => a.statusTahapan !== 'Selesai Gudang' && a.statusTahapan !== 'Selesai'
    ).length;
    const totalPcs = antreanList.reduce((acc, a) => acc + (Number(a.targetQty) || 0), 0);
    const totalProduk = products.length;
    const totalBahan = bahan.length;

    const waitingCutting = antreanList.filter(
      (a) => !a.statusTahapan || a.statusTahapan === 'Menunggu Cutting'
    ).length;
    const inCutting = antreanList.filter((a) => a.statusTahapan === 'Proses Cutting').length;
    const inJahit = antreanList.filter((a) => a.statusTahapan === 'Proses Jahit').length;
    const inQc = antreanList.filter((a) => a.statusTahapan === 'Proses QC').length;
    const selesai = antreanList.filter(
      (a) => a.statusTahapan === 'Selesai Gudang' || a.statusTahapan === 'Selesai'
    ).length;

    return {
      totalAntrean,
      antreanAktif,
      totalPcs,
      totalProduk,
      totalBahan,
      waitingCutting,
      inCutting,
      inJahit,
      inQc,
      selesai,
    };
  }, [antreanList, products, bahan]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Cutting':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Menunggu Cutting</span>;
      case 'Proses Cutting':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Cutting</span>;
      case 'Proses Jahit':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Jahit</span>;
      case 'Proses QC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">QC</span>;
      case 'Proses Finishing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">Finishing</span>;
      case 'Selesai Gudang':
      case 'Selesai':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Selesai Gudang</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">{status || 'Draft'}</span>;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Banner Selamat Datang */}
      <div className="bg-gradient-to-r from-[#0b1329] to-[#1e293b] p-3.5 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            Sistem Operasional
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <h2 className="text-base font-extrabold mt-1 text-white">
          Halo, Admin Produksi! ✂️
        </h2>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
          Pantau antrean potong, jahit, QC, hingga stok jadi dari genggaman.
        </p>

        {/* Tombol Shortcut Header */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onOpenAddAntrean}
            className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Antrean Baru</span>
          </button>
          <button
            onClick={() => onNavigate('mutasi')}
            className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mutasi Bahan</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Ringkas */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Antrean Aktif</span>
            <Scissors className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{stats.antreanAktif}</div>
          <div className="text-[9.5px] text-slate-500">{stats.totalPcs} Pcs target</div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Siap Cutting</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-600 mt-0.5">{stats.waitingCutting}</div>
          <div className="text-[9.5px] text-slate-500">Batch belum potong</div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Katalog SKU</span>
            <Package className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{stats.totalProduk}</div>
          <div className="text-[9.5px] text-slate-500">Varian produk aktif</div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Bahan Baku</span>
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{stats.totalBahan}</div>
          <div className="text-[9.5px] text-slate-500">Item kain & benang</div>
        </div>
      </div>

      {/* Pipeline SOP Mini */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
          <span>Progres Pipa SOP</span>
          <span className="text-[10px] text-cyan-700 font-semibold">{stats.totalAntrean} Batch</span>
        </div>
        <div className="grid grid-cols-5 gap-1 text-center">
          <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200">
            <div className="text-xs font-extrabold text-amber-700">{stats.waitingCutting}</div>
            <div className="text-[8.5px] text-amber-800 leading-tight">Tunggu</div>
          </div>
          <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-200">
            <div className="text-xs font-extrabold text-blue-700">{stats.inCutting}</div>
            <div className="text-[8.5px] text-blue-800 leading-tight">Cutting</div>
          </div>
          <div className="bg-purple-50 p-1.5 rounded-lg border border-purple-200">
            <div className="text-xs font-extrabold text-purple-700">{stats.inJahit}</div>
            <div className="text-[8.5px] text-purple-800 leading-tight">Jahit</div>
          </div>
          <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-200">
            <div className="text-xs font-extrabold text-indigo-700">{stats.inQc}</div>
            <div className="text-[8.5px] text-indigo-800 leading-tight">QC</div>
          </div>
          <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
            <div className="text-xs font-extrabold text-emerald-700">{stats.selesai}</div>
            <div className="text-[8.5px] text-emerald-800 leading-tight">Selesai</div>
          </div>
        </div>
      </div>

      {/* Antrean Terbaru (3 Card) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Antrean Produksi Berjalan</span>
          <button
            onClick={() => onNavigate('antrean')}
            className="text-[11px] font-bold text-cyan-600 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {antreanList.slice(0, 3).map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {item.noAntrean}
              </span>
              {getStatusBadge(item.statusTahapan)}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 leading-snug">{item.modelProduk}</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                {item.sku} • {item.varianWarna} ({item.ukuran}) • Target:{' '}
                <span className="font-bold text-slate-800">{item.targetQty} Pcs</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Deadline: {item.deadline || '-'}</span>
              {item.statusTahapan !== 'Selesai Gudang' && item.statusTahapan !== 'Selesai' && (
                <button
                  onClick={() => onNextStatus(item)}
                  className="text-[10.5px] font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-2.5 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Geser Tahap →
                </button>
              )}
            </div>
          </div>
        ))}

        {antreanList.length === 0 && (
          <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            Belum ada antrean produksi
          </div>
        )}
      </div>
    </div>
  );
}

