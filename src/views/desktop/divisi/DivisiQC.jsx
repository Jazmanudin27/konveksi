import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  AlertCircle,
  Shirt,
  UserCheck,
  PackageCheck,
  ShieldCheck,
  Check,
  XCircle,
  RotateCcw,
  Camera,
  QrCode,
  Printer
} from 'lucide-react';
import { api } from '../../../services/api';
import { Swal } from '../../../utils/swal';
import ScannerModal from '../../../components/common/ScannerModal';
import CetakSpkModal from '../antrean/CetakSpkModal';

export default function DivisiQC({ antreanList = [], setAntreanList, products = [], employees = [], currentUser = null }) {
  const [activeTab, setActiveTab] = useState('inspeksi'); // 'inspeksi' | 'riwayat'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCetakSpk, setSelectedCetakSpk] = useState(null);

  // Modal Inspeksi & Approval QC
  const [inspeksiModalItem, setInspeksiModalItem] = useState(null);
  const [inspeksiForm, setInspeksiForm] = useState({
    qtyPassQc: 0,
    qtyRejectQc: 0,
    catatanRejectQc: '',
    tglSerahFinishing: new Date().toISOString().slice(0, 10),
    timFinishing: 'Tim Finishing & Packing',
    tarifFinishing: 1000,
    catatanFinishing: ''
  });

  // Filter Data Khusus Divisi QC
  const qcData = useMemo(() => {
    return antreanList.filter((item) => {
      if (activeTab === 'inspeksi') {
        return item.status === 'Proses QC';
      }
      if (activeTab === 'riwayat') {
        return (
          item.status === 'Proses Finishing' ||
          item.status === 'Selesai' ||
          (item.qtyPassQc !== undefined && item.qtyPassQc !== null && Number(item.qtyPassQc) > 0)
        );
      }
      return false;
    });
  }, [antreanList, activeTab]);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return qcData;
    const q = searchTerm.toLowerCase();
    return qcData.filter(
      (item) =>
        (item.noAntrian || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.namaProduk || '').toLowerCase().includes(q) ||
        (item.timQc || '').toLowerCase().includes(q) ||
        (item.timJahit || '').toLowerCase().includes(q) ||
        (item.noReff || '').toLowerCase().includes(q)
    );
  }, [qcData, searchTerm]);

  // Statistik KPI Divisi QC
  const stats = useMemo(() => {
    const perluInspeksi = antreanList.filter((i) => i.status === 'Proses QC');
    const riwayat = antreanList.filter((i) => ['Proses Finishing', 'Selesai'].includes(i.status));

    const totalPcsPerluInspeksi = perluInspeksi.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const totalPass = antreanList.reduce((sum, i) => sum + (Number(i.qtyPassQc) || 0), 0);
    const totalReject = antreanList.reduce((sum, i) => sum + (Number(i.qtyRejectQc) || 0), 0);

    return {
      perluInspeksiCount: perluInspeksi.length,
      riwayatCount: riwayat.length,
      totalPcsPerluInspeksi,
      totalPass,
      totalReject
    };
  }, [antreanList]);

  // Buka Modal Inspeksi & Approval QC
  const handleOpenInspeksi = (item) => {
    const totalQty = Number(item.qty) || 1;
    setInspeksiForm({
      qtyPassQc: totalQty,
      qtyRejectQc: 0,
      catatanRejectQc: '',
      tglSerahFinishing: new Date().toISOString().slice(0, 10),
      timFinishing: item.timFinishing || 'Tim Finishing & Packing',
      tarifFinishing: Number(item.tarifFinishing) || 1000,
      catatanFinishing: 'Jahitan dan bahan telah lolos uji mutu standar'
    });
    setInspeksiModalItem(item);
  };

  const handleScannerAction = (matchedItem) => {
    handleOpenInspeksi(matchedItem);
  };

  // Handle Perubahan Qty Lolos & Reject
  const handlePassChange = (val) => {
    if (!inspeksiModalItem) return;
    const totalQty = Number(inspeksiModalItem.qty) || 0;
    const num = Math.max(0, Math.min(totalQty, Number(val) || 0));
    setInspeksiForm((p) => ({
      ...p,
      qtyPassQc: num,
      qtyRejectQc: totalQty - num
    }));
  };

  const handleRejectChange = (val) => {
    if (!inspeksiModalItem) return;
    const totalQty = Number(inspeksiModalItem.qty) || 0;
    const num = Math.max(0, Math.min(totalQty, Number(val) || 0));
    setInspeksiForm((p) => ({
      ...p,
      qtyRejectQc: num,
      qtyPassQc: totalQty - num
    }));
  };

  // Submit Approval & Serahkan ke Finishing
  const handleSubmitInspeksi = async (e) => {
    e.preventDefault();
    if (!inspeksiModalItem) return;

    const totalQty = Number(inspeksiModalItem.qty) || 0;
    const pass = Number(inspeksiForm.qtyPassQc) || 0;
    const reject = Number(inspeksiForm.qtyRejectQc) || 0;

    if (pass + reject !== totalQty) {
      Swal.warning('Kuantitas Belum Sesuai', `Jumlah Lolos (${pass}) + Reject (${reject}) harus sama dengan Total Order (${totalQty}).`);
      return;
    }

    if (reject > 0 && !inspeksiForm.catatanRejectQc.trim()) {
      Swal.warning('Alasan Reject Wajib Diisi', 'Silakan isi catatan reject agar penjahit mengetahui bagian mana yang perlu diperbaiki.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ids: [inspeksiModalItem.id],
        qtyPassQc: pass,
        qtyRejectQc: reject,
        catatanRejectQc: inspeksiForm.catatanRejectQc,
        tglSerahFinishing: inspeksiForm.tglSerahFinishing,
        timFinishing: inspeksiForm.timFinishing,
        tarifFinishing: Number(inspeksiForm.tarifFinishing) || 1000,
        catatanFinishing: inspeksiForm.catatanFinishing
      };

      const res = await api.serahFinishing(payload);

      // Refresh seluruh data antrean dari backend agar retur split ter-sinkron
      const fresh = await api.getAntrean();
      if (Array.isArray(fresh)) setAntreanList(fresh);

      if (reject > 0) {
        Swal.success(
          'Inspeksi QC Selesai!',
          `${pass} Pcs Lolos ke Finishing. ${reject} Pcs Reject otomatis dibuatkan tiket perbaikan ke penjahit (${inspeksiModalItem.timJahit || 'Jahit'}).`
        );
      } else {
        Swal.success(
          'Lolos 100%!',
          `Seluruh ${pass} Pcs lolos QC dan telah diserahkan ke Divisi Finishing.`
        );
      }

      setInspeksiModalItem(null);
    } catch (err) {
      Swal.error('Gagal Submit QC', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. HEADER BANNER KHUSUS DIVISI QC */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white rounded-xl p-4 sm:px-6 shadow-sm border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Divisi Quality Control (QC)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-teal-100 border border-white/25">
                Admin QC
              </span>
            </div>
            <p className="text-xs text-teal-100/90 mt-0.5">
              Inspeksi kerapihan jahitan, pengukuran ukuran, approval kelayakan produk, dan pemisahan reject retur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 border border-emerald-400"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Barcode SPK</span>
          </button>

          <button
            onClick={() => {
              setLoading(true);
              api.getAntrean()
                .then((fresh) => {
                  if (Array.isArray(fresh)) setAntreanList(fresh);
                  Swal.toast('Data QC diperbarui');
                })
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('inspeksi')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'inspeksi'
              ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-teal-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Perlu Diinspeksi
            </span>
            <AlertCircle className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.perluInspeksiCount}
          </div>
          <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
            {stats.totalPcsPerluInspeksi.toLocaleString('id-ID')} Pcs Siap QC
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Lolos QC
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 leading-tight">
            {stats.totalPass.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Pcs Masuk Finishing
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Reject QC
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 leading-tight">
            {stats.totalReject.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
            Pcs Retur Perbaikan Jahit
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
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Riwayat QC
            </span>
            <PackageCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.riwayatCount}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Batch Telah Diperiksa
          </p>
        </div>
      </div>

      {/* 3. TABS NAVIGASI WORKFLOW & PENCARIAN */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('inspeksi')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inspeksi'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Perlu Inspeksi QC</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'inspeksi' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.perluInspeksiCount}
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
            <span>Riwayat Hasil Inspeksi</span>
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
            placeholder="Cari No Antrian / SKU / Penjahit..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* 4. TABEL DATA WORKFLOW QC */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-700">NO</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">NO ANTREAN & PO</th>
                <th className="py-2.5 px-3 min-w-[190px] border-r border-slate-700">PRODUK & SKU</th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">TOTAL QTY</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">ASAL PENJAHIT</th>
                <th className="py-2.5 px-3 text-center min-w-[150px] border-r border-slate-700">HASIL INSPEKSI</th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-700">STATUS</th>
                <th className="py-2.5 px-3 text-center min-w-[150px]">AKSI DIVISI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">
                      Tidak ada antrean inspeksi pada filter ini
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Semua antrean jahit yang masuk telah selesai diinspeksi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const qtyVal = Number(item.qty) || 0;
                  const passVal = Number(item.qtyPassQc) || 0;
                  const rejectVal = Number(item.qtyRejectQc) || 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* NO */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO ANTREAN & PO */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-mono font-bold text-xs text-teal-600">
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

                      {/* TOTAL QTY */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200/60">
                        {qtyVal.toLocaleString('id-ID')} Pcs
                      </td>

                      {/* ASAL PENJAHIT */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{item.timJahit || '-'}</span>
                        </div>
                        {item.tglSerahQc && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            Serah QC: {item.tglSerahQc}
                          </div>
                        )}
                      </td>

                      {/* HASIL INSPEKSI */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200/60">
                        {item.status === 'Proses QC' ? (
                          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Menunggu Pemeriksaan
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ✓ Lolos: {passVal}
                            </span>
                            {rejectVal > 0 && (
                              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                ✕ Reject: {rejectVal}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200/60">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            item.status === 'Proses QC'
                              ? 'bg-teal-50 text-teal-700 border-teal-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* JIKA STATUS PROSES QC -> TOMBOL APPROVAL / INSPEKSI */}
                          {item.status === 'Proses QC' && (
                            <button
                              onClick={() => handleOpenInspeksi(item)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Inspeksi & Approval Hasil Uji Mutu"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Inspeksi QC</span>
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
            Menampilkan <span className="font-bold text-slate-900">{filteredData.length}</span> antrean QC
          </div>
          <div className="font-semibold text-slate-700">
            Divisi Quality Control • Terhubung Database MySQL
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM INSPEKSI & APPROVAL QC */}
      {inspeksiModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Inspeksi & Approval Mutu (QC)
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {inspeksiModalItem.noAntrian} • Total Target: {inspeksiModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspeksiModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitInspeksi} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Produk / Model & Asal Penjahit
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{inspeksiModalItem.namaProduk}</span>
                    <span className="text-slate-500 block text-[11px] font-mono">{inspeksiModalItem.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Penjahit</span>
                    <span className="font-bold text-purple-700">{inspeksiModalItem.timJahit || '-'}</span>
                  </div>
                </div>
              </div>

              {/* INPUT JUMLAH LOLOS & REJECT */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-black text-emerald-800 mb-1">
                    ✓ Jumlah Lolos QC (Pcs) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={inspeksiModalItem.qty}
                    required
                    value={inspeksiForm.qtyPassQc}
                    onChange={(e) => handlePassChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border-2 border-emerald-400 font-mono font-black text-base text-emerald-800 bg-emerald-50/50 text-right focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    Lanjut serah ke Finishing
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-rose-800 mb-1">
                    ✕ Jumlah Reject / Cacat (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={inspeksiModalItem.qty}
                    value={inspeksiForm.qtyRejectQc}
                    onChange={(e) => handleRejectChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border-2 border-rose-300 font-mono font-black text-base text-rose-800 bg-rose-50/50 text-right focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-rose-600 block mt-0.5">
                    Otomatis kembali ke Penjahit
                  </span>
                </div>
              </div>

              {/* JIKA ADA REJECT, TAMPILKAN INPUT CATATAN CACAT */}
              {Number(inspeksiForm.qtyRejectQc) > 0 && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Catatan Kerusakan / Cacat untuk Penjahit *</span>
                  </div>
                  <textarea
                    rows="2"
                    required
                    value={inspeksiForm.catatanRejectQc}
                    onChange={(e) =>
                      setInspeksiForm({ ...inspeksiForm, catatanRejectQc: e.target.value })
                    }
                    placeholder="misal: Jahitan kerah miring 0.5cm, obras kendor di bagian lengan..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-900 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              )}

              {/* DETAIL SERAH KE FINISHING */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Serah Finishing *
                  </label>
                  <input
                    type="date"
                    required
                    value={inspeksiForm.tglSerahFinishing}
                    onChange={(e) =>
                      setInspeksiForm({ ...inspeksiForm, tglSerahFinishing: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ongkos Finishing / Pcs (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={inspeksiForm.tarifFinishing}
                    onChange={(e) =>
                      setInspeksiForm({ ...inspeksiForm, tarifFinishing: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-teal-600 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tim Finishing Penerima *
                </label>
                <input
                  type="text"
                  required
                  value={inspeksiForm.timFinishing}
                  onChange={(e) =>
                    setInspeksiForm({ ...inspeksiForm, timFinishing: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Lolos QC
                </label>
                <textarea
                  rows="2"
                  value={inspeksiForm.catatanFinishing}
                  onChange={(e) =>
                    setInspeksiForm({ ...inspeksiForm, catatanFinishing: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                  placeholder="Catatan untuk tim setrika & packing..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspeksiModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{loading ? 'Menyimpan...' : 'Setujui & Serahkan ke Finishing'}</span>
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
                <span className="font-black text-teal-600 text-sm">{selectedItemDetail.qty} Pcs</span>
                <span className="text-slate-500 block text-[11px]">Penjahit: {selectedItemDetail.timJahit || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Hasil Uji Mutu</span>
                <span className="font-bold text-emerald-700 block">Lolos: {selectedItemDetail.qtyPassQc || 0} Pcs</span>
                <span className="font-bold text-rose-700 block">Reject: {selectedItemDetail.qtyRejectQc || 0} Pcs</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Biaya QC</span>
                <span className="font-bold text-slate-800">Rp {Number(selectedItemDetail.totalBiayaQc || 0).toLocaleString('id-ID')}</span>
                <span className="text-slate-500 block text-[10.5px]">Petugas: {selectedItemDetail.timQc || '-'}</span>
              </div>
            </div>

            {selectedItemDetail.catatanRejectQc && (
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-[10px] text-rose-700 block font-bold uppercase mb-0.5">Catatan Reject / Perbaikan</span>
                <p className="text-rose-900 italic">{selectedItemDetail.catatanRejectQc}</p>
              </div>
            )}

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
      {/* MODAL SCANNER BARCODE / QR SPK */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        division="qc"
        antreanList={antreanList}
        currentUser={currentUser}
        onActionSuccess={handleScannerAction}
      />

      {/* MODAL CETAK SPK & QR CODE */}
      <CetakSpkModal
        isOpen={Boolean(selectedCetakSpk)}
        antrean={selectedCetakSpk}
        products={products}
        onClose={() => setSelectedCetakSpk(null)}
      />
    </div>
  );
}

