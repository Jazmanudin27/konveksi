import React, { useState, useMemo } from 'react';
import { Search, Plus, Scissors, ChevronRight } from 'lucide-react';

export default function AntreanMobile({
  antreanList = [],
  onOpenAddAntrean,
  onNextStatus,
}) {
  const [antreanSearch, setAntreanSearch] = useState('');
  const [antreanFilterStatus, setAntreanFilterStatus] = useState('SEMUA');

  const normalizedList = useMemo(() => {
    return antreanList.map((item) => {
      const qty = Number(item.qty ?? item.targetQty ?? 0);
      const status = item.status || item.statusTahapan || 'Menunggu Cutting';
      const noAntrian = item.noAntrian || item.noAntrean || `ANT-${item.id}`;
      const namaProduk = item.namaProduk || item.modelProduk || 'Produk Konveksi';
      const varian = item.varian || item.varianWarna || '';
      return {
        ...item,
        qty,
        status,
        noAntrian,
        namaProduk,
        varian,
      };
    });
  }, [antreanList]);

  const filteredAntrean = useMemo(() => {
    return normalizedList.filter((item) => {
      const matchSearch =
        (item.noAntrian || '').toLowerCase().includes(antreanSearch.toLowerCase()) ||
        (item.namaProduk || '').toLowerCase().includes(antreanSearch.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(antreanSearch.toLowerCase());

      if (!matchSearch) return false;
      if (antreanFilterStatus === 'SEMUA') return true;
      if (antreanFilterStatus === 'AKTIF') {
        return item.status !== 'Selesai Gudang' && item.status !== 'Selesai';
      }
      return item.status === antreanFilterStatus;
    });
  }, [normalizedList, antreanSearch, antreanFilterStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Cutting':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Menunggu Cutting</span>;
      case 'Proses Cutting':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">Cutting</span>;
      case 'Proses Jahit':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Jahit</span>;
      case 'Proses QC':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">QC</span>;
      case 'Proses Finishing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">Finishing</span>;
      case 'Selesai Gudang':
      case 'Selesai':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Selesai Gudang</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status || 'Draft'}</span>;
    }
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Search & Tambah */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari no antrean / SKU / nama..."
            value={antreanSearch}
            onChange={(e) => setAntreanSearch(e.target.value)}
            className="w-full bg-white pl-9 pr-3 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
          />
        </div>
        <button
          onClick={onOpenAddAntrean}
          className="p-2.5 bg-[#064e3b] hover:bg-[#043e2f] active:scale-95 text-white rounded-2xl shadow-xs shrink-0 cursor-pointer transition-colors"
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
                ? 'bg-[#064e3b] text-white shadow-xs'
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
          <div key={item.id} className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {item.noAntrian}
                </span>
                <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {item.sumberPermintaan || 'PO'}
                </span>
              </div>
              {getStatusBadge(item.status)}
            </div>

            <div>
              <div className="font-extrabold text-xs text-slate-900 leading-snug">{item.namaProduk}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                SKU: <span className="font-mono text-slate-700 font-bold">{item.sku}</span> • {item.varian} ({item.ukuran})
              </div>
              {item.skuBahan && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Bahan: {item.skuBahan}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Target: </span>
                <span className="font-black text-slate-900">{item.qty || 50} Pcs</span>
              </div>

              {/* Aksi Cepat Geser Tahap */}
              <div className="flex items-center gap-1.5">
                {item.status !== 'Selesai Gudang' && item.status !== 'Selesai' && (
                  <button
                    onClick={() => onNextStatus(item)}
                    className="text-[10.5px] font-bold text-white bg-[#064e3b] hover:bg-[#043e2f] px-3 py-1 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
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
          <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            Tidak ada antrean yang cocok dengan filter
          </div>
        )}
      </div>
    </div>
  );
}
