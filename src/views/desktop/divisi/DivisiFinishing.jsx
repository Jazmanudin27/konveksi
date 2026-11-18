import React, { useState, useEffect, useMemo } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  AlertCircle,
  Shirt,
  UserCheck,
  Warehouse,
  ShieldCheck,
  Check,
  Sparkles,
  Boxes
} from 'lucide-react';
import { api } from '../../../services/api';
import { Swal } from '../../../utils/swal';

export default function DivisiFinishing({
  antreanList = [],
  setAntreanList,
  products = [],
  employees = [],
  mutasiGudangJadiList = [],
  setMutasiGudangJadiList
}) {
  const [activeTab, setActiveTab] = useState('proses'); // 'proses' | 'riwayat'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Modal Selesai Finishing & Serah ke Gudang Jadi
  const [selesaiModalItem, setSelesaiModalItem] = useState(null);
  const [selesaiForm, setSelesaiForm] = useState({
    tglDiserahkan: new Date().toISOString().slice(0, 10),
    petugasSerah: 'Admin Finishing',
    lokasiRak: 'RAK-GUDANG-A',
    catatan: 'Pakaian telah disetrika uap, hangtag terpasang, dan dikemas rapi.'
  });

  // Master Tim Finishing
  const [timFinishingList, setTimFinishingList] = useState([]);

  useEffect(() => {
    api.getTimFinishing()
      .then((data) => {
        if (Array.isArray(data)) setTimFinishingList(data);
      })
      .catch(() => {});
  }, []);

  // Filter Data Khusus Divisi Finishing
  const finishingData = useMemo(() => {
    return antreanList.filter((item) => {
      if (activeTab === 'proses') {
        return item.status === 'Proses Finishing';
      }
      if (activeTab === 'riwayat') {
        return item.status === 'Selesai';
      }
      return false;
    });
  }, [antreanList, activeTab]);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return finishingData;
    const q = searchTerm.toLowerCase();
    return finishingData.filter(
      (item) =>
        (item.noAntrian || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.namaProduk || '').toLowerCase().includes(q) ||
        (item.timFinishing || '').toLowerCase().includes(q) ||
        (item.noReff || '').toLowerCase().includes(q)
    );
  }, [finishingData, searchTerm]);

  // Statistik KPI Divisi Finishing
  const stats = useMemo(() => {
    const proses = antreanList.filter((i) => i.status === 'Proses Finishing');
    const riwayat = antreanList.filter((i) => i.status === 'Selesai');
    const totalPcsProses = proses.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const totalPcsSelesai = riwayat.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    return {
      prosesCount: proses.length,
      riwayatCount: riwayat.length,
      totalPcsProses,
      totalPcsSelesai
    };
  }, [antreanList]);

  // Buka Modal Serah ke Gudang Jadi
  const handleOpenSelesai = (item) => {
    setSelesaiForm({
      tglDiserahkan: new Date().toISOString().slice(0, 10),
      petugasSerah: item.timFinishing || 'Admin Finishing',
      lokasiRak: 'RAK-GUDANG-A',
      catatan: 'Pakaian telah disetrika uap, hangtag terpasang, dan dikemas plastik OPP.'
    });
    setSelesaiModalItem(item);
  };

  // Submit Serah ke Gudang Jadi
  const handleSubmitSelesai = async (e) => {
    e.preventDefault();
    if (!selesaiModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [selesaiModalItem.id],
        tglDiserahkan: selesaiForm.tglDiserahkan,
        tglSelesai: selesaiForm.tglDiserahkan,
        petugasSerah: selesaiForm.petugasSerah,
        timFinishing: selesaiModalItem.timFinishing || selesaiForm.petugasSerah,
        lokasiRak: selesaiForm.lokasiRak,
        catatan: selesaiForm.catatan
      };

      await api.selesaiFinishing(payload);

      // Refresh seluruh data antrean & mutasi gudang dari database MySQL
      const fresh = await api.getAntrean();
      if (Array.isArray(fresh)) setAntreanList(fresh);

      if (setMutasiGudangJadiList) {
        api.getMutasiGudangJadi().then((mg) => {
          if (Array.isArray(mg)) setMutasiGudangJadiList(mg);
        }).catch(() => {});
      }

      Swal.success(
        'Finishing Selesai!',
        `Antrean ${selesaiModalItem.noAntrian} berhasil diserahkan ke Gudang Jadi (Lokasi: ${selesaiForm.lokasiRak}).`
      );

      setSelesaiModalItem(null);
      setActiveTab('riwayat');
    } catch (err) {
      Swal.error('Gagal Serahkan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. HEADER BANNER KHUSUS DIVISI FINISHING */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 text-white rounded-xl p-4 sm:px-6 shadow-sm border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Divisi Finishing & Packing
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-rose-100 border border-white/25">
                Admin Finishing
              </span>
            </div>
            <p className="text-xs text-rose-100/90 mt-0.5">
              Setrika uap, pembersihan benang sisa, pemasangan hangtag label, packing plastik OPP, dan serah terima ke Gudang Jadi.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            api.getAntrean()
              .then((fresh) => {
                if (Array.isArray(fresh)) setAntreanList(fresh);
                Swal.toast('Data finishing diperbarui');
              })
              .finally(() => setLoading(false));
          }}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 active:scale-95 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('proses')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'proses'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sedang Finishing
            </span>
            <PackageCheck className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.prosesCount}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
            {stats.totalPcsProses.toLocaleString('id-ID')} Pcs Sedang Dikemas
          </p>
        </div>

        <div
          onClick={() => setActiveTab('riwayat')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'riwayat'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Selesai ke Gudang
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 leading-tight">
            {stats.riwayatCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {stats.totalPcsSelesai.toLocaleString('id-ID')} Pcs Masuk Gudang Jadi
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tim Finishing
            </span>
            <UserCheck className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {timFinishingList.length > 0 ? timFinishingList.length : 'Aktif'}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Tim Finishing & Kemas
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Status Gudang
            </span>
            <Warehouse className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            Ready
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Auto Input Mutu & Rak
          </p>
        </div>
      </div>

      {/* 3. TABS NAVIGASI WORKFLOW & PENCARIAN */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('proses')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'proses'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Sedang Finishing</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'proses' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.prosesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'riwayat'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Riwayat Selesai ke Gudang</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'riwayat' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.riwayatCount}
            </span>
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari No Antrian / SKU / Tim..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-rose-600"
          />
        </div>
      </div>

      {/* 4. TABEL DATA WORKFLOW FINISHING */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-700">NO</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">NO ANTREAN & PO</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-700">PRODUK & SKU</th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">TARGET QTY</th>
                <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-700">TIM FINISHING</th>
                <th className="py-2.5 px-3 text-right w-28 border-r border-slate-700">ONGKOS KEMAS</th>
                <th className="py-2.5 px-3 text-center w-32 border-r border-slate-700">STATUS</th>
                <th className="py-2.5 px-3 text-center min-w-[150px]">AKSI DIVISI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">
                      Tidak ada antrean finishing pada filter ini
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Semua order finishing telah selesai dikirim ke gudang jadi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const qtyVal = Number(item.qty) || 0;
                  const tarifVal = Number(item.tarifFinishing) || 1000;
                  const totalOngkos = Number(item.totalBiayaFinishing) || qtyVal * tarifVal;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* NO */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO ANTREAN & PO */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-mono font-bold text-xs text-rose-600">
                          {item.noAntrian}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-normal">
                          {item.noReff || 'Internal'} • {item.tglMasuk || '-'}
                        </div>
                      </td>

                      {/* PRODUK & SKU */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.namaProduk || item.sku}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold border border-slate-200">
                            {item.sku}
                          </span>
                          {item.varian && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({item.varian} - {item.ukuran || 'All Size'})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TARGET QTY */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200/60">
                        {qtyVal.toLocaleString('id-ID')} Pcs
                      </td>

                      {/* TIM FINISHING */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{item.timFinishing || 'Tim Finishing & Packing'}</span>
                        </div>
                        {item.tglSerahFinishing && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            Mulai: {item.tglSerahFinishing}
                          </div>
                        )}
                      </td>

                      {/* ONGKOS FINISHING */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-200/60 font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          Rp {tarifVal.toLocaleString('id-ID')}/pc
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Total: Rp {totalOngkos.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200/60">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            item.status === 'Proses Finishing'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* JIKA STATUS PROSES FINISHING -> TOMBOL SELESAI SERAH KE GUDANG JADI */}
                          {item.status === 'Proses Finishing' && (
                            <button
                              onClick={() => handleOpenSelesai(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Selesaikan Packing & Serahkan ke Gudang Jadi"
                            >
                              <Warehouse className="w-3.5 h-3.5" />
                              <span>Serah ke Gudang</span>
                            </button>
                          )}

                          {/* DETAIL BUTTON */}
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="w-7 h-7 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Lihat Rincian Antrean"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SUMMARY FOOTER */}
        <div className="bg-[#f8fafc] border-t border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredData.length}</span> antrean finishing
          </div>
          <div className="font-semibold text-slate-700">
            Divisi Finishing • Terhubung Database MySQL
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM SERAH KE GUDANG JADI */}
      {selesaiModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Serah Terima ke Gudang Jadi
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {selesaiModalItem.noAntrian} • Qty: {selesaiModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelesaiModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSelesai} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Produk Selesai Dikemas
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800">
                  <span className="font-bold text-slate-900 block">{selesaiModalItem.namaProduk}</span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {selesaiModalItem.sku} • ({selesaiModalItem.varian || 'Polos'} - {selesaiModalItem.ukuran || 'All Size'})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Penyerahan *
                  </label>
                  <input
                    type="date"
                    required
                    value={selesaiForm.tglDiserahkan}
                    onChange={(e) =>
                      setSelesaiForm({ ...selesaiForm, tglDiserahkan: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lokasi Rak Gudang *
                  </label>
                  <input
                    type="text"
                    required
                    value={selesaiForm.lokasiRak}
                    onChange={(e) =>
                      setSelesaiForm({ ...selesaiForm, lokasiRak: e.target.value })
                    }
                    placeholder="mis: RAK-A1"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Petugas Penyerah Finishing *
                </label>
                <input
                  type="text"
                  required
                  value={selesaiForm.petugasSerah}
                  onChange={(e) =>
                    setSelesaiForm({ ...selesaiForm, petugasSerah: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Gudang Jadi
                </label>
                <textarea
                  rows="2"
                  value={selesaiForm.catatan}
                  onChange={(e) =>
                    setSelesaiForm({ ...selesaiForm, catatan: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelesaiModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{loading ? 'Menyimpan...' : 'Selesaikan & Masukkan Gudang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL ITEM */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Detail Antrean: {selectedItemDetail.noAntrian}
              </h3>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Produk</span>
                <span className="font-bold text-slate-900">{selectedItemDetail.namaProduk}</span>
                <span className="text-slate-500 block text-[11px] font-mono">{selectedItemDetail.sku}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Qty</span>
                <span className="font-black text-rose-600 text-sm">{selectedItemDetail.qty} Pcs</span>
                <span className="text-slate-500 block text-[11px]">Status: {selectedItemDetail.status}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Tim Finishing</span>
                <span className="font-bold text-slate-800">{selectedItemDetail.timFinishing || '-'}</span>
                <span className="text-slate-500 block text-[10.5px]">Mulai: {selectedItemDetail.tglSerahFinishing || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Ongkos Finishing</span>
                <span className="font-bold text-emerald-700">Rp {Number(selectedItemDetail.totalBiayaFinishing || 0).toLocaleString('id-ID')}</span>
                <span className="text-slate-500 block text-[10.5px]">Tarif: Rp {Number(selectedItemDetail.tarifFinishing || 1000).toLocaleString('id-ID')}/pc</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

