import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  Scissors,
  Shirt,
  ShieldCheck,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  User,
  Check,
  X,
  CreditCard,
  Banknote,
  Receipt,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  Eye,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function PembayaranUpah({ employees = [], antreanList = [] }) {
  const [dataList, setDataList] = useState([]);
  const [rekap, setRekap] = useState({
    totalTagihan: 0,
    totalLunas: 0,
    totalPending: 0,
    totalPcs: 0,
    perTahapan: {},
  });
  const [loading, setLoading] = useState(false);

  // Filter State
  const [activeTahapTab, setActiveTahapTab] = useState('Semua'); // 'Semua' | 'Cutting' | 'Jahit' | 'QC' | 'Finishing'
  const [filterStatus, setFilterStatus] = useState('Semua'); // 'Semua' | 'Belum Lunas' | 'Lunas'
  const [filterPetugas, setFilterPetugas] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Modal State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetPayItems, setTargetPayItems] = useState([]);
  const [payForm, setPayForm] = useState({
    tglBayar: new Date().toISOString().slice(0, 10),
    metodeBayar: 'Tunai / Cash',
    catatan: '',
  });

  // Slip Modal State
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipItem, setSlipItem] = useState(null);

  // Fetch Data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, rekapData] = await Promise.all([
        api.getPembayaranUpah(),
        api.getPembayaranUpahRekap().catch(() => null),
      ]);

      if (Array.isArray(list)) {
        setDataList(list);
      }
      if (rekapData) {
        setRekap(rekapData);
      }
    } catch (err) {
      console.warn('Gagal memuat pembayaran upah:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync dari Antrean Produksi
  const handleSyncFromAntrean = async () => {
    try {
      Swal.fire({
        title: 'Menyinkronkan...',
        text: 'Mengambil data upah dari seluruh tahapan antrean produksi...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.syncUpahFromAntrean();
      await fetchData();

      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Selesai!',
        text: res.message || 'Data tagihan upah berhasil diperbarui dari antrean.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Sinkronisasi',
        text: err.message || 'Terjadi kesalahan sistem saat sinkronisasi.',
      });
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      if (activeTahapTab !== 'Semua' && item.tahapan !== activeTahapTab) return false;
      if (filterStatus !== 'Semua' && item.statusBayar !== filterStatus) return false;
      if (
        filterPetugas &&
        !item.namaPetugas?.toLowerCase().includes(filterPetugas.toLowerCase())
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = item.noPembayaran?.toLowerCase().includes(q);
        const matchAnt = item.noAntrian?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchProd = item.namaProduk?.toLowerCase().includes(q);
        const matchPet = item.namaPetugas?.toLowerCase().includes(q);
        if (!matchNo && !matchAnt && !matchSku && !matchProd && !matchPet) return false;
      }
      return true;
    });
  }, [dataList, activeTahapTab, filterStatus, filterPetugas, searchQuery]);

  // Handle Multi-Select
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredList.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Pay Modal (Single / Batch)
  const handleOpenPay = (items) => {
    if (!items || items.length === 0) return;
    setTargetPayItems(items);
    setPayForm({
      tglBayar: new Date().toISOString().slice(0, 10),
      metodeBayar: 'Tunai / Cash',
      catatan: '',
    });
    setIsPayModalOpen(true);
  };

  // Submit Pay
  const handleConfirmPay = async (e) => {
    e.preventDefault();
    if (!targetPayItems || targetPayItems.length === 0) return;

    try {
      const ids = targetPayItems.map((i) => i.id);
      await api.bayarUpah({
        ids,
        tglBayar: payForm.tglBayar,
        metodeBayar: payForm.metodeBayar,
        catatan: payForm.catatan,
      });

      setIsPayModalOpen(false);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await fetchData();

      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Berhasil Dicatat!',
        text: `${ids.length} tagihan upah telah ditandai Lunas.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses Pembayaran',
        text: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  // Batal Bayar (Rollback to Belum Lunas)
  const handleBatalBayar = async (item) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Batalkan Pembayaran?',
      text: `Kembalikan tagihan ${item.noPembayaran} (${item.namaPetugas} - Rp ${Number(item.totalUpah).toLocaleString('id-ID')}) ke status "Belum Lunas"?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan Lunas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
    });

    if (res.isConfirmed) {
      try {
        await api.batalBayarUpah(item.id);
        await fetchData();

        Swal.fire({
          icon: 'success',
          title: 'Status Dibatalkan',
          text: 'Tagihan upah dikembalikan ke status Belum Lunas.',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Membatalkan',
          text: err.message || 'Terjadi kesalahan sistem.',
        });
      }
    }
  };

  // Open Slip Modal
  const handleOpenSlip = (item) => {
    setSlipItem(item);
    setIsSlipModalOpen(true);
  };

  // Print Slip
  const handlePrintSlip = () => {
    window.print();
  };

  // Helper Badge Tahapan
  const getTahapanBadge = (tahap) => {
    switch (tahap) {
      case 'Cutting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scissors className="w-3.5 h-3.5" />
            <span>Pemotong (Cutting)</span>
          </span>
        );
      case 'Jahit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shirt className="w-3.5 h-3.5" />
            <span>Penjahit (Sewing)</span>
          </span>
        );
      case 'QC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quality Control (QC)</span>
          </span>
        );
      case 'Finishing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Finishing & Packing</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {tahap}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-3 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#054338] to-[#04362d] text-white rounded-2xl py-3 px-4 sm:px-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 text-white shadow-inner border border-white/20">
            <Coins className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Pembayaran Upah Produksi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-black border border-emerald-400/30">
                PAYROLL BORONGAN
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1 leading-tight font-medium">
              Manajemen & pencatatan pembayaran upah kerja tim Pemotong, Penjahit, QC, dan Finishing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Tombol Sinkronisasi dari Antrean */}
          <button
            onClick={handleSyncFromAntrean}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/25 active:scale-95"
            title="Tarik & sinkronkan data penyerahan tahap antrean menjadi tagihan upah"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync dari Antrean</span>
          </button>

          {/* Tombol Bayar Terpilih (Batch Action) */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                const selectedItems = dataList.filter((i) => selectedIds.includes(i.id));
                handleOpenPay(selectedItems);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 animate-in zoom-in-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar Terpilih ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. REKAP KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Tagihan Upah */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Tagihan</span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            Rp {Number(rekap.totalTagihan || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            {rekap.totalPcs || 0} Pcs dikerjakan
          </span>
        </div>

        {/* Sudah Dibayar (Lunas) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-200/90 shadow-2xs bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Sudah Dibayar (Lunas)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-800 mt-1 font-mono">
            Rp {Number(rekap.totalLunas || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
            Terverifikasi Lunas
          </span>
        </div>

        {/* Sisa Belum Dibayar (Pending) */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-rose-200/90 shadow-2xs bg-gradient-to-b from-rose-50/40 to-white">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Belum Dibayar (Sisa)</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-800 mt-1 font-mono">
            Rp {Number(rekap.totalPending || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-rose-700 font-bold mt-0.5 block">
            Tagihan Menunggu Bayar
          </span>
        </div>

        {/* Total Transaksi Upah */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Transaksi</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            {dataList.length} <span className="text-xs font-semibold text-slate-500">Record</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            Dari seluruh tahapan SOP
          </span>
        </div>
      </div>

      {/* 3. TABS FILTER TAHAPAN & KONTROL PENCARIAN */}
      <div className="space-y-2">
        {/* Horizontal Tabs Tahapan */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {[
            { key: 'Semua', label: 'Semua Tahapan', count: dataList.length },
            {
              key: 'Cutting',
              label: 'Pemotong (Cutting)',
              count: dataList.filter((i) => i.tahapan === 'Cutting').length,
            },
            {
              key: 'Jahit',
              label: 'Penjahit (Sewing)',
              count: dataList.filter((i) => i.tahapan === 'Jahit').length,
            },
            {
              key: 'QC',
              label: 'Tim QC',
              count: dataList.filter((i) => i.tahapan === 'QC').length,
            },
            {
              key: 'Finishing',
              label: 'Finishing & Packing',
              count: dataList.filter((i) => i.tahapan === 'Finishing').length,
            },
          ].map((tab) => {
            const isSelected = activeTahapTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTahapTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-[#064e3b] text-white font-extrabold shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Bar: Search, Status Filter, Petugas Filter */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari no bayar / antrean / SKU / nama produk / nama petugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Filter Status Bayar */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="Semua">Semua Status Bayar</option>
              <option value="Belum Lunas">🔴 Belum Lunas (Pending)</option>
              <option value="Lunas">🟢 Lunas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABEL PEMBAYARAN UPAH */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-extrabold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-9 min-w-[36px] border border-slate-200">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer w-4 h-4"
                    title="Pilih Semua Tagihan"
                  />
                </th>
                <th className="py-2.5 px-2 text-center w-10 min-w-[40px] border border-slate-200">NO</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px] border border-slate-200">NO. BAYAR & TANGGAL</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px] border border-slate-200">ANTREAN & PRODUK</th>
                <th className="py-2.5 px-3 min-w-[200px] border border-slate-200">BAGIAN & PETUGAS</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[120px] border border-slate-200">QTY & TARIF</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[130px] border border-slate-200">TOTAL UPAH</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[140px] border border-slate-200">STATUS BAYAR</th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[140px] border border-slate-200">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-700 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 border border-slate-200">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-600">Tidak ada data tagihan upah</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik "Sync dari Antrean" untuk memuat tagihan upah dari order yang sudah diserahkan
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isLunas = item.statusBayar === 'Lunas';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-2 text-center border border-slate-200">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer w-4 h-4"
                        />
                      </td>

                      {/* No */}
                      <td className="py-2 px-2 text-center text-slate-500 font-bold text-xs sm:text-sm border border-slate-200">
                        {idx + 1}
                      </td>

                      {/* No. Bayar & Tanggal Buat */}
                      <td className="py-2 px-3 border border-slate-200 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-xs text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-fit">
                            {item.noPembayaran}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {item.createdAt ? String(item.createdAt).slice(0, 10) : '-'}
                          </span>
                        </div>
                      </td>

                      {/* No. Antrean & Model Produk */}
                      <td className="py-2 px-3 border border-slate-200">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-xs text-blue-700">
                            {item.noAntrian}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.namaProduk}>
                            {item.namaProduk}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            SKU: {item.sku}
                          </span>
                        </div>
                      </td>

                      {/* Bagian & Petugas */}
                      <td className="py-2 px-3 border border-slate-200">
                        <div className="flex flex-col gap-1 items-start">
                          {getTahapanBadge(item.tahapan)}
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.namaPetugas}</span>
                          </div>
                        </div>
                      </td>

                      {/* Qty & Tarif */}
                      <td className="py-2 px-3 text-center border border-slate-200 whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                            {Number(item.qty).toLocaleString('id-ID')} Pcs
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            @ Rp {Number(item.tarifPerPcs).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </td>

                      {/* Total Upah */}
                      <td className="py-2 px-3 text-right border border-slate-200 whitespace-nowrap">
                        <span className="font-mono font-black text-xs sm:text-sm text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 inline-block">
                          Rp {Number(item.totalUpah).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Status Bayar */}
                      <td className="py-2 px-3 text-center border border-slate-200 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {isLunas ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Lunas</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-rose-500" />
                              <span>Belum Lunas</span>
                            </span>
                          )}

                          {isLunas && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              <span>{item.tglBayar}</span>
                              {item.metodeBayar && (
                                <span className="block text-slate-400">({item.metodeBayar})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-2 px-2.5 text-center border border-slate-200 whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* Tombol Bayar Sekarang (jika Belum Lunas) */}
                          {!isLunas ? (
                            <button
                              onClick={() => handleOpenPay([item])}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Bayar tagihan upah ini"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                          ) : (
                            /* Tombol Batalkan Lunas (Undo) */
                            <button
                              onClick={() => handleBatalBayar(item)}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Batalkan status lunas (Undo jika salah klik bayar)"
                            >
                              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Tombol Lihat Slip */}
                          <button
                            onClick={() => handleOpenSlip(item)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Tampilkan & Cetak Slip Upah"
                          >
                            <Receipt className="w-4 h-4 text-slate-600" />
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
        <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-600 gap-2">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredList.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{dataList.length}</span> data upah
          </div>
          <div className="flex items-center gap-4 font-semibold text-slate-700">
            <span>
              Total Qty: <strong className="text-slate-900">{filteredList.reduce((acc, c) => acc + (Number(c.qty) || 0), 0).toLocaleString('id-ID')} Pcs</strong>
            </span>
            <span>
              Total Upah: <strong className="text-emerald-700 font-bold">Rp {filteredList.reduce((acc, c) => acc + (Number(c.totalUpah) || 0), 0).toLocaleString('id-ID')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM PEMBAYARAN UPAH */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#064e3b] to-[#04362d] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <CreditCard className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Konfirmasi Pembayaran Upah</h3>
                  <p className="text-[10.5px] text-emerald-200/90">
                    {targetPayItems.length === 1
                      ? `Bayar upah ke: ${targetPayItems[0].namaPetugas}`
                      : `Bayar sekaligus ${targetPayItems.length} transaksi upah`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirmPay} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Ringkasan Total yang Harus Dibayar */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                    TOTAL NOMINAL DIBAYAR
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {targetPayItems.length} Tagihan • {targetPayItems.reduce((acc, c) => acc + (Number(c.qty) || 0), 0)} Pcs
                  </span>
                </div>
                <div className="font-mono font-black text-lg text-emerald-800">
                  Rp{' '}
                  {targetPayItems
                    .reduce((acc, c) => acc + (Number(c.totalUpah) || 0), 0)
                    .toLocaleString('id-ID')}
                </div>
              </div>

              {/* Tanggal Bayar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  required
                  value={payForm.tglBayar}
                  onChange={(e) => setPayForm((p) => ({ ...p, tglBayar: e.target.value }))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={payForm.metodeBayar}
                  onChange={(e) => setPayForm((p) => ({ ...p, metodeBayar: e.target.value }))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="Tunai / Cash">💵 Tunai / Cash Langsung</option>
                  <option value="Transfer Bank BCA">🏦 Transfer Bank BCA</option>
                  <option value="Transfer Bank BRI">🏦 Transfer Bank BRI</option>
                  <option value="Transfer Bank Mandiri">🏦 Transfer Bank Mandiri</option>
                  <option value="E-Wallet / DANA / OVO / GoPay">📱 E-Wallet (DANA / OVO / GoPay)</option>
                </select>
              </div>

              {/* Catatan / No Reff Transfer */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Bukti Ref (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Sudah ditransfer via BCA, titip via mandor, dll..."
                  value={payForm.catatan}
                  onChange={(e) => setPayForm((p) => ({ ...p, catatan: e.target.value }))}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Konfirmasi Lunas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SLIP GAJI / PEMBAYARAN UPAH BORONGAN (PRINTABLE) */}
      {isSlipModalOpen && slipItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between shrink-0 shadow-md print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Slip Pembayaran Upah Borongan</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setIsSlipModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slip Paper View (Formal Slip Design) */}
            <div className="p-6 overflow-y-auto space-y-4 bg-white text-slate-800 font-sans" id="printable-slip">
              {/* Slip Kop */}
              <div className="text-center pb-3 border-b-2 border-slate-800 space-y-0.5">
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  RUANG KONVEKSI
                </h2>
                <p className="text-xs text-slate-600 font-semibold">
                  Sistem Manajemen Operasional & Payroll Produksi
                </p>
                <div className="inline-block mt-1 font-mono text-[11px] font-black bg-slate-100 text-slate-800 px-3 py-0.5 rounded-full border border-slate-300">
                  SLIP PEMBAYARAN UPAH KERJA
                </div>
              </div>

              {/* Meta Informasi Slip */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">No. Bukti Upah:</span>
                  <span className="font-mono font-black text-slate-900">{slipItem.noPembayaran}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tanggal Cetak:</span>
                  <span className="font-mono text-slate-700 font-bold">{new Date().toISOString().slice(0, 10)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Penerima Upah:</span>
                  <span className="font-black text-slate-900 text-sm">{slipItem.namaPetugas}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Bagian / Tahap:</span>
                  <span className="font-bold text-emerald-800">{slipItem.tahapan}</span>
                </div>
              </div>

              {/* Tabel Rincian Upah */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">Rincian Pekerjaan & No. Antrean</th>
                      <th className="p-2.5 text-center">Volume</th>
                      <th className="p-2.5 text-right">Tarif / Pcs</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{slipItem.namaProduk}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {slipItem.noAntrian} • SKU: {slipItem.sku}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        {slipItem.qty} Pcs
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        Rp {Number(slipItem.tarifPerPcs).toLocaleString('id-ID')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        Rp {Number(slipItem.totalUpah).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-300 font-black">
                    <tr>
                      <td colSpan="3" className="p-2.5 text-right uppercase text-slate-600">
                        Total Upah Bersih:
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">
                        Rp {Number(slipItem.totalUpah).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Status Pembayaran & Catatan */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Status Pembayaran:</span>
                  <span className={`font-black ${slipItem.statusBayar === 'Lunas' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {slipItem.statusBayar === 'Lunas' ? '✅ LUNAS (Sudah Dibayarkan)' : '⏳ PENDING (Belum Lunas)'}
                  </span>
                </div>
                {slipItem.tglBayar && (
                  <div className="text-right">
                    <span className="text-slate-500 font-semibold block">Tgl & Metode:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {slipItem.tglBayar} ({slipItem.metodeBayar || 'Tunai'})
                    </span>
                  </div>
                )}
              </div>

              {/* Kolom Tanda Tangan */}
              <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
                <div>
                  <p className="text-slate-500">Diserahkan oleh (Admin/Kasir):</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                    ( Admin Produksi )
                  </div>
                </div>
                <div>
                  <p className="text-slate-500">Diterima oleh Petugas:</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                    ( {slipItem.namaPetugas} )
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

