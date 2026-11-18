import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Eye,
  X,
  Check,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Calendar,
  FileText,
  Boxes,
  TrendingDown,
  TrendingUp,
  ReceiptText,
  Printer
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function MutasiBahan({
  mutasiList = [],
  setMutasiList,
  bahanList = [],
  setBahanList,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'MASUK' | 'KELUAR'

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create'
  const [modalInitialJenis, setModalInitialJenis] = useState('MASUK');
  const [selectedMutasiShow, setSelectedMutasiShow] = useState(null); // Data for Show Modal
  const [deleteMutasi, setDeleteMutasi] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Helper format rupiah
  const formatRupiah = (val) => {
    if (!val && val !== 0) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  // Normalisasi data mutasi (menjamin kompatibilitas format lama dan baru)
  const normalizedList = useMemo(() => {
    return (mutasiList || []).map((m, idx) => {
      const noBukti = m.noBukti || m.noMutasi || `MUT-202611-${(idx + 1).toString().padStart(3, '0')}`;
      const tgl = m.tgl || m.tanggal || '2026-11-12 10:00';
      const noReff = m.noReff || m.noReferensi || '-';
      const rawJenis = m.jenisMutasi || m.tipe || 'MASUK';
      const jenisMutasi = rawJenis.toUpperCase();
      const keterangan = m.keterangan || m.catatan || '-';

      // Items detail
      let items = m.items;
      if (!items || items.length === 0) {
        if (m.kodeBahan || m.kode_bahan) {
          const qty = Number(m.qty || 1);
          const harga = Number(m.harga || 118000);
          items = [
            {
              id: m.id ? m.id * 100 : idx * 100 + 1,
              noBukti,
              kode_bahan: m.kode_bahan || m.kodeBahan,
              nama_bahan: m.nama_bahan || m.namaBahan || 'Kain Konveksi',
              satuan: m.satuan || 'Kg',
              qty,
              harga,
              total: qty * harga,
            },
          ];
        } else {
          items = [];
        }
      }

      return {
        ...m,
        noBukti,
        tgl,
        noReff,
        jenisMutasi,
        keterangan,
        items,
      };
    });
  }, [mutasiList]);

  // KPI Calculations
  const stats = useMemo(() => {
    let countMasuk = 0;
    let countKeluar = 0;
    let totalQtyMasuk = 0;
    let totalQtyKeluar = 0;
    let totalNilaiMasuk = 0;
    let totalNilaiKeluar = 0;

    normalizedList.forEach((m) => {
      const isMasuk = m.jenisMutasi === 'MASUK';
      if (isMasuk) countMasuk += 1;
      else countKeluar += 1;

      (m.items || []).forEach((item) => {
        const q = Number(item.qty || 0);
        const t = Number(item.total || item.qty * item.harga || 0);
        if (isMasuk) {
          totalQtyMasuk += q;
          totalNilaiMasuk += t;
        } else {
          totalQtyKeluar += q;
          totalNilaiKeluar += t;
        }
      });
    });

    return {
      totalTransaksi: normalizedList.length,
      countMasuk,
      countKeluar,
      totalQtyMasuk,
      totalQtyKeluar,
      totalNilaiMasuk,
      totalNilaiKeluar,
    };
  }, [normalizedList]);

  // Filtering Table Index
  const filteredList = useMemo(() => {
    return normalizedList.filter((item) => {
      // Tab filter
      if (activeTab === 'MASUK' && item.jenisMutasi !== 'MASUK') return false;
      if (activeTab === 'KELUAR' && item.jenisMutasi !== 'KELUAR') return false;

      // Dropdown Jenis Mutasi
      if (filterJenis && item.jenisMutasi !== filterJenis) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = item.noBukti?.toLowerCase().includes(q);
        const matchReff = item.noReff?.toLowerCase().includes(q);
        const matchKet = item.keterangan?.toLowerCase().includes(q);
        const matchTgl = item.tgl?.toLowerCase().includes(q);
        // Cek juga kode bahan di rincian items
        const matchBahan = (item.items || []).some(
          (it) =>
            it.kode_bahan?.toLowerCase().includes(q) ||
            it.nama_bahan?.toLowerCase().includes(q)
        );
        if (!matchNo && !matchReff && !matchKet && !matchTgl && !matchBahan) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedList, activeTab, filterJenis, searchTerm]);

  // Open Form Create
  const handleOpenCreate = (jenis = 'MASUK') => {
    setModalInitialJenis(jenis);
    setModalMode('create');
  };

  // Save Mutasi Baru (Header & Multi-Detail Items)
  const handleSaveMutasi = (newRecord) => {
    // 1. Simpan ke mutasiList & API SQLite
    setMutasiList((prev) => [newRecord, ...prev]);
    api.createMutasiBahan(newRecord).catch((e) => console.warn('Gagal simpan mutasi ke API SQLite:', e));

    // 2. Update otomatis stok bahan di Master Bahan
    if (setBahanList && bahanList?.length && newRecord.items?.length) {
      setBahanList((prev) =>
        prev.map((b) => {
          // Cari apakah bahan ini ada di rincian mutasi
          const foundItem = newRecord.items.find(
            (it) => it.kode_bahan === b.kodeBahan
          );
          if (foundItem) {
            const currentStock = Number(b.stok || 0);
            const delta = Number(foundItem.qty || 0);
            const newStock =
              newRecord.jenisMutasi === 'MASUK'
                ? currentStock + delta
                : Math.max(0, currentStock - delta);
            return {
              ...b,
              stok: newStock,
              status: newStock === 0 ? 'Habis' : newStock < 20 ? 'Menipis' : 'Tersedia',
            };
          }
          return b;
        })
      );
    }

    setModalMode(null);
    Swal.success(
      'Mutasi Disimpan!',
      `Bukti ${newRecord.noBukti} (${newRecord.jenisMutasi} ${newRecord.items.length} item) berhasil disimpan ke database.`
    );
  };

  // Handle Delete with SweetAlert & Full Rollback
  const handleDeleteMutasiPrompt = async (target) => {
    const res = await Swal.confirm(
      'Hapus Mutasi Bahan?',
      `Yakin ingin menghapus bukti "${target.noBukti}"? Stok bahan baku terkait akan dikembalikan secara otomatis.`
    );
    if (!res.isConfirmed) return;

    // Rollback stok tiap item di Master Bahan Baku
    if (setBahanList && bahanList?.length && target.items?.length) {
      setBahanList((prev) =>
        prev.map((b) => {
          const foundItem = target.items.find(
            (it) => it.kode_bahan === b.kodeBahan
          );
          if (foundItem) {
            const currentStock = Number(b.stok || 0);
            const delta = Number(foundItem.qty || 0);
            const newStock =
              target.jenisMutasi === 'MASUK'
                ? Math.max(0, currentStock - delta)
                : currentStock + delta;
            return {
              ...b,
              stok: newStock,
              status: newStock === 0 ? 'Habis' : newStock < 20 ? 'Menipis' : 'Tersedia',
            };
          }
          return b;
        })
      );
    }

    // Hapus dari state lokal
    setMutasiList((prev) => {
      const next = (prev || []).filter((m) => m.id !== target.id && m.noBukti !== target.noBukti);
      try {
        localStorage.setItem('konveksi_mutasi_bahan_list', JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    try {
      await api.deleteMutasiBahan(target.id || target.noBukti);
    } catch (e) {
      console.warn('Gagal hapus mutasi dari API SQLite:', e);
    }
    Swal.success('Terhapus!', `Mutasi ${target.noBukti} dihapus & stok kain telah dikembalikan.`);
  };

  // Handle Refresh dari SQLite Database
  const handleRefresh = async () => {
    try {
      const data = await api.getMutasiBahan();
      if (Array.isArray(data)) {
        setMutasiList(data);
        try {
          localStorage.setItem('konveksi_mutasi_bahan_list', JSON.stringify(data));
        } catch (_) {}
      }
      showToast('Data mutasi berhasil dimuat ulang.');
    } catch (_) {
      showToast('Data mutasi siap.');
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0f172a] text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER CARD (COMPACT SLIM PM STYLE) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg py-1.5 px-3 sm:px-3.5 shadow-[0_2px_4px_rgba(2,132,199,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <ArrowLeftRight className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h2 className="text-[13.5px] font-extrabold text-white tracking-tight">
                Mutasi Keluar Masuk Bahan Baku
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[9.5px] font-extrabold">
                HEADER - DETAIL
              </span>
            </div>
            <p className="text-[10.5px] text-white/85 mt-0.5 leading-tight">
              Daftar nomor bukti transaksi mutasi, surat jalan keluar masuk, dan rincian item bahan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer border border-white/20"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenCreate('MASUK')}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Bahan Masuk</span>
          </button>

          <button
            onClick={() => handleOpenCreate('KELUAR')}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>- Bahan Keluar</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total No Bukti
            </div>
            <div className="text-base font-extrabold text-[#0f172a] mt-0.5 leading-none">
              {stats.totalTransaksi} <span className="text-[11px] font-medium text-slate-400">Bukti</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <ReceiptText className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#047857] uppercase tracking-wider">
              Bahan Masuk (In)
            </div>
            <div className="text-base font-extrabold text-[#059669] mt-0.5 leading-none">
              +{stats.totalQtyMasuk} <span className="text-[11px] font-medium text-slate-500">Qty ({stats.countMasuk})</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-[#ecfdf5] text-[#047857] flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-wider">
              Bahan Keluar (Out)
            </div>
            <div className="text-base font-extrabold text-[#ef4444] mt-0.5 leading-none">
              -{stats.totalQtyKeluar} <span className="text-[11px] font-medium text-slate-500">Qty ({stats.countKeluar})</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center shrink-0">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Nilai Masuk
            </div>
            <div className="text-xs font-extrabold text-[#0284c7] mt-1 truncate leading-none">
              {formatRupiah(stats.totalNilaiMasuk)}
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Boxes className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS (PM TAB STYLES) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#0284c7] text-white border border-[#0284c7] shadow-[0_1px_4px_rgba(2,132,199,0.25)]'
              : 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] hover:bg-blue-100/60'
          }`}
        >
          <ReceiptText className="w-3 h-3" />
          <span>Semua Mutasi ({mutasiList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MASUK')}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === 'MASUK'
              ? 'bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]'
              : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60'
          }`}
        >
          <ArrowDownLeft className="w-3 h-3" />
          <span>Bahan Masuk ({stats.countMasuk})</span>
        </button>

        <button
          onClick={() => setActiveTab('KELUAR')}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === 'KELUAR'
              ? 'bg-[#ef4444] text-white border border-[#ef4444] shadow-[0_1px_4px_rgba(239,68,68,0.25)]'
              : 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] hover:bg-red-100/60'
          }`}
        >
          <ArrowUpRight className="w-3 h-3" />
          <span>Bahan Keluar ({stats.countKeluar})</span>
        </button>
      </div>

      {/* 4. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center gap-1.5">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No Bukti, No Reff, Keterangan, Kode Bahan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] focus:bg-white text-[#0f172a] transition-all"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full px-2.5 py-1 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Jenis Mutasi</option>
            <option value="MASUK">Bahan Masuk</option>
            <option value="KELUAR">Bahan Keluar</option>
          </select>
        </div>
      </div>

      {/* 5. TABEL INDEX MUTASI */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 min-w-[36px] border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">NO BUKTI</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[100px] border-r border-[#3b4c5e] text-white font-bold">TGL</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">NO REFF</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">JENIS MUTASI</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-[#3b4c5e] text-white font-bold">KETERANGAN</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[80px] text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Tidak ada data mutasi bahan baku</p>
                    <p className="text-[11px] text-slate-400">Klik "+ Bahan Masuk" atau "- Bahan Keluar" untuk mencatat bukti transaksi baru</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isMasuk = item.jenisMutasi === 'MASUK';
                  const totalItem = (item.items || []).length;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* NO */}
                      <td className="py-2 px-1 text-center text-slate-700 font-bold text-xs border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO BUKTI */}
                      <td className="py-2 px-2.5 border-r border-slate-200/60">
                        <span className="font-mono font-bold text-xs text-[#0284c7] whitespace-nowrap">
                          {item.noBukti}
                        </span>
                      </td>

                      {/* TGL */}
                      <td className="py-2 px-2.5 text-slate-700 text-xs border-r border-slate-200/60">
                        <div className="flex items-center gap-1 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                            {item.tgl}
                          </span>
                        </div>
                      </td>

                      {/* NO REFF */}
                      <td className="py-2 px-2.5 border-r border-slate-200/60">
                        <span
                          className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 inline-block truncate max-w-full"
                          title={item.noReff}
                        >
                          {item.noReff || '-'}
                        </span>
                      </td>

                      {/* JENIS MUTASI */}
                      <td className="py-2 px-2 text-center border-r border-slate-200/60">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                            isMasuk
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {isMasuk ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 shrink-0" />
                              <span>MASUK</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                              <span>KELUAR</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* KETERANGAN (AUTO FIT DENGAN TRUNCATE, ZERO SCROLL) */}
                      <td className="py-2 px-3 text-slate-700 text-xs border-r border-slate-200/60 overflow-hidden">
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <span
                            className="truncate text-slate-800 text-xs leading-tight block"
                            title={item.keterangan}
                          >
                            {item.keterangan || '-'}
                          </span>
                          <span className="shrink-0 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold">
                            {totalItem} Item
                          </span>
                        </div>
                      </td>

                      {/* AKSI: HANYA IKON (SHOW & HAPUS) */}
                      <td className="py-2 px-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedMutasiShow(item)}
                            className="w-7 h-7 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Tampilkan Rincian Detail Bahan"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteMutasiPrompt(item)}
                            className="w-7 h-7 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Hapus Bukti Mutasi"
                          >
                            <Trash2 className="w-3 h-3" />
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

        {/* FOOTER TABEL */}
        <div className="px-3.5 py-2.5 bg-[#f8fafc] border-t border-[#cbd5e1] text-[11.5px] text-[#64748b] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Menampilkan <span className="font-bold text-[#0f172a]">{filteredList.length}</span> bukti transaksi mutasi
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-[#059669]">
              Total Masuk: +{stats.totalQtyMasuk}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[#ef4444]">
              Total Keluar: -{stats.totalQtyKeluar}
            </span>
          </div>
        </div>
      </div>

      {/* 6. MODAL SHOW: RINCIAN DETAIL BAHAN (nobukti, kode_bahan, qty, harga, total) */}
      {selectedMutasiShow && (
        <ModalShowRincian
          mutasi={selectedMutasiShow}
          onClose={() => setSelectedMutasiShow(null)}
          formatRupiah={formatRupiah}
        />
      )}

      {/* 7. MODAL FORM TAMBAH MUTASI (HEADER & MULTI DETAIL) */}
      {modalMode === 'create' && (
        <FormModalMutasiMulti
          isOpen={true}
          initialJenis={modalInitialJenis}
          bahanList={bahanList}
          onClose={() => setModalMode(null)}
          onSave={handleSaveMutasi}
          formatRupiah={formatRupiah}
        />
      )}

      {/* 8. MODAL KONFIRMASI HAPUS */}
      {deleteMutasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Hapus Bukti Mutasi?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus nomor bukti{' '}
              <span className="font-bold text-slate-800">{deleteMutasi.noBukti}</span>?
              <br />
              Stok kain untuk semua rincian item akan otomatis dikembalikan (rollback).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteMutasi(null)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteMutasi.id)}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// SUB-KOMPONEN: MODAL SHOW RINCIAN BAHAN (FULL SCREEN VIEW)
// Menampilkan persis tabel rincian: nobukti, kode_bahan, qty, harga, total
// ==========================================================================
function ModalShowRincian({ mutasi, onClose, formatRupiah }) {
  if (!mutasi) return null;
  const isMasuk = mutasi.jenisMutasi === 'MASUK';

  // Hitung total akumulasi rincian
  const subtotalNilai = (mutasi.items || []).reduce(
    (acc, it) => acc + Number(it.total || it.qty * it.harga || 0),
    0
  );
  const totalQty = (mutasi.items || []).reduce(
    (acc, it) => acc + Number(it.qty || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
            title="Kembali ke Daftar Mutasi"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-white" />
            <h3 className="font-extrabold text-sm tracking-tight text-white">
              Rincian Detail Mutasi Bahan Baku
            </h3>
            <span className="font-mono font-bold text-xs bg-white/20 px-2 py-0.5 rounded border border-white/25 text-white">
              {mutasi.noBukti}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
          title="Tutup Halaman Penuh"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BODY CONTAINER FULL SCREEN (SCROLLABLE CONTENT) */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-2.5 flex flex-col min-h-0">
        {/* INFO HEADER CARD */}
        <div className="bg-white border border-[#cbd5e1] rounded-lg p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] shrink-0 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">No Bukti</div>
              <div className="font-mono font-bold text-xs text-[#0284c7] mt-0.5 bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe] inline-block">
                {mutasi.noBukti}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tanggal</div>
              <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{mutasi.tgl}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">No Reff</div>
              <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                {mutasi.noReff || '-'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jenis Mutasi</div>
              <span
                className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10.5px] font-extrabold border ${
                  isMasuk
                    ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]'
                    : 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]'
                }`}
              >
                {isMasuk ? (
                  <>
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>+ BAHAN MASUK</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-3 h-3" />
                    <span>- BAHAN KELUAR</span>
                  </>
                )}
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Item</div>
              <div className="font-bold text-xs text-slate-800 mt-0.5">
                {(mutasi.items || []).length} Jenis Kain
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Grand Total Nilai</div>
              <div className="font-mono font-extrabold text-xs text-[#059669] mt-0.5">
                {formatRupiah(subtotalNilai)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Keterangan:</span>
            <span className="text-slate-700 font-medium">
              {mutasi.keterangan || 'Tidak ada catatan tambahan.'}
            </span>
          </div>
        </div>

        {/* TABEL RINCIAN DETAIL: nobukti, kode_bahan, qty, harga, total (ESTETIK, NATURAL WRAP) */}
        <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-[0_2px_6px_rgba(15,23,42,0.05)] overflow-hidden">
          <div className="px-3.5 py-2 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Tabel Rincian Bahan Masuk / Keluar
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
              {(mutasi.items || []).length} Baris Rincian
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] font-extrabold text-[11px] tracking-wider uppercase border-b border-[#cbd5e1]">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-[#cbd5e1]">NO</th>
                  <th className="py-2.5 px-3 w-40 border-r border-[#cbd5e1]">NO BUKTI</th>
                  <th className="py-2.5 px-3 w-44 border-r border-[#cbd5e1]">KODE_BAHAN</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-[#cbd5e1]">NAMA BAHAN</th>
                  <th className="py-2.5 px-3 text-right w-32 border-r border-[#cbd5e1]">QTY</th>
                  <th className="py-2.5 px-3 text-right w-40 border-r border-[#cbd5e1]">HARGA (RP)</th>
                  <th className="py-2.5 px-3 text-right w-44">TOTAL (RP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-700">
                {(mutasi.items || []).map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-[#f1f5f9] transition-colors">
                    {/* NO */}
                    <td className="py-2 px-3 text-center text-slate-400 font-semibold text-[11px] border-r border-[#cbd5e1]">
                      {idx + 1}
                    </td>

                    {/* nobukti */}
                    <td className="py-2 px-3 font-mono text-xs text-slate-700 font-semibold border-r border-[#cbd5e1]">
                      {it.noBukti || mutasi.noBukti}
                    </td>

                    {/* kode_bahan */}
                    <td className="py-2 px-3 border-r border-[#cbd5e1]">
                      <span className="font-mono font-bold text-xs text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                        {it.kode_bahan}
                      </span>
                    </td>

                    {/* nama bahan */}
                    <td className="py-2 px-3 font-bold text-[#0f172a] text-xs border-r border-[#cbd5e1]">
                      {it.nama_bahan || '-'}
                    </td>

                    {/* qty */}
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-xs border-r border-[#cbd5e1]">
                      <span className={isMasuk ? 'text-[#059669]' : 'text-[#dc2626]'}>
                        {isMasuk ? `+${it.qty}` : `-${it.qty}`} {it.satuan || ''}
                      </span>
                    </td>

                    {/* harga */}
                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 border-r border-[#cbd5e1]">
                      {formatRupiah(it.harga)}
                    </td>

                    {/* total */}
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-xs text-[#059669]">
                      {formatRupiah(it.total || it.qty * it.harga)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR (GRAND TOTAL DI LUAR TABEL) */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Transaksi: <span className="font-mono font-bold text-slate-800">{mutasi.noBukti}</span> ({(mutasi.items || []).length} Kain)
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-slate-700">
            Total Kuantitas: <strong className={isMasuk ? 'text-[#059669]' : 'text-[#dc2626]'}>{isMasuk ? `+${totalQty}` : `-${totalQty}`} Qty</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Grand Total Akumulasi:
            </span>
            <span className="font-mono font-extrabold text-sm text-[#059669] bg-emerald-50 px-3 py-1 rounded border border-emerald-200 shadow-xs">
              {formatRupiah(subtotalNilai)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Mutasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// SUB-KOMPONEN: MODAL FORM TAMBAH MUTASI (HEADER & MULTI DETAIL)
// ==========================================================================
function FormModalMutasiMulti({
  isOpen,
  initialJenis,
  bahanList = [],
  onClose,
  onSave,
  formatRupiah,
}) {
  const [jenisMutasi, setJenisMutasi] = useState(initialJenis || 'MASUK');
  const [noReff, setNoReff] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tgl, setTgl] = useState(new Date().toISOString().slice(0, 16));

  // No Bukti Preview
  const [noBukti] = useState(() => {
    const now = new Date();
    const rand = Math.floor(100 + Math.random() * 900);
    return `MUT-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${rand}`;
  });

  // Items Rincian List
  const defaultBahan = bahanList[0];
  const [items, setItems] = useState([
    {
      id: 1,
      kode_bahan: defaultBahan?.kodeBahan || '',
      nama_bahan: defaultBahan?.namaBahan || '',
      satuan: defaultBahan?.satuan || 'Kg',
      qty: 1,
      harga: defaultBahan?.harga || 0,
      total: (defaultBahan?.harga || 0) * 1,
    },
  ]);

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Handle Ubah Bahan di Baris Item
  const handleItemBahanChange = (index, kode) => {
    const target = bahanList.find((b) => b.kodeBahan === kode);
    if (!target) return;

    setItems((prev) => {
      const copy = [...prev];
      const currentQty = copy[index].qty || 1;
      const harga = target.harga || 0;
      copy[index] = {
        ...copy[index],
        kode_bahan: target.kodeBahan,
        nama_bahan: target.namaBahan,
        satuan: target.satuan,
        harga: harga,
        total: currentQty * harga,
      };
      return copy;
    });
  };

  // Handle Ubah Qty di Baris Item
  const handleItemQtyChange = (index, newQty) => {
    setItems((prev) => {
      const copy = [...prev];
      const q = Math.max(0, Number(newQty));
      copy[index] = {
        ...copy[index],
        qty: q,
        total: q * (copy[index].harga || 0),
      };
      return copy;
    });
  };

  // Handle Ubah Harga di Baris Item
  const handleItemHargaChange = (index, newHarga) => {
    setItems((prev) => {
      const copy = [...prev];
      const h = Math.max(0, Number(newHarga));
      copy[index] = {
        ...copy[index],
        harga: h,
        total: (copy[index].qty || 0) * h,
      };
      return copy;
    });
  };

  // Tambah Baris Bahan
  const handleAddRow = () => {
    const nextBahan = bahanList[items.length % bahanList.length] || bahanList[0];
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        kode_bahan: nextBahan?.kodeBahan || '',
        nama_bahan: nextBahan?.namaBahan || '',
        satuan: nextBahan?.satuan || 'Kg',
        qty: 1,
        harga: nextBahan?.harga || 0,
        total: nextBahan?.harga || 0,
      },
    ]);
  };

  // Hapus Baris Bahan
  const handleRemoveRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!noReff.trim()) errs.noReff = 'No referensi / PO / SPK wajib diisi';
    if (!keterangan.trim()) errs.keterangan = 'Keterangan mutasi wajib diisi';

    if (items.length === 0) errs.items = 'Minimal harus ada 1 item bahan';
    const hasZeroQty = items.some((it) => !it.qty || it.qty <= 0);
    if (hasZeroQty) errs.items = 'Qty semua item harus lebih besar dari 0';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      id: Date.now(),
      noBukti,
      tgl: tgl.replace('T', ' '),
      noReff: noReff.trim().toUpperCase(),
      jenisMutasi,
      keterangan: keterangan.trim(),
      items: items.map((it) => ({
        ...it,
        noBukti,
        qty: Number(it.qty),
        harga: Number(it.harga),
        total: Number(it.qty) * Number(it.harga),
      })),
    });
  };

  // Hitung total nilai keseluruhan
  const grandTotal = items.reduce((acc, it) => acc + (it.total || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div
          className={`p-4 text-white flex items-center justify-between shrink-0 ${
            jenisMutasi === 'MASUK'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : 'bg-gradient-to-r from-rose-600 to-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {jenisMutasi === 'MASUK' ? (
              <ArrowDownLeft className="w-5 h-5 text-white" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-white" />
            )}
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Input Mutasi Bahan Baku {jenisMutasi === 'MASUK' ? '(Bahan Masuk)' : '(Bahan Keluar)'}
              </h3>
              <p className="text-[11px] text-white/80">
                No Bukti: <span className="font-mono font-bold text-white">{noBukti}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* HEADER SECTION */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              Informasi Header Mutasi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Mutasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setJenisMutasi('MASUK')}
                    className={`py-1.5 rounded text-xs font-bold border cursor-pointer transition-all ${
                      jenisMutasi === 'MASUK'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenisMutasi('KELUAR')}
                    className={`py-1.5 rounded text-xs font-bold border cursor-pointer transition-all ${
                      jenisMutasi === 'KELUAR'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    Keluar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={tgl}
                  onChange={(e) => setTgl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No Reff (PO / SPK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={noReff}
                  onChange={(e) => setNoReff(e.target.value.toUpperCase())}
                  placeholder="Contoh: PO-KAPAS-881 / SPK-2026-005"
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded focus:outline-none ${
                    errors.noReff
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-300 focus:border-[#0284c7]'
                  }`}
                />
                {errors.noReff && (
                  <p className="text-[10px] text-rose-500 mt-0.5 font-semibold">{errors.noReff}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Penerimaan bahan combed dari supplier Toko Kain Mulia"
                className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded focus:outline-none ${
                  errors.keterangan
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-[#0284c7]'
                }`}
              />
              {errors.keterangan && (
                <p className="text-[10px] text-rose-500 mt-0.5 font-semibold">{errors.keterangan}</p>
              )}
            </div>
          </div>

          {/* DETAIL ITEMS SECTION: nobukti, kode_bahan, qty, harga, total */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rincian Item Bahan
                </span>
                <span className="ml-2 text-[11px] text-slate-500">
                  (nobukti, kode_bahan, qty, harga, total)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            {errors.items && (
              <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded border border-rose-200">
                {errors.items}
              </p>
            )}

            <div className="border border-[#cbd5e1] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#475569] font-extrabold text-[11px] tracking-wider uppercase border-b border-[#cbd5e1]">
                    <th className="py-2 px-2 text-center w-8 border-r border-[#cbd5e1]">NO</th>
                    <th className="py-2 px-2.5 min-w-[200px] border-r border-[#cbd5e1]">KODE_BAHAN</th>
                    <th className="py-2 px-2.5 w-24 border-r border-[#cbd5e1]">QTY</th>
                    <th className="py-2 px-2.5 w-32 border-r border-[#cbd5e1]">HARGA (RP)</th>
                    <th className="py-2 px-2.5 w-32 border-r border-[#cbd5e1] text-right">TOTAL (RP)</th>
                    <th className="py-2 px-1 text-center w-10">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1]">
                  {items.map((row, index) => (
                    <tr key={row.id || index} className="bg-white">
                      <td className="py-1.5 px-2 text-center text-slate-400 font-bold text-[11px] border-r border-[#cbd5e1]">
                        {index + 1}
                      </td>

                      {/* kode_bahan */}
                      <td className="py-1.5 px-2 border-r border-[#cbd5e1]">
                        <select
                          value={row.kode_bahan}
                          onChange={(e) => handleItemBahanChange(index, e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-[#0284c7] font-semibold text-slate-800"
                        >
                          {bahanList.map((b) => (
                            <option key={b.kodeBahan} value={b.kodeBahan}>
                              {b.kodeBahan} — {b.namaBahan} ({b.satuan})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* qty */}
                      <td className="py-1.5 px-2 border-r border-[#cbd5e1]">
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.qty}
                            onChange={(e) => handleItemQtyChange(index, e.target.value)}
                            className="w-full px-2 py-1 pr-7 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-[#0284c7]"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                            {row.satuan}
                          </span>
                        </div>
                      </td>

                      {/* harga */}
                      <td className="py-1.5 px-2 border-r border-[#cbd5e1]">
                        <input
                          type="number"
                          min="0"
                          value={row.harga}
                          onChange={(e) => handleItemHargaChange(index, e.target.value)}
                          className="w-full px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-[#0284c7] text-right"
                        />
                      </td>

                      {/* total */}
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-xs text-[#059669] border-r border-[#cbd5e1]">
                        {formatRupiah(row.total)}
                      </td>

                      {/* hapus row */}
                      <td className="py-1.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          disabled={items.length <= 1}
                          className="w-6 h-6 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer mx-auto"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f8fafc] font-bold text-xs border-t border-[#cbd5e1]">
                    <td colSpan="4" className="py-2 px-3 text-right text-slate-600 uppercase border-r border-[#cbd5e1]">
                      Grand Total Nilai
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-extrabold text-[#059669] border-r border-[#cbd5e1]">
                      {formatRupiah(grandTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer Form Action */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                jenisMutasi === 'MASUK'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Bukti Mutasi ({items.length} Item)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
