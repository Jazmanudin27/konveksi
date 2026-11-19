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
  Flame,
  Tag,
  Boxes,
  Coins,
  Sparkles,
  X,
  Wallet,
  CalendarDays,
  User
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
    <div className="w-full space-y-2 select-none">
      {/* 1. HEADER BANNER KHUSUS DIVISI CUTTING (COMPACT SLIM PM STYLE PERSIS SPK) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-xl py-2 px-3 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Scissors className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                2. Divisi Cutting & Pola Kain
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10.5px] font-black">
                TAHAP 2 SOP
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-400 text-slate-950 text-[10.5px] font-black uppercase tracking-wider shadow-xs">
                Akses Cutting
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 leading-tight font-medium">
              Kelola antrean pemotongan pola bahan, approval permintaan baru, dan serah terima ke penjahit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/25"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS (4 KARTU BER-BORDER #cbd5e1 PERSIS SPK) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div
          onClick={() => setActiveTab('approval')}
          className={`bg-white border rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between transition-all cursor-pointer ${
            activeTab === 'approval'
              ? 'border-amber-400 ring-2 ring-amber-400/30'
              : 'border-[#cbd5e1] hover:border-amber-400'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Perlu Approval
            </div>
            <div className="text-lg sm:text-xl font-black text-[#0f172a] mt-0.5 leading-none">
              {stats.menungguCount}{' '}
              <span className="text-xs font-semibold text-slate-400">Batch</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('proses')}
          className={`bg-white border rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between transition-all cursor-pointer ${
            activeTab === 'proses'
              ? 'border-[#0284c7] ring-2 ring-[#0284c7]/30'
              : 'border-[#cbd5e1] hover:border-[#0284c7]'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider">
              Sedang Cutting
            </div>
            <div className="text-lg sm:text-xl font-black text-[#0f172a] mt-0.5 leading-none">
              {stats.prosesCount}{' '}
              <span className="text-xs font-semibold text-slate-400">
                ({stats.totalPcsProses.toLocaleString('id-ID')} Pcs)
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('riwayat')}
          className={`bg-white border rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between transition-all cursor-pointer ${
            activeTab === 'riwayat'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : 'border-[#cbd5e1] hover:border-emerald-500'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Selesai Cutting
            </div>
            <div className="text-lg sm:text-xl font-black text-[#0f172a] mt-0.5 leading-none">
              {stats.riwayatCount}{' '}
              <span className="text-xs font-semibold text-slate-400">Diserahkan</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
              Tim Pemotong
            </div>
            <div className="text-lg sm:text-xl font-black text-[#0f172a] mt-0.5 leading-none">
              {cuttingWorkers.length > 0 ? cuttingWorkers.length : 'Semua'}{' '}
              <span className="text-xs font-semibold text-slate-400">Tenaga Aktif</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGASI WORKFLOW & PENCARIAN (PERSIS SPK) */}
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-2 shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            {
              id: 'approval',
              label: 'Perlu Approval',
              icon: ShieldCheck,
              count: stats.menungguCount,
              activeClass: 'bg-amber-500 text-white shadow-xs',
              inactiveClass: 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100',
            },
            {
              id: 'proses',
              label: 'Sedang Dikerjakan',
              icon: Scissors,
              count: stats.prosesCount,
              activeClass: 'bg-[#0284c7] text-white shadow-xs',
              inactiveClass: 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100',
            },
            {
              id: 'riwayat',
              label: 'Riwayat Selesai',
              icon: CheckCircle2,
              count: stats.riwayatCount,
              activeClass: 'bg-emerald-600 text-white shadow-xs',
              inactiveClass: 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isTabActive ? tab.activeClass : tab.inactiveClass
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isTabActive
                      ? 'bg-white/25 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH BOX & FILTERS */}
        <div className="pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No Antrian, No Reff, SKU, Model Produk, Catatan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0284c7] text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 4. TABEL DATA WORKFLOW CUTTING (PERSIS GAYA SPK) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 min-w-[40px] border-r border-[#3b4c5e] text-white font-bold">
                  NO
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px] border-r border-[#3b4c5e] text-white font-bold">
                  NO. ANTREAN & TGL
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  SUMBER & REFF
                </th>
                <th className="py-2.5 px-3 min-w-[240px] border-r border-[#3b4c5e] text-white font-bold">
                  RINCIAN MODEL PRODUK (SKU)
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[120px] border-r border-[#3b4c5e] text-white font-bold">
                  TARGET & PRIORITAS
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  TIM CUTTING
                </th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[120px] border-r border-[#3b4c5e] text-white font-bold">
                  TARIF / ONGKOS
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">
                  STATUS
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[140px] text-white font-bold">
                  AKSI DIVISI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <Scissors className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-slate-600">
                      Tidak ada data antrean pada tahap ini
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
                  const isUrgent = item.prioritas === 'Urgent';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. NO */}
                      <td className="py-2 px-2 text-center text-slate-700 font-bold text-xs sm:text-sm border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* 2. NO. ANTREAN & TGL */}
                      <td className="py-2 px-3 border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-xs sm:text-[13px] text-[#0284c7]">
                            {item.noAntrian}
                          </span>
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{item.tglMasuk || '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. SUMBER & REFF */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col min-w-0">
                          <span
                            className="text-xs sm:text-sm font-bold text-slate-900"
                            title={item.sumberPermintaan}
                          >
                            {item.sumberPermintaan || 'Stok Gudang'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-0.5">
                            <span className="text-slate-500">Reff:</span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-300">
                              {item.noReff || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. RINCIAN MODEL PRODUK (SKU) - PERSIS GAYA SPK */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col min-w-0">
                          {/* SKU & Nama Produk */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-xs text-[#0284c7]">
                              {item.sku}
                            </span>
                            <span
                              className="font-bold text-slate-900 text-xs sm:text-sm truncate"
                              title={item.namaProduk}
                            >
                              {item.namaProduk || "-"}
                            </span>
                          </div>

                          {/* Kategori, Varian, Ukuran, Kain & Rincian Bahan */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 flex-wrap">
                            {item.kategori && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs">
                                {item.kategori}
                              </span>
                            )}
                            {(item.varian || item.ukuran) && (
                              <span className="text-slate-700 font-medium">
                                {item.varian || "Polos"} (
                                {item.ukuran || "All Size"})
                              </span>
                            )}
                            {item.skuBahan && item.skuBahan !== "-" && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-mono text-cyan-800 font-bold text-xs">
                                  Kain: {item.skuBahan}
                                </span>
                              </>
                            )}
                            {Array.isArray(item.kebutuhanBahan) &&
                              item.kebutuhanBahan.length > 0 && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  {item.kebutuhanBahan.map((b, bIdx) => (
                                    <span
                                      key={b.id || b.kodeBahan || bIdx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[10.5px]"
                                    >
                                      <Layers className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>
                                        {b.namaBahan}: {b.qty || b.qtyPerPcs || 1} {b.satuan}
                                      </span>
                                    </span>
                                  ))}
                                </>
                              )}
                          </div>
                        </div>
                      </td>

                      {/* 5. TARGET & PRIORITAS */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-xs sm:text-[13px] text-slate-900">
                            {qtyVal.toLocaleString('id-ID')} Pcs
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isUrgent
                                ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse font-extrabold"
                                : item.prioritas === "Normal"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <span>{item.prioritas || "Normal"}</span>
                          </span>
                        </div>
                      </td>

                      {/* 6. TIM CUTTING */}
                      <td className="py-2 px-3 border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-slate-800 font-bold text-xs">
                            <Scissors className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>{item.timCutting || '-'}</span>
                          </span>
                          {item.tglSerahCutting && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Mulai: {item.tglSerahCutting}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. TARIF & TOTAL ONGKOS */}
                      <td className="py-2 px-3 text-right border-r border-slate-200/60 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          Rp {tarifVal.toLocaleString('id-ID')}/pc
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          Total: Rp {totalOngkos.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* 8. STATUS */}
                      <td className="py-2 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            item.status === 'Menunggu Cutting'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : item.status === 'Proses Cutting'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* 9. AKSI DIVISI */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.status === 'Menunggu Cutting' && (
                            <button
                              onClick={() => handleOpenApproval(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Mulai Proses Pemotongan Pola Kain"
                            >
                              <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Proses Cutting</span>
                            </button>
                          )}

                          {item.status === 'Proses Cutting' && (
                            <button
                              onClick={() => handleOpenSerahJahit(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Selesaikan Cutting & Serahkan ke Penjahit"
                            >
                              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Serah Jahit</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 transition-colors cursor-pointer"
                            title="Lihat Detail SPK"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* BOTTOM SUMMARY FOOTER PERSIS SPK */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header Modal Navy Blue Gradient */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-blue-200 shadow-xs">
                  <Scissors className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                      Mulai Proses Cutting
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-400/30 text-blue-200 border border-blue-300/30 text-[10px] font-black uppercase tracking-wider">
                      Tahap 2 SOP
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100/90 font-mono mt-0.5">
                    {approvalModalItem.noAntrian} • Target: <span className="font-bold text-white">{approvalModalItem.qty} Pcs</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalModalItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Product & SPK Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-blue-600 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Model Produk & SKU
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {approvalModalItem.namaProduk}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-mono font-black text-[11px] border border-blue-200 shrink-0">
                    {approvalModalItem.sku}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70 text-xs text-slate-600 flex-wrap">
                  {(approvalModalItem.varian || approvalModalItem.ukuran) && (
                    <span className="font-semibold text-slate-700">
                      Varian: <b>{approvalModalItem.varian || '-'}</b> ({approvalModalItem.ukuran || 'All Size'})
                    </span>
                  )}
                  {approvalModalItem.deadline && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: <b>{approvalModalItem.deadline}</b></span>
                      </span>
                    </>
                  )}
                  {approvalModalItem.prioritas && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      approvalModalItem.prioritas.toLowerCase() === 'urgent'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {approvalModalItem.prioritas}
                    </span>
                  )}
                </div>

                {/* Chips Bahan Baku SPK */}
                {Array.isArray(approvalModalItem.kebutuhanBahan) && approvalModalItem.kebutuhanBahan.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/70">
                    <div className="text-[10.5px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-blue-600" />
                      <span>Alokasi Bahan Baku SPK:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {approvalModalItem.kebutuhanBahan.map((b, bIdx) => {
                        const total = b.totalKebutuhan || Number(((Number(b.qtyPerPcs) || 0) * (Number(approvalModalItem.qty) || 0)).toFixed(2));
                        return (
                          <span
                            key={bIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px]"
                          >
                            <span>{b.namaBahan}:</span>
                            <b className="text-amber-950 font-black">{total} {b.satuan}</b>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input Dua Kolom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tanggal Mulai Cutting *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={approvalForm.tglSerahCutting}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, tglSerahCutting: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Ongkos Cutting / Pcs (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-black text-slate-400 select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      value={approvalForm.tarifCutting}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, tarifCutting: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-slate-900 text-xs text-right focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Tim / Petugas Cutting */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Petugas / Tim Pemotong *
                </label>
                <div className="relative">
                  {cuttingWorkers.length > 0 ? (
                    <select
                      value={approvalForm.timCutting}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, timCutting: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs bg-white"
                    >
                      {cuttingWorkers.map((w) => (
                        <option key={w.id} value={w.nama}>
                          {w.nama} ({w.nik}) - Divisi Cutting
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
                      placeholder="Masukkan nama tim pemotong..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  )}
                </div>
              </div>

              {/* Catatan Cutting */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Catatan Pengerjaan Pola / Potong
                </label>
                <textarea
                  rows="2"
                  value={approvalForm.catatanCutting}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, catatanCutting: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  placeholder="Catatan pengerjaan pola kain, instruksi khusus pemotongan..."
                />
              </div>

              {/* Footer Modal dengan Total Borongan Live Calculation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 border border-blue-200 w-full sm:w-auto">
                  <Coins className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <span className="text-slate-500 font-medium">Total Ongkos Cutting: </span>
                    <b className="font-mono font-black text-blue-900 text-xs">
                      Rp {(Number(approvalModalItem.qty || 0) * Number(approvalForm.tarifCutting || 0)).toLocaleString('id-ID')}
                    </b>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setApprovalModalItem(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black flex items-center gap-2 shadow-md shadow-blue-500/30 active:scale-95 cursor-pointer transition-all"
                  >
                    <Scissors className="w-4 h-4 stroke-[2.5]" />
                    <span>{loading ? 'Menyimpan...' : 'Mulai Proses Cutting'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SERAHKAN KE DIVISI JAHIT */}
      {serahJahitModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header Modal Purple Gradient */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0f172a] via-[#4c1d95] to-[#7c3aed] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-purple-200 shadow-xs">
                  <Shirt className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                      Selesai Cutting & Serahkan ke Jahit
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-400/30 text-purple-200 border border-purple-300/30 text-[10px] font-black uppercase tracking-wider">
                      Tahap 3 SOP
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-100/90 font-mono mt-0.5">
                    {serahJahitModalItem.noAntrian} • Target: <span className="font-bold text-white">{serahJahitModalItem.qty} Pcs</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSerahJahitModalItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSerahJahit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Product Summary Card */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 border-l-4 border-l-purple-600 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Model Produk & SKU
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {serahJahitModalItem.namaProduk}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 font-mono font-black text-[11px] border border-purple-200 shrink-0">
                    {serahJahitModalItem.sku}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60 text-xs text-slate-600 flex-wrap">
                  <span className="font-semibold text-slate-700">
                    Volume: <b className="text-purple-900">{serahJahitModalItem.qty} Pcs</b>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700">
                    Pemotong: <b>{serahJahitModalItem.timCutting || '-'}</b>
                  </span>
                </div>
              </div>

              {/* Form Input Dua Kolom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Tanggal Serah Jahit *
                  </label>
                  <input
                    type="date"
                    required
                    value={serahJahitForm.tglSerahJahit}
                    onChange={(e) =>
                      setSerahJahitForm({ ...serahJahitForm, tglSerahJahit: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Ongkos Jahit / Pcs (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-black text-slate-400 select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={serahJahitForm.tarifJahit}
                      onChange={(e) =>
                        setSerahJahitForm({ ...serahJahitForm, tarifJahit: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-slate-900 text-xs text-right focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Penjahit / Tim Jahit */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Pilih Penjahit / Tim Jahit Penerima *
                </label>
                {jahitWorkers.length > 0 ? (
                  <select
                    value={serahJahitForm.timJahit}
                    onChange={(e) =>
                      setSerahJahitForm({ ...serahJahitForm, timJahit: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs bg-white"
                  >
                    {jahitWorkers.map((w) => (
                      <option key={w.id} value={w.nama}>
                        {w.nama} ({w.nik}) - {w.kategori || 'Penjahit'}
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
                    placeholder="Nama Penjahit atau Mitra Makloon..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                )}
              </div>

              {/* Catatan Jahit */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Catatan untuk Penjahit
                </label>
                <textarea
                  rows="2"
                  value={serahJahitForm.catatanJahit}
                  onChange={(e) =>
                    setSerahJahitForm({ ...serahJahitForm, catatanJahit: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  placeholder="Misal: Jahit rantai di pundak, pasang label woven..."
                />
              </div>

              {/* Footer Modal dengan Total Borongan Jahit Live */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50 border border-purple-200 w-full sm:w-auto">
                  <Coins className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <span className="text-slate-500 font-medium">Total Ongkos Jahit: </span>
                    <b className="font-mono font-black text-purple-900 text-xs">
                      Rp {(Number(serahJahitModalItem.qty || 0) * Number(serahJahitForm.tarifJahit || 0)).toLocaleString('id-ID')}
                    </b>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setSerahJahitModalItem(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black flex items-center gap-2 shadow-md shadow-purple-500/30 active:scale-95 cursor-pointer transition-all"
                  >
                    <Shirt className="w-4 h-4 stroke-[2.5]" />
                    <span>{loading ? 'Memproses...' : 'Serahkan ke Penjahit'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL DETAIL ITEM */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header Modal Detail */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-200 shadow-xs">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                    Detail SPK Cutting
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                    No Antrean: <span className="font-bold text-white">{selectedItemDetail.noAntrian}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Produk & SKU</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5">{selectedItemDetail.namaProduk}</span>
                  <span className="text-slate-500 block text-[11px] font-mono mt-0.5">{selectedItemDetail.sku}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Volume</span>
                  <span className="font-black text-blue-600 text-base block mt-0.5">{selectedItemDetail.qty} Pcs</span>
                  <span className="text-slate-500 block text-[11px]">Deadline: {selectedItemDetail.deadline || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Tim Cutting</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{selectedItemDetail.timCutting || '-'}</span>
                  <span className="text-slate-500 block text-[10.5px]">Tgl Serah: {selectedItemDetail.tglSerahCutting || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Biaya Borongan Cutting</span>
                  <span className="font-black text-emerald-700 text-sm block mt-0.5">
                    Rp {Number(selectedItemDetail.totalBiayaCutting || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-slate-500 block text-[10.5px]">
                    Tarif: Rp {Number(selectedItemDetail.tarifCutting || 0).toLocaleString('id-ID')}/pc
                  </span>
                </div>
              </div>

              {/* Rincian Kebutuhan Bahan Baku dari SPK Gudang */}
              {Array.isArray(selectedItemDetail.kebutuhanBahan) && selectedItemDetail.kebutuhanBahan.length > 0 && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs uppercase tracking-wide">
                    <Boxes className="w-4 h-4 text-amber-700" />
                    <span>Kebutuhan Bahan Baku (Target: {selectedItemDetail.qty} Pcs)</span>
                  </div>
                  <div className="space-y-1.5 divide-y divide-amber-200/60 text-xs">
                    {selectedItemDetail.kebutuhanBahan.map((b, bIdx) => {
                      const total = b.totalKebutuhan || Number(((Number(b.qtyPerPcs) || 0) * (Number(selectedItemDetail.qty) || 0)).toFixed(2));
                      return (
                        <div key={bIdx} className="flex justify-between items-center pt-1.5">
                          <span className="font-bold text-slate-800">• {b.namaBahan}</span>
                          <span className="font-mono text-slate-700">
                            {b.qtyPerPcs} {b.satuan}/pc → <b className="text-amber-950 font-black bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">{total} {b.satuan}</b>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItemDetail.catatan && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Catatan Pesanan / SPK</span>
                  <p className="text-slate-700 italic">{selectedItemDetail.catatan}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
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

