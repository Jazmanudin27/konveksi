import React, { useState, useMemo } from 'react';
import { Search, Plus, Scissors, ChevronRight, Share2 } from 'lucide-react';
import ShareTrackingModal from '../../components/common/ShareTrackingModal';

export default function AntreanMobile({
  antreanList = [],
  onOpenAddAntrean,
  onNextStatus,
  isGudang = false,
}) {
  const [antreanSearch, setAntreanSearch] = useState('');
  const [antreanFilterStatus, setAntreanFilterStatus] = useState('SEMUA');
  const [shareItem, setShareItem] = useState(null);

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

  // Perhitungan Jumlah Antrean per Tahapan Status untuk Badge Tab
  const counts = useMemo(() => {
    const total = normalizedList.length;
    const aktif = normalizedList.filter(
      (a) => a.status !== 'Selesai Gudang' && a.status !== 'Selesai'
    ).length;
    const tunggu = normalizedList.filter(
      (a) => a.status === 'Menunggu Cutting' || a.status === 'Draft'
    ).length;
    const cutting = normalizedList.filter(
      (a) => a.status === 'Proses Cutting' || a.status === 'Sedang Diproses'
    ).length;
    const jahit = normalizedList.filter(
      (a) => a.status === 'Proses Jahit'
    ).length;
    const qc = normalizedList.filter(
      (a) => a.status === 'Proses QC'
    ).length;
    const finishing = normalizedList.filter(
      (a) => a.status === 'Proses Finishing'
    ).length;
    const selesai = normalizedList.filter(
      (a) => a.status === 'Selesai Gudang' || a.status === 'Selesai'
    ).length;

    return {
      total,
      aktif,
      tunggu,
      cutting,
      jahit,
      qc,
      finishing,
      selesai,
    };
  }, [normalizedList]);

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
      if (antreanFilterStatus === 'Menunggu Cutting') {
        return item.status === 'Menunggu Cutting' || item.status === 'Draft';
      }
      if (antreanFilterStatus === 'Proses Cutting') {
        return item.status === 'Proses Cutting' || item.status === 'Sedang Diproses';
      }
      if (antreanFilterStatus === 'Selesai Gudang') {
        return item.status === 'Selesai Gudang' || item.status === 'Selesai';
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

  const filterTabs = [
    { key: 'SEMUA', label: 'Semua', count: counts.total },
    { key: 'AKTIF', label: 'Aktif', count: counts.aktif },
    { key: 'Menunggu Cutting', label: 'Tunggu', count: counts.tunggu },
    { key: 'Proses Cutting', label: 'Cutting', count: counts.cutting },
    { key: 'Proses Jahit', label: 'Jahit', count: counts.jahit },
    { key: 'Proses QC', label: 'QC', count: counts.qc },
    { key: 'Proses Finishing', label: 'Finishing', count: counts.finishing },
    { key: 'Selesai Gudang', label: 'Selesai', count: counts.selesai },
  ];

  return (
    <div className="space-y-3 pb-6">
      {/* Search Bar Full Width */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari no antrean / SKU / nama..."
          value={antreanSearch}
          onChange={(e) => setAntreanSearch(e.target.value)}
          className="w-full bg-white pl-9 pr-3 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
        />
      </div>

      {/* Filter Tabs Horizontal dengan Angka Jumlah Transaksi */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {filterTabs.map((tab) => {
          const isSelected = antreanFilterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setAntreanFilterStatus(tab.key)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 text-xs ${
                isSelected
                  ? 'bg-[#064e3b] text-white shadow-xs font-extrabold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-bold'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
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

                {/* Aksi Cepat Buka Modal Serah Tahapan SOP & Share Tracking */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShareItem(item)}
                    className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    title="Bagikan Link Live Tracking ke Pelanggan"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  </button>

                  {/* Admin Gudang hanya input permintaan, tidak ada tombol serah cutting */}
                  {!isGudang && item.status !== 'Selesai Gudang' && item.status !== 'Selesai' && (
                    <button
                      onClick={() => onNextStatus(item)}
                      className="text-[10.5px] font-bold text-white bg-[#064e3b] hover:bg-[#043e2f] active:scale-95 px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {(item.status === 'Menunggu Cutting' || item.status === 'Draft') && 'Serah Cutting'}
                        {item.status === 'Proses Cutting' && 'Serah Jahit'}
                        {item.status === 'Proses Jahit' && 'Serah QC'}
                        {item.status === 'Proses QC' && 'Serah Finishing'}
                        {item.status === 'Proses Finishing' && 'Masuk Gudang'}
                      </span>
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

      {/* Floating Action Button (FAB) Tambah Antrean di Kanan Bawah seperti Live Chat */}
      <button
        type="button"
        onClick={onOpenAddAntrean}
        className="fixed bottom-20 right-4 z-40 h-12 px-4 rounded-full bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] hover:from-[#04362d] hover:to-[#032922] text-white font-extrabold text-xs shadow-2xl shadow-emerald-950/50 flex items-center gap-2 border-2 border-white/90 active:scale-95 transition-all cursor-pointer group"
        title="Tambah Antrean Produksi Baru"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
          <Plus className="w-4 h-4 stroke-[3] text-emerald-200 group-hover:rotate-90 transition-transform" />
        </div>
        <span className="tracking-wide">Tambah</span>
      </button>

      {/* Modal Share Tracking Link Customer */}
      <ShareTrackingModal
        isOpen={Boolean(shareItem)}
        item={shareItem}
        onClose={() => setShareItem(null)}
      />
    </div>
  );
}
