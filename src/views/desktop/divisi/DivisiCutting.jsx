import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Calendar,
  AlertCircle,
  Shirt,
  UserCheck,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../../../services/api';
import { Swal } from '../../../utils/swal';

export default function DivisiCutting({ antreanList = [], setAntreanList, products = [], employees = [] }) {
  const [activeTab, setActiveTab] = useState('approval'); // 'approval' | 'proses' | 'riwayat'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Modal Approval (Terima & Mulai Cutting)
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    tglSerahCutting: new Date().toISOString().slice(0, 10),
    timCutting: 'Tim Cutting Internal',
    tarifCutting: 0,
    catatanCutting: ''
  });

  // Modal Selesaikan & Serahkan ke Jahit
  const [serahJahitModalItem, setSerahJahitModalItem] = useState(null);
  const [serahJahitForm, setSerahJahitForm] = useState({
    tglSerahJahit: new Date().toISOString().slice(0, 10),
    timJahit: '',
    tarifJahit: 0,
    catatanJahit: ''
  });

  // Filter daftar tenaga kerja cutting
  const cuttingWorkers = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'Aktif' &&
        (String(e.bagian || '').toLowerCase().includes('cut') ||
          String(e.bagian || '').toLowerCase().includes('potong'))
    );
  }, [employees]);

  // Filter daftar penjahit
  const jahitWorkers = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'Aktif' &&
        (String(e.bagian || '').toLowerCase().includes('jahit') ||
          String(e.bagian || '').toLowerCase().includes('sew'))
    );
  }, [employees]);

  // Filter Data Khusus Divisi Cutting
  const cuttingData = useMemo(() => {
    return antreanList.filter((item) => {
      // Hanya menampilkan yang relevan dengan Divisi Cutting
      if (activeTab === 'approval') {
        return item.status === 'Menunggu Cutting';
      }
      if (activeTab === 'proses') {
        return item.status === 'Proses Cutting';
      }
      if (activeTab === 'riwayat') {
        return (
          item.status === 'Proses Jahit' ||
          item.status === 'Proses QC' ||
          item.status === 'Proses Finishing' ||
          item.status === 'Selesai'
        );
      }
      return false;
    });
  }, [antreanList, activeTab]);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return cuttingData;
    const q = searchTerm.toLowerCase();
    return cuttingData.filter(
      (item) =>
        (item.noAntrian || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.namaProduk || '').toLowerCase().includes(q) ||
        (item.timCutting || '').toLowerCase().includes(q) ||
        (item.noReff || '').toLowerCase().includes(q)
    );
  }, [cuttingData, searchTerm]);

  // Statistik KPI Divisi Cutting
  const stats = useMemo(() => {
    const menunggu = antreanList.filter((i) => i.status === 'Menunggu Cutting');
    const proses = antreanList.filter((i) => i.status === 'Proses Cutting');
    const riwayat = antreanList.filter((i) =>
      ['Proses Jahit', 'Proses QC', 'Proses Finishing', 'Selesai'].includes(i.status)
    );
    const totalPcsProses = proses.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    return {
      menungguCount: menunggu.length,
      prosesCount: proses.length,
      riwayatCount: riwayat.length,
      totalPcsProses
    };
  }, [antreanList]);

  // Buka Modal Approval Terima Order Cutting
  const handleOpenApproval = (item) => {
    const matchedProd = products.find((p) => p.sku === item.sku);
    const defTarif = Number(matchedProd?.hargaPotong || item.tarifCutting || 700);

    setApprovalForm({
      tglSerahCutting: new Date().toISOString().slice(0, 10),
      timCutting: cuttingWorkers.length > 0 ? cuttingWorkers[0].nama : 'Tim Cutting 1',
      tarifCutting: defTarif,
      catatanCutting: item.catatanCutting || 'Pola dan potongan presisi sesuai SOP'
    });
    setApprovalModalItem(item);
  };

  // Submit Approval Terima Order Cutting
  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!approvalModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [approvalModalItem.id],
        tglSerahCutting: approvalForm.tglSerahCutting,
        timCutting: approvalForm.timCutting,
        tarifCutting: Number(approvalForm.tarifCutting) || 0,
        catatanCutting: approvalForm.catatanCutting
      };

      await api.serahCutting(payload);

      // Update state lokal
      setAntreanList((prev) =>
        prev.map((ant) =>
          ant.id === approvalModalItem.id
            ? {
                ...ant,
                status: 'Proses Cutting',
                tglSerahCutting: approvalForm.tglSerahCutting,
                timCutting: approvalForm.timCutting,
                tarifCutting: Number(approvalForm.tarifCutting) || 0,
                totalBiayaCutting: (Number(ant.qty) || 1) * (Number(approvalForm.tarifCutting) || 0),
                catatanCutting: approvalForm.catatanCutting
              }
            : ant
        )
      );

      Swal.success(
        'Order Diterima!',
        `Antrean ${approvalModalItem.noAntrian} berhasil disetujui & masuk proses cutting.`
      );
      setApprovalModalItem(null);
      setActiveTab('proses');
    } catch (err) {
      Swal.error('Gagal Approval', err.message || 'Terjadi kesalahan saat menerima order.');
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Serah ke Jahit
  const handleOpenSerahJahit = (item) => {
    setSerahJahitForm({
      tglSerahJahit: new Date().toISOString().slice(0, 10),
      timJahit: jahitWorkers.length > 0 ? jahitWorkers[0].nama : 'Tim Jahit 1',
      tarifJahit: 3500,
      catatanJahit: 'Bahan potongan lengkap, siap jahit.'
    });
    setSerahJahitModalItem(item);
  };

  // Submit Selesai Cutting & Serahkan ke Jahit
  const handleSubmitSerahJahit = async (e) => {
    e.preventDefault();
    if (!serahJahitModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [serahJahitModalItem.id],
        tglSerahJahit: serahJahitForm.tglSerahJahit,
        timJahit: serahJahitForm.timJahit,
        tarifJahit: Number(serahJahitForm.tarifJahit) || 0,
        catatanJahit: serahJahitForm.catatanJahit
      };

      await api.serahJahit(payload);

      // Update state lokal
      setAntreanList((prev) =>
        prev.map((ant) =>
          ant.id === serahJahitModalItem.id
            ? {
                ...ant,
                status: 'Proses Jahit',
                tglSerahJahit: serahJahitForm.tglSerahJahit,
                timJahit: serahJahitForm.timJahit,
                tarifJahit: Number(serahJahitForm.tarifJahit) || 0,
                totalBiayaJahit: (Number(ant.qty) || 1) * (Number(serahJahitForm.tarifJahit) || 0),
                catatanJahit: serahJahitForm.catatanJahit
              }
            : ant
        )
      );

      Swal.success(
        'Cutting Selesai!',
        `Antrean ${serahJahitModalItem.noAntrian} telah diserahkan ke Divisi Jahit.`
      );
      setSerahJahitModalItem(null);
    } catch (err) {
      Swal.error('Gagal Serahkan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. HEADER BANNER KHUSUS DIVISI CUTTING */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-xl p-4 sm:px-6 shadow-sm border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Divisi Cutting & Pola Kain
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-blue-100 border border-white/25">
                Admin Cutting
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Kelola antrean pemotongan pola bahan, approval permintaan baru, dan serah terima ke penjahit.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            api.getAntrean()
              .then((fresh) => {
                if (Array.isArray(fresh)) setAntreanList(fresh);
                Swal.toast('Data cutting diperbarui');
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
          onClick={() => setActiveTab('approval')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'approval'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Perlu Approval
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.menungguCount}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
            Menunggu Diterima Cutting
          </p>
        </div>

        <div
          onClick={() => setActiveTab('proses')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'proses'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sedang Cutting
            </span>
            <Scissors className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.prosesCount}
          </div>
          <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
            {stats.totalPcsProses.toLocaleString('id-ID')} Pcs Dalam Proses
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
              Selesai Cutting
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.riwayatCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Diserahkan ke Jahit / QC
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tim Pemotong
            </span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {cuttingWorkers.length > 0 ? cuttingWorkers.length : 'Semua'}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Tenaga Kerja Cutting Aktif
          </p>
        </div>
      </div>

      {/* 3. TABS NAVIGASI WORKFLOW & PENCARIAN */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'approval'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Perlu Approval</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'approval' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.menungguCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('proses')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'proses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Sedang Dikerjakan</span>
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
            <span>Riwayat Selesai</span>
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
            placeholder="Cari No Antrian / SKU / Produk..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* 4. TABEL DATA WORKFLOW CUTTING */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-700">NO</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">NO ANTREAN & PO</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-700">PRODUK & SKU</th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">TARGET QTY</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">TIM CUTTING</th>
                <th className="py-2.5 px-3 text-right w-28 border-r border-slate-700">TARIF / ONGKOS</th>
                <th className="py-2.5 px-3 text-center w-32 border-r border-slate-700">STATUS</th>
                <th className="py-2.5 px-3 text-center min-w-[140px]">AKSI DIVISI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Scissors className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">
                      Tidak ada antrean pada tahap ini
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activeTab === 'approval'
                        ? 'Semua permintaan cutting telah disetujui / belum ada permintaan baru.'
                        : 'Belum ada data pengerjaan.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const qtyVal = Number(item.qty) || 0;
                  const tarifVal = Number(item.tarifCutting) || 0;
                  const totalOngkos = Number(item.totalBiayaCutting) || qtyVal * tarifVal;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* NO */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO ANTREAN & PO */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-mono font-bold text-xs text-blue-600">
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
                        {Array.isArray(item.kebutuhanBahan) && item.kebutuhanBahan.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.kebutuhanBahan.slice(0, 3).map((b, bIdx) => (
                              <span key={bIdx} className="text-[9.5px] bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded font-medium">
                                {b.namaBahan}: {b.qtyPerPcs} {b.satuan}/pc
                              </span>
                            ))}
                            {item.kebutuhanBahan.length > 3 && (
                              <span className="text-[9.5px] text-amber-700 font-bold">
                                +{item.kebutuhanBahan.length - 3} lagi
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* TARGET QTY */}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200/60">
                        {qtyVal.toLocaleString('id-ID')} Pcs
                      </td>

                      {/* TIM CUTTING */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <span className="inline-flex items-center gap-1 text-slate-800 font-bold text-xs">
                          <Scissors className="w-3 h-3 text-blue-500" />
                          <span>{item.timCutting || '-'}</span>
                        </span>
                        {item.tglSerahCutting && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Mulai: {item.tglSerahCutting}
                          </div>
                        )}
                      </td>

                      {/* TARIF & TOTAL ONGKOS */}
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
                            item.status === 'Menunggu Cutting'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : item.status === 'Proses Cutting'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* JIKA STATUS MENUNGGU CUTTING -> TOMBOL PROSES CUTTING */}
                          {item.status === 'Menunggu Cutting' && (
                            <button
                              onClick={() => handleOpenApproval(item)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                              title="Mulai Proses Pemotongan Pola Kain"
                            >
                              <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Proses Cutting</span>
                            </button>
                          )}

                          {/* JIKA STATUS SEDANG CUTTING -> TOMBOL SELESAI & SERAH PENJAHIT */}
                          {item.status === 'Proses Cutting' && (
                            <button
                              onClick={() => handleOpenSerahJahit(item)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                              title="Selesaikan Cutting & Serahkan ke Penjahit"
                            >
                              <Shirt className="w-3.5 h-3.5" />
                              <span>Serahkan ke Penjahit</span>
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
            Menampilkan <span className="font-bold text-slate-900">{filteredData.length}</span> antrean cutting
          </div>
          <div className="font-semibold text-slate-700">
            Divisi Cutting • Terhubung Database MySQL
          </div>
        </div>
      </div>

      {/* 5. MODAL APPROVAL / TERIMA ORDER CUTTING */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Mulai Proses Cutting
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {approvalModalItem.noAntrian} • Qty: {approvalModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Produk / SKU
                </label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800">
                  {approvalModalItem.namaProduk} ({approvalModalItem.sku})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Terima Cutting *
                  </label>
                  <input
                    type="date"
                    required
                    value={approvalForm.tglSerahCutting}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, tglSerahCutting: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ongkos Cutting / Pcs (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={approvalForm.tarifCutting}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, tarifCutting: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-emerald-600 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Petugas / Tim Pemotong *
                </label>
                {cuttingWorkers.length > 0 ? (
                  <select
                    value={approvalForm.timCutting}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, timCutting: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-emerald-600"
                  >
                    {cuttingWorkers.map((w) => (
                      <option key={w.id} value={w.nama}>
                        {w.nama} ({w.nik})
                      </option>
                    ))}
                    <option value="Tim Cutting Internal">Tim Cutting Internal</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={approvalForm.timCutting}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, timCutting: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-emerald-600"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Cutting
                </label>
                <textarea
                  rows="2"
                  value={approvalForm.catatanCutting}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, catatanCutting: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                  placeholder="Catatan pengerjaan pola kain..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{loading ? 'Menyimpan...' : 'Mulai Proses Cutting'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SERAHKAN KE DIVISI JAHIT */}
      {serahJahitModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Shirt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Selesaikan Cutting & Serahkan ke Penjahit
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {serahJahitModalItem.noAntrian} • Qty: {serahJahitModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSerahJahitModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSerahJahit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Serah Jahit *
                  </label>
                  <input
                    type="date"
                    required
                    value={serahJahitForm.tglSerahJahit}
                    onChange={(e) =>
                      setSerahJahitForm({ ...serahJahitForm, tglSerahJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ongkos Jahit / Pcs (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serahJahitForm.tarifJahit}
                    onChange={(e) =>
                      setSerahJahitForm({ ...serahJahitForm, tarifJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-purple-600 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Penjahit / Tim Jahit Penerima *
                </label>
                {jahitWorkers.length > 0 ? (
                  <select
                    value={serahJahitForm.timJahit}
                    onChange={(e) =>
                      setSerahJahitForm({ ...serahJahitForm, timJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                  >
                    {jahitWorkers.map((w) => (
                      <option key={w.id} value={w.nama}>
                        {w.nama} ({w.nik}) - {w.kategori}
                      </option>
                    ))}
                    <option value="Tim Jahit Internal">Tim Jahit Internal</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={serahJahitForm.timJahit}
                    onChange={(e) =>
                      setSerahJahitForm({ ...serahJahitForm, timJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                    placeholder="Nama Penjahit..."
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan untuk Penjahit
                </label>
                <textarea
                  rows="2"
                  value={serahJahitForm.catatanJahit}
                  onChange={(e) =>
                    setSerahJahitForm({ ...serahJahitForm, catatanJahit: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSerahJahitModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>{loading ? 'Memproses...' : 'Serahkan ke Penjahit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL DETAIL ITEM */}
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
                <span className="font-black text-blue-600 text-sm">{selectedItemDetail.qty} Pcs</span>
                <span className="text-slate-500 block text-[11px]">Deadline: {selectedItemDetail.deadline || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Tim Cutting</span>
                <span className="font-bold text-slate-800">{selectedItemDetail.timCutting || '-'}</span>
                <span className="text-slate-500 block text-[10.5px]">Tgl Serah: {selectedItemDetail.tglSerahCutting || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Biaya Cutting</span>
                <span className="font-bold text-emerald-700">Rp {Number(selectedItemDetail.totalBiayaCutting || 0).toLocaleString('id-ID')}</span>
                <span className="text-slate-500 block text-[10.5px]">Tarif: Rp {Number(selectedItemDetail.tarifCutting || 0).toLocaleString('id-ID')}/pc</span>
              </div>
            </div>

            {/* Rincian Kebutuhan Bahan Baku dari SPK Gudang */}
            {Array.isArray(selectedItemDetail.kebutuhanBahan) && selectedItemDetail.kebutuhanBahan.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                <span className="text-[10.5px] text-amber-900 block font-black uppercase tracking-wide">
                  📦 Kebutuhan Bahan Baku per Pcs (Target: {selectedItemDetail.qty} Pcs)
                </span>
                <div className="space-y-1 divide-y divide-amber-200/50">
                  {selectedItemDetail.kebutuhanBahan.map((b, bIdx) => {
                    const total = b.totalKebutuhan || Number(((Number(b.qtyPerPcs) || 0) * (Number(selectedItemDetail.qty) || 0)).toFixed(2));
                    return (
                      <div key={bIdx} className="flex justify-between items-center text-xs pt-1">
                        <span className="font-bold text-slate-800">• {b.namaBahan}</span>
                        <span className="font-mono text-slate-700">
                          {b.qtyPerPcs} {b.satuan}/pc → <b className="text-amber-900 font-black">{total} {b.satuan}</b>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedItemDetail.catatan && (
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Catatan Pesanan</span>
                <p className="text-slate-700 italic">{selectedItemDetail.catatan}</p>
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
    </div>
  );
}

