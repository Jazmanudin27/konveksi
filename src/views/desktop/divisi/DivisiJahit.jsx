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
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { api } from '../../../services/api';
import { Swal } from '../../../utils/swal';

export default function DivisiJahit({ antreanList = [], setAntreanList, products = [], employees = [] }) {
  const [activeTab, setActiveTab] = useState('proses'); // 'approval' | 'proses' | 'riwayat'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Modal Approval (Terima & Tugaskan Penjahit)
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    tglSerahJahit: new Date().toISOString().slice(0, 10),
    timJahit: '',
    tarifJahit: 3500,
    catatanJahit: ''
  });

  // Modal Selesaikan Jahit & Serahkan ke QC
  const [serahQcModalItem, setSerahQcModalItem] = useState(null);
  const [serahQcForm, setSerahQcForm] = useState({
    tglSerahQc: new Date().toISOString().slice(0, 10),
    timQc: 'Tim QC (Pemeriksaan)',
    tarifQc: 500,
    catatanQc: 'Jahitan selesai, siap inspeksi kualitas.'
  });

  // Filter daftar penjahit dari master karyawan
  const jahitWorkers = useMemo(() => {
    return employees.filter(
      (e) =>
        e.status === 'Aktif' &&
        (String(e.bagian || '').toLowerCase().includes('jahit') ||
          String(e.bagian || '').toLowerCase().includes('sew') ||
          String(e.kategori || '').toLowerCase().includes('borongan'))
    );
  }, [employees]);

  // Filter Data Khusus Divisi Jahit
  const jahitData = useMemo(() => {
    return antreanList.filter((item) => {
      const isReturQc =
        item.status === 'Proses Jahit' &&
        (Number(item.qtyRejectQc) > 0 || String(item.statusQc || '').includes('Reject') || String(item.statusQc || '').includes('Perbaikan'));

      if (activeTab === 'retur') {
        return isReturQc;
      }
      if (activeTab === 'approval') {
        // Antrean yang diserahkan dari cutting dan perlu konfirmasi penjahit
        return item.status === 'Menunggu Jahit' || (item.status === 'Proses Jahit' && !item.timJahit);
      }
      if (activeTab === 'proses') {
        return item.status === 'Proses Jahit';
      }
      if (activeTab === 'riwayat') {
        return (
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
    if (!searchTerm.trim()) return jahitData;
    const q = searchTerm.toLowerCase();
    return jahitData.filter(
      (item) =>
        (item.noAntrian || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.namaProduk || '').toLowerCase().includes(q) ||
        (item.timJahit || '').toLowerCase().includes(q) ||
        (item.noReff || '').toLowerCase().includes(q)
    );
  }, [jahitData, searchTerm]);

  // Statistik KPI Divisi Jahit
  const stats = useMemo(() => {
    const proses = antreanList.filter((i) => i.status === 'Proses Jahit');
    const retur = antreanList.filter(
      (i) =>
        i.status === 'Proses Jahit' &&
        (Number(i.qtyRejectQc) > 0 || String(i.statusQc || '').includes('Reject') || String(i.statusQc || '').includes('Perbaikan'))
    );
    const riwayat = antreanList.filter((i) =>
      ['Proses QC', 'Proses Finishing', 'Selesai'].includes(i.status)
    );
    const totalPcsJahit = proses.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

    return {
      prosesCount: proses.length,
      returCount: retur.length,
      riwayatCount: riwayat.length,
      totalPcsJahit
    };
  }, [antreanList]);

  // Buka Modal Approval Terima / Atur Penjahit
  const handleOpenApproval = (item) => {
    setApprovalForm({
      tglSerahJahit: item.tglSerahJahit || new Date().toISOString().slice(0, 10),
      timJahit: item.timJahit || (jahitWorkers.length > 0 ? jahitWorkers[0].nama : 'Tim Jahit 1'),
      tarifJahit: Number(item.tarifJahit) || 3500,
      catatanJahit: item.catatanJahit || 'Jahit rapih sesuai standar sample'
    });
    setApprovalModalItem(item);
  };

  // Submit Approval Terima Order Jahit
  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!approvalModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [approvalModalItem.id],
        tglSerahJahit: approvalForm.tglSerahJahit,
        timJahit: approvalForm.timJahit,
        tarifJahit: Number(approvalForm.tarifJahit) || 0,
        catatanJahit: approvalForm.catatanJahit
      };

      await api.serahJahit(payload);

      // Update state lokal
      setAntreanList((prev) =>
        prev.map((ant) =>
          ant.id === approvalModalItem.id
            ? {
                ...ant,
                status: 'Proses Jahit',
                tglSerahJahit: approvalForm.tglSerahJahit,
                timJahit: approvalForm.timJahit,
                tarifJahit: Number(approvalForm.tarifJahit) || 0,
                totalBiayaJahit: (Number(ant.qty) || 1) * (Number(approvalForm.tarifJahit) || 0),
                catatanJahit: approvalForm.catatanJahit
              }
            : ant
        )
      );

      Swal.success(
        'Penjahit Ditugaskan!',
        `Antrean ${approvalModalItem.noAntrian} berhasil dialokasikan ke ${approvalForm.timJahit}.`
      );
      setApprovalModalItem(null);
      setActiveTab('proses');
    } catch (err) {
      Swal.error('Gagal Simpan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Serah ke QC
  const handleOpenSerahQc = (item) => {
    setSerahQcForm({
      tglSerahQc: new Date().toISOString().slice(0, 10),
      timQc: 'Tim QC (Pemeriksaan)',
      tarifQc: 500,
      catatanQc: 'Jahitan selesai lengkap, siap diinspeksi QC.'
    });
    setSerahQcModalItem(item);
  };

  // Submit Selesai Jahit & Serahkan ke QC
  const handleSubmitSerahQc = async (e) => {
    e.preventDefault();
    if (!serahQcModalItem) return;

    try {
      setLoading(true);
      const payload = {
        ids: [serahQcModalItem.id],
        tglSerahQc: serahQcForm.tglSerahQc,
        timQc: serahQcForm.timQc,
        tarifQc: Number(serahQcForm.tarifQc) || 500,
        catatanQc: serahQcForm.catatanQc,
        statusQc: 'Pemeriksaan'
      };

      await api.serahQc(payload);

      // Update state lokal
      setAntreanList((prev) =>
        prev.map((ant) =>
          ant.id === serahQcModalItem.id
            ? {
                ...ant,
                status: 'Proses QC',
                statusQc: 'Pemeriksaan',
                tglSerahQc: serahQcForm.tglSerahQc,
                timQc: serahQcForm.timQc,
                tarifQc: Number(serahQcForm.tarifQc) || 500,
                totalBiayaQc: (Number(ant.qty) || 1) * (Number(serahQcForm.tarifQc) || 500),
                catatanQc: serahQcForm.catatanQc
              }
            : ant
        )
      );

      Swal.success(
        'Jahit Selesai!',
        `Antrean ${serahQcModalItem.noAntrian} telah diserahkan ke Divisi QC untuk inspeksi.`
      );
      setSerahQcModalItem(null);
    } catch (err) {
      Swal.error('Gagal Serahkan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. HEADER BANNER KHUSUS DIVISI JAHIT */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 text-white rounded-xl p-4 sm:px-6 shadow-sm border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <Shirt className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Divisi Jahit (Sewing)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-purple-100 border border-white/25">
                Admin Jahit
              </span>
            </div>
            <p className="text-xs text-purple-100/90 mt-0.5">
              Kelola antrean menjahit pakaian, alokasi penjahit borongan/tetap, perbaikan retur QC, dan serah terima ke QC.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            api.getAntrean()
              .then((fresh) => {
                if (Array.isArray(fresh)) setAntreanList(fresh);
                Swal.toast('Data jahit diperbarui');
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
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sedang Dijahit
            </span>
            <Shirt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.prosesCount}
          </div>
          <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
            {stats.totalPcsJahit.toLocaleString('id-ID')} Pcs Dikerjakan
          </p>
        </div>

        <div
          onClick={() => setActiveTab('retur')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'retur'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Retur Revisi QC
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.returCount}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
            Perlu Perbaikan Jahit
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
              Selesai Jahit
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {stats.riwayatCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Diserahkan ke QC / Finishing
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Penjahit Terdaftar
            </span>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {jahitWorkers.length}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Tenaga Jahit Aktif
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
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Sedang Jahit</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'proses' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.prosesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('retur')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'retur'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Perbaikan Retur QC</span>
            {stats.returCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-rose-700">
                {stats.returCount}
              </span>
            )}
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
            placeholder="Cari No Antrian / SKU / Penjahit..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* 4. TABEL DATA WORKFLOW JAHIT */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-700">NO</th>
                <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-700">NO ANTREAN & PO</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-700">PRODUK & SKU</th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-700">TARGET QTY</th>
                <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-700">NAMA PENJAHIT</th>
                <th className="py-2.5 px-3 text-right w-28 border-r border-slate-700">TARIF JAHIT</th>
                <th className="py-2.5 px-3 text-center w-32 border-r border-slate-700">STATUS</th>
                <th className="py-2.5 px-3 text-center min-w-[150px]">AKSI DIVISI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Shirt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-600">
                      Tidak ada antrean jahit pada filter ini
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Semua order jahit telah selesai atau belum ada pekerjaan masuk dari cutting.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const qtyVal = Number(item.qty) || 0;
                  const tarifVal = Number(item.tarifJahit) || 0;
                  const totalOngkos = Number(item.totalBiayaJahit) || qtyVal * tarifVal;
                  const isReturQc =
                    Number(item.qtyRejectQc) > 0 ||
                    String(item.statusQc || '').includes('Reject') ||
                    String(item.statusQc || '').includes('Perbaikan');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isReturQc ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* NO */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO ANTREAN & PO */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-mono font-bold text-xs text-purple-600">
                          {item.noAntrian}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-normal">
                          {item.noReff || 'Internal'} • {item.tglMasuk || '-'}
                        </div>
                        {isReturQc && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                            <RotateCcw className="w-2.5 h-2.5 stroke-[3]" />
                            <span>RETUR QC ({item.qtyRejectQc || item.qty} Pcs)</span>
                          </span>
                        )}
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

                      {/* NAMA PENJAHIT */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{item.timJahit || '- Belum Ditugaskan -'}</span>
                        </div>
                        {item.tglSerahJahit && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            Mulai: {item.tglSerahJahit}
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
                            isReturQc
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : item.status === 'Proses Jahit'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* ATUR / UBAH PENJAHIT */}
                          {item.status === 'Proses Jahit' && (
                            <>
                              <button
                                onClick={() => handleOpenApproval(item)}
                                className="w-7.5 h-7.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                                title="Atur / Tugaskan Penjahit"
                              >
                                <UserCheck className="w-4 h-4 text-white stroke-[2.2]" />
                              </button>

                              <button
                                onClick={() => handleOpenSerahQc(item)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                                title="Selesaikan Jahitan & Serahkan ke Divisi QC"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>Serah ke QC</span>
                              </button>
                            </>
                          )}

                          {/* DETAIL BUTTON */}
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="w-7.5 h-7.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                            title="Lihat Rincian Antrean"
                          >
                            <Eye className="w-4 h-4 text-white stroke-[2.2]" />
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
            Menampilkan <span className="font-bold text-slate-900">{filteredData.length}</span> antrean jahit
          </div>
          <div className="font-semibold text-slate-700">
            Divisi Jahit • Terhubung Database MySQL
          </div>
        </div>
      </div>

      {/* 5. MODAL ATUR PENJAHIT */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Tugaskan Penjahit (Sewing)
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
                  Produk / Model
                </label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-800">
                  {approvalModalItem.namaProduk} ({approvalModalItem.sku})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Penjahit *
                </label>
                {jahitWorkers.length > 0 ? (
                  <select
                    value={approvalForm.timJahit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, timJahit: e.target.value })
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
                    value={approvalForm.timJahit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, timJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                    placeholder="Nama Penjahit..."
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Mulai Jahit *
                  </label>
                  <input
                    type="date"
                    required
                    value={approvalForm.tglSerahJahit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, tglSerahJahit: e.target.value })
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
                    value={approvalForm.tarifJahit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, tarifJahit: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-purple-600 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Jahit
                </label>
                <textarea
                  rows="2"
                  value={approvalForm.catatanJahit}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, catatanJahit: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600"
                  placeholder="Instruksi jahitan..."
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
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Alokasi Penjahit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SERAHKAN KE DIVISI QC */}
      {serahQcModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Selesaikan Jahit & Serahkan ke QC
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-mono">
                    {serahQcModalItem.noAntrian} • Qty: {serahQcModalItem.qty} Pcs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSerahQcModalItem(null)}
                className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSerahQc} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Serah QC *
                  </label>
                  <input
                    type="date"
                    required
                    value={serahQcForm.tglSerahQc}
                    onChange={(e) =>
                      setSerahQcForm({ ...serahQcForm, tglSerahQc: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ongkos QC / Pcs (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serahQcForm.tarifQc}
                    onChange={(e) =>
                      setSerahQcForm({ ...serahQcForm, tarifQc: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-teal-600 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tim Pemeriksa QC *
                </label>
                <input
                  type="text"
                  required
                  value={serahQcForm.timQc}
                  onChange={(e) =>
                    setSerahQcForm({ ...serahQcForm, timQc: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan untuk Divisi QC
                </label>
                <textarea
                  rows="2"
                  value={serahQcForm.catatanQc}
                  onChange={(e) =>
                    setSerahQcForm({ ...serahQcForm, catatanQc: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSerahQcModalItem(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{loading ? 'Memproses...' : 'Serahkan ke QC'}</span>
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
                <span className="font-black text-purple-600 text-sm">{selectedItemDetail.qty} Pcs</span>
                <span className="text-slate-500 block text-[11px]">Deadline: {selectedItemDetail.deadline || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Penjahit</span>
                <span className="font-bold text-slate-800">{selectedItemDetail.timJahit || '-'}</span>
                <span className="text-slate-500 block text-[10.5px]">Tgl Serah: {selectedItemDetail.tglSerahJahit || '-'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Ongkos Jahit</span>
                <span className="font-bold text-emerald-700">Rp {Number(selectedItemDetail.totalBiayaJahit || 0).toLocaleString('id-ID')}</span>
                <span className="text-slate-500 block text-[10.5px]">Tarif: Rp {Number(selectedItemDetail.tarifJahit || 0).toLocaleString('id-ID')}/pc</span>
              </div>
            </div>

            {selectedItemDetail.catatanJahit && (
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Catatan Pengerjaan Jahit</span>
                <p className="text-slate-700 italic">{selectedItemDetail.catatanJahit}</p>
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

