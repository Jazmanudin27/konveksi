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
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function PembayaranUpahMobile({ onBack }) {
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
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [payForm, setPayForm] = useState({
    tglBayar: new Date().toISOString().slice(0, 10),
    metodeBayar: 'Tunai / Cash',
    catatan: '',
  });

  // Slip Modal State
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipItem, setSlipItem] = useState(null);

  // Fetch data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, rekapData] = await Promise.all([
        api.getPembayaranUpah(),
        api.getPembayaranUpahRekap().catch(() => null),
      ]);
      if (Array.isArray(list)) setDataList(list);
      if (rekapData) setRekap(rekapData);
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
        text: 'Mengambil data upah dari tahapan antrean...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.syncUpahFromAntrean();
      await fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Sinkronisasi Selesai',
        text: res.message || 'Data upah berhasil diperbarui dari antrean!',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal sinkronisasi data', 'error');
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      if (activeTahapTab !== 'Semua' && item.tahapan !== activeTahapTab) return false;
      if (filterStatus === 'Belum Lunas' && item.status_bayar === 'Lunas') return false;
      if (filterStatus === 'Lunas' && item.status_bayar !== 'Lunas') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noAntrian = (item.no_antrian || '').toLowerCase();
        const namaProduk = (item.nama_produk || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const petugas = (item.nama_petugas || '').toLowerCase();
        if (!noAntrian.includes(q) && !namaProduk.includes(q) && !sku.includes(q) && !petugas.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [dataList, activeTahapTab, filterStatus, searchQuery]);

  // Open Bayar Modal
  const handleOpenPay = (item) => {
    setTargetItem(item);
    setPayForm({
      tglBayar: new Date().toISOString().slice(0, 10),
      metodeBayar: 'Tunai / Cash',
      catatan: '',
    });
    setIsPayModalOpen(true);
  };

  // Submit Bayar
  const handleConfirmPay = async () => {
    if (!targetItem) return;
    try {
      await api.bayarUpah([targetItem.id], {
        tgl_bayar: payForm.tglBayar,
        metode_bayar: payForm.metodeBayar,
        catatan: payForm.catatan,
      });

      setIsPayModalOpen(false);
      await fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Berhasil',
        text: `Upah ${targetItem.nama_petugas} sebesar Rp ${Number(targetItem.total_upah).toLocaleString('id-ID')} telah dibayar!`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal memproses pembayaran', 'error');
    }
  };

  // Batalkan Bayar
  const handleBatalBayar = async (item) => {
    const res = await Swal.fire({
      title: 'Batalkan Pembayaran?',
      text: `Status upah untuk ${item.nama_petugas} akan kembali menjadi Belum Lunas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Tutup',
    });

    if (res.isConfirmed) {
      try {
        await api.batalBayarUpah(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Dibatalkan',
          text: 'Status pembayaran telah dibatalkan.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal membatalkan status bayar', 'error');
      }
    }
  };

  // Buka Slip
  const handleOpenSlip = (item) => {
    setSlipItem(item);
    setIsSlipModalOpen(true);
  };

  const getTahapBadge = (tahapan) => {
    switch (tahapan) {
      case 'Cutting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scissors className="w-3 h-3" /> Pemotong
          </span>
        );
      case 'Jahit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shirt className="w-3 h-3" /> Penjahit
          </span>
        );
      case 'QC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3" /> Tim QC
          </span>
        );
      case 'Finishing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <PackageCheck className="w-3 h-3" /> Finishing
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {tahapan}
          </span>
        );
    }
  };

  const tahapTabs = ['Semua', 'Cutting', 'Jahit', 'QC', 'Finishing'];

  return (
    <div className="space-y-3 pb-8">
      {/* 1. KARTU REKAP TOTAL KPI */}
      <div className="grid grid-cols-2 gap-2">
        {/* Belum Lunas */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold">
            <span>Belum Lunas</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-base font-black text-amber-950 mt-1 leading-tight font-mono">
            Rp {(rekap.totalPending || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">
            Menunggu pembayaran
          </div>
        </div>

        {/* Sudah Lunas */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold">
            <span>Sudah Lunas</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-black text-emerald-950 mt-1 leading-tight font-mono">
            Rp {(rekap.totalLunas || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">
            Total tercatat terbayar
          </div>
        </div>
      </div>

      {/* 2. TOMBOL SINKRON DARI ANTREAN */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleSyncFromAntrean}
          disabled={loading}
          className="flex-1 py-2 px-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-transform cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Sinkron dari Antrean Produksi</span>
        </button>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari petugas / no antrean / produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white pl-9 pr-3 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
        />
      </div>

      {/* 4. FILTER TABS TAHAPAN */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {tahapTabs.map((tab) => {
          const isSelected = activeTahapTab === tab;
          const count =
            tab === 'Semua'
              ? dataList.length
              : dataList.filter((d) => d.tahapan === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTahapTab(tab)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 font-bold ${
                isSelected
                  ? 'bg-[#064e3b] text-white shadow-xs font-extrabold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. FILTER STATUS (SEMUA / BELUM LUNAS / LUNAS) */}
      <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl text-[11px] font-bold">
        {['Semua', 'Belum Lunas', 'Lunas'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* 6. LIST ITEM UPAH */}
      <div className="space-y-2.5">
        {filteredList.map((item) => {
          const isLunas = item.status_bayar === 'Lunas';

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 space-y-2.5 transition-all"
            >
              {/* Baris Atas: Tahapan Badge & Status Bayar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getTahapBadge(item.tahapan)}
                  <span className="text-[10.5px] font-mono font-bold text-slate-500">
                    {item.no_antrian}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    isLunas
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isLunas ? 'Lunas' : 'Belum Lunas'}
                </span>
              </div>

              {/* Baris Tengah: Petugas & Produk */}
              <div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-black text-slate-900">
                    {item.nama_petugas || 'Belum ditugaskan'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {item.nama_produk} {item.sku ? `(${item.sku})` : ''}
                </div>
              </div>

              {/* Baris Bawah: Rincian Hitungan Borongan & Aksi */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] text-slate-400">
                    {item.qty} Pcs × Rp {Number(item.tarif_per_pcs).toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm font-black text-[#064e3b] font-mono leading-tight mt-0.5">
                    Rp {Number(item.total_upah).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isLunas ? (
                    <>
                      <button
                        onClick={() => handleOpenSlip(item)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Lihat Slip Upah"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-600" />
                        <span>Slip</span>
                      </button>
                      <button
                        onClick={() => handleBatalBayar(item)}
                        className="p-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Batalkan Status Bayar"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenPay(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-black shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Bayar Upah</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Info Tambahan Jika Lunas */}
              {isLunas && (item.tgl_bayar || item.metode_bayar) && (
                <div className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg flex items-center justify-between">
                  <span>Dibayar: {item.tgl_bayar || '-'}</span>
                  <span>{item.metode_bayar || 'Tunai'}</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200">
            {loading ? 'Memuat data upah...' : 'Tidak ada data pembayaran upah yang sesuai.'}
          </div>
        )}
      </div>

      {/* MODAL 1: PROSES PEMBAYARAN UPAH */}
      {isPayModalOpen && targetItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Bayar Upah Borongan
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Konfirmasi pembayaran tenaga kerja
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rincian Petugas & Tagihan */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Penerima Upah:</span>
                <span className="font-bold text-slate-900">{targetItem.nama_petugas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tahapan:</span>
                <span className="font-bold text-slate-900">{targetItem.tahapan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Antrean:</span>
                <span className="font-mono font-semibold text-slate-700">{targetItem.no_antrian}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volume:</span>
                <span className="font-bold text-slate-800">
                  {targetItem.qty} Pcs × Rp {Number(targetItem.tarif_per_pcs).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Upah:</span>
                <span className="text-base font-black text-[#064e3b] font-mono">
                  Rp {Number(targetItem.total_upah).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Form Input Pembayaran */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tanggal Bayar
                </label>
                <input
                  type="date"
                  value={payForm.tglBayar}
                  onChange={(e) => setPayForm({ ...payForm, tglBayar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={payForm.metodeBayar}
                  onChange={(e) => setPayForm({ ...payForm, metodeBayar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                >
                  <option value="Tunai / Cash">Tunai / Cash</option>
                  <option value="Transfer BCA">Transfer BCA</option>
                  <option value="Transfer Mandiri">Transfer Mandiri</option>
                  <option value="Transfer BRI">Transfer BRI</option>
                  <option value="Transfer BNI">Transfer BNI</option>
                  <option value="Transfer BSI">Transfer BSI</option>
                  <option value="E-Wallet">E-Wallet (GoPay/OVO/ShopeePay)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Cth: Titip mandor, lunas tepat waktu"
                  value={payForm.catatan}
                  onChange={(e) => setPayForm({ ...payForm, catatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#064e3b]"
                />
              </div>
            </div>

            {/* Tombol Konfirmasi */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="flex-1 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] font-black text-white shadow-md active:scale-95 transition-all"
              >
                Simpan & Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SLIP UPAH BORONGAN */}
      {isSlipModalOpen && slipItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  Slip Upah Borongan
                </h3>
              </div>
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Kertas Slip */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-black text-sm text-slate-900 font-sans tracking-wide">
                  RUANG KONVEKSI
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  BUKTI PEMBAYARAN UPAH KERJA
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  No: {slipItem.no_pembayaran || `UPH-${slipItem.id}`}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Petugas:</span>
                  <span className="font-bold text-slate-900">{slipItem.nama_petugas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Divisi / Tahap:</span>
                  <span className="font-bold text-slate-900">{slipItem.tahapan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Antrean:</span>
                  <span className="font-bold text-slate-900">{slipItem.no_antrian}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item Produk:</span>
                  <span className="font-bold text-slate-900 text-right">{slipItem.nama_produk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Qty Selesai:</span>
                  <span className="font-bold text-slate-900">{slipItem.qty} Pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif Satuan:</span>
                  <span className="font-bold text-slate-900">
                    Rp {Number(slipItem.tarif_per_pcs).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between items-center text-xs font-sans">
                <span className="font-black text-slate-800">TOTAL DIBAYAR:</span>
                <span className="text-base font-black text-[#064e3b] font-mono">
                  Rp {Number(slipItem.total_upah).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-200 space-y-0.5">
                <div>Tanggal Bayar: {slipItem.tgl_bayar || '-'}</div>
                <div>Metode Bayar: {slipItem.metode_bayar || 'Tunai'}</div>
                {slipItem.catatan && <div>Catatan: {slipItem.catatan}</div>}
              </div>

              <div className="pt-3 flex justify-between text-center text-[9px] text-slate-400 font-sans">
                <div>
                  <div className="mb-6">Yang Menyerahkan,</div>
                  <div className="font-bold text-slate-700 underline">Admin Produksi</div>
                </div>
                <div>
                  <div className="mb-6">Penerima Upah,</div>
                  <div className="font-bold text-slate-700 underline">{slipItem.nama_petugas}</div>
                </div>
              </div>
            </div>

            {/* Tombol Cetak / Tutup */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] font-black text-white text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

