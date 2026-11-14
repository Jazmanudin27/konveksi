import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';

export default function AntreanMobile({
  antreanList = [],
  onOpenAddAntrean,
  onNextStatus,
}) {
  const [antreanSearch, setAntreanSearch] = useState('');
  const [antreanFilterStatus, setAntreanFilterStatus] = useState('SEMUA');

  const filteredAntrean = useMemo(() => {
    return antreanList.filter((item) => {
      const matchSearch =
        (item.noAntrean || '').toLowerCase().includes(antreanSearch.toLowerCase()) ||
        (item.modelProduk || '').toLowerCase().includes(antreanSearch.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(antreanSearch.toLowerCase());

      if (!matchSearch) return false;
      if (antreanFilterStatus === 'SEMUA') return true;
      if (antreanFilterStatus === 'AKTIF') {
        return item.statusTahapan !== 'Selesai Gudang' && item.statusTahapan !== 'Selesai';
      }
      return item.statusTahapan === antreanFilterStatus;
    });
  }, [antreanList, antreanSearch, antreanFilterStatus]);

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
    <div className="space-y-3">
      {/* Search & Tambah */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari antrean / SKU / model..."
            value={antreanSearch}
            onChange={(e) => setAntreanSearch(e.target.value)}
            className="w-full bg-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button
          onClick={onOpenAddAntrean}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-xs shrink-0 cursor-pointer transition-colors"
          title="Tambah Antrean Baru"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs Horizontal */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {[
          { key: 'SEMUA', label: 'Semua' },
          { key: 'AKTIF', label: 'Aktif' },
          { key: 'Menunggu Cutting', label: 'Tunggu' },
          { key: 'Proses Cutting', label: 'Cutting' },
          { key: 'Proses Jahit', label: 'Jahit' },
          { key: 'Proses QC', label: 'QC' },
          { key: 'Selesai Gudang', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAntreanFilterStatus(tab.key)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
              antreanFilterStatus === tab.key
                ? 'bg-[#0b1329] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Kartu Antrean */}
      <div className="space-y-2.5">
        {filteredAntrean.map((item) => (
          <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {item.noAntrean}
                </span>
                <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.sumberPermintaan || 'PO'}
                </span>
              </div>
              {getStatusBadge(item.statusTahapan)}
            </div>

            <div>
              <div className="font-bold text-xs text-slate-900 leading-snug">{item.modelProduk}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                SKU: <span className="font-mono text-slate-700 font-semibold">{item.sku}</span> • {item.varianWarna} ({item.ukuran})
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                Kain: {item.bahanBaku || '-'}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Target: </span>
                <span className="font-extrabold text-slate-800">{item.targetQty} Pcs</span>
              </div>

              {/* Aksi Cepat Geser Tahap */}
              <div className="flex items-center gap-1.5">
                {item.statusTahapan !== 'Selesai Gudang' && item.statusTahapan !== 'Selesai' && (
                  <button
                    onClick={() => onNextStatus(item)}
                    className="text-[10.5px] font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 px-2.5 py-1 rounded-md shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lanjut Tahap</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAntrean.length === 0 && (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            Tidak ada antrean yang cocok dengan filter
          </div>
        )}
      </div>
    </div>
  );
}

