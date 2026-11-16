import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  User,
  Calendar,
  History,
  Trash2,
  Edit3,
  X,
  RefreshCw,
  Coins,
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  ArrowDownRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function KasbonMobile({ onBack }) {
  const [kasbonList, setKasbonList] = useState([]);
  const [rekap, setRekap] = useState({
    totalKasbon: 0,
    totalTerbayar: 0,
    totalSisa: 0,
    countBelumLunas: 0,
    countLunas: 0,
    jumlahPeminjamAktif: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filter State
  const [activeTab, setActiveTab] = useState('Belum Lunas'); // 'Belum Lunas' | 'Lunas' | 'Semua'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Create/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    namaPetugas: '',
    kategoriPetugas: 'Penjahit',
    tglKasbon: new Date().toISOString().slice(0, 10),
    nominal: '',
    keperluan: '',
  });

  // Modal Riwayat Potongan State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedKasbon, setSelectedKasbon] = useState(null);
  const [riwayatList, setRiwayatList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Suggestions & List Penjahit
  const [penjahitList, setPenjahitList] = useState([]);
  const [petugasSuggestions, setPetugasSuggestions] = useState([]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, rekapData, penjahit, employees] = await Promise.all([
        api.getKasbon(),
        api.getKasbonRekap().catch(() => null),
        api.getPenjahit().catch(() => []),
        api.getEmployees().catch(() => []),
      ]);

      if (Array.isArray(list)) setKasbonList(list);
      if (rekapData) setRekap(rekapData);
      if (Array.isArray(penjahit)) setPenjahitList(penjahit);

      const names = new Set();
      if (Array.isArray(penjahit)) {
        penjahit.forEach((p) => p.nama && names.add(p.nama));
      }
      if (Array.isArray(employees)) {
        employees.forEach((e) => e.nama && names.add(e.nama));
      }
      setPetugasSuggestions(Array.from(names));
    } catch (err) {
      console.warn('Gagal memuat data kasbon:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return kasbonList.filter((item) => {
      if (activeTab === 'Belum Lunas' && item.status !== 'Belum Lunas') return false;
      if (activeTab === 'Lunas' && item.status !== 'Lunas') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = item.noKasbon?.toLowerCase().includes(q);
        const matchNama = item.namaPetugas?.toLowerCase().includes(q);
        const matchKat = item.kategoriPetugas?.toLowerCase().includes(q);
        const matchKep = item.keperluan?.toLowerCase().includes(q);
        if (!matchNo && !matchNama && !matchKat && !matchKep) return false;
      }
      return true;
    });
  }, [kasbonList, activeTab, searchQuery]);

  // Helper Format Rupiah Input
  const formatRupiahDisplay = (val) => {
    if (!val && val !== 0) return '';
    const clean = String(val).replace(/\D/g, '');
    return clean ? Number(clean).toLocaleString('id-ID') : '';
  };

  // Helper Terbilang Ringkas
  const getTerbilang = (number) => {
    const nom = Number(String(number).replace(/\D/g, ''));
    if (!nom || nom <= 0) return '';
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    const toWords = (n) => {
      if (n < 12) return satuan[n];
      if (n < 20) return toWords(n - 10) + ' Belas';
      if (n < 100) return toWords(Math.floor(n / 10)) + ' Puluh ' + toWords(n % 10);
      if (n < 200) return 'Seratus ' + toWords(n - 100);
      if (n < 1000) return toWords(Math.floor(n / 100)) + ' Ratus ' + toWords(n % 100);
      if (n < 2000) return 'Seribu ' + toWords(n - 1000);
      if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' Ribu ' + toWords(n % 1000);
      if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' Juta ' + toWords(n % 1000000);
      return '';
    };
    return toWords(nom).trim().replace(/\s+/g, ' ') + ' Rupiah';
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      namaPetugas: '',
      kategoriPetugas: 'Penjahit',
      tglKasbon: new Date().toISOString().slice(0, 10),
      nominal: '',
      keperluan: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      namaPetugas: item.namaPetugas,
      kategoriPetugas: item.kategoriPetugas || 'Penjahit',
      tglKasbon: item.tglKasbon ? String(item.tglKasbon).slice(0, 10) : new Date().toISOString().slice(0, 10),
      nominal: item.nominal,
      keperluan: item.keperluan || '',
    });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.namaPetugas.trim()) {
      Swal.fire('Perhatian', 'Pilih nama penjahit terlebih dahulu.', 'warning');
      return;
    }
    const cleanNominal = Number(String(formData.nominal).replace(/\D/g, ''));
    if (!cleanNominal || cleanNominal <= 0) {
      Swal.fire('Perhatian', 'Nominal kasbon harus lebih besar dari 0.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await api.updateKasbon(editingId, {
          namaPetugas: formData.namaPetugas.trim(),
          kategoriPetugas: 'Penjahit',
          tglKasbon: formData.tglKasbon,
          nominal: cleanNominal,
          keperluan: formData.keperluan.trim(),
        });
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: 'Data kasbon telah berhasil diupdate.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.createKasbon({
          namaPetugas: formData.namaPetugas.trim(),
          kategoriPetugas: 'Penjahit',
          tglKasbon: formData.tglKasbon,
          nominal: cleanNominal,
          keperluan: formData.keperluan.trim(),
        });
        Swal.fire({
          icon: 'success',
          title: 'Kasbon Dicatat',
          text: `Kasbon sebesar Rp ${cleanNominal.toLocaleString('id-ID')} untuk ${formData.namaPetugas} berhasil dicatat!`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  // Delete Kasbon
  const handleDelete = async (item) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Kasbon?',
      text: `Hapus catatan kasbon ${item.noKasbon} (${item.namaPetugas} - Rp ${Number(item.nominal).toLocaleString('id-ID')})?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    });

    if (res.isConfirmed) {
      try {
        await api.deleteKasbon(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Terhapus',
          text: 'Data kasbon telah dihapus.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Gagal Hapus', err.message || 'Terjadi kesalahan.', 'error');
      }
    }
  };

  // View Riwayat
  const handleOpenHistory = async (item) => {
    setSelectedKasbon(item);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const data = await api.getKasbonRiwayat(item.id);
      setRiwayatList(data?.riwayat || []);
    } catch (err) {
      console.warn('Gagal memuat riwayat kasbon:', err);
      setRiwayatList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* 1. HEADER MOBILE BAR */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>Kasbon Karyawan</span>
            </h1>
            <p className="text-[10.5px] text-slate-500 font-medium">
              Pinjaman & auto-potong saat gajian
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchData}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center active:scale-95"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="h-8 px-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Kasbon</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* 2. REKAP SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-2">
          {/* Card Sisa Belum Lunas */}
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-3 text-white shadow-sm col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-amber-100 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                Sisa Kasbon Belum Lunas
              </span>
              <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {rekap.countBelumLunas} Data Aktif
              </span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight mt-1">
              Rp {Number(rekap.totalSisa).toLocaleString('id-ID')}
            </div>
            <div className="text-[10.5px] text-amber-100/90 mt-1 flex items-center justify-between">
              <span>{rekap.jumlahPeminjamAktif} Orang Peminjam</span>
              <span>Total: Rp {Number(rekap.totalKasbon).toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Card Terbayar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Sudah Terbayar
            </span>
            <div className="text-base font-black font-mono text-emerald-800 mt-0.5">
              Rp {Number(rekap.totalTerbayar).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Card Lunas */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Status Lunas
            </span>
            <div className="text-base font-black font-mono text-slate-800 mt-0.5">
              {rekap.countLunas} Kasbon
            </div>
          </div>
        </div>

        {/* 3. SEARCH & FILTER TABS */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama karyawan, no kasbon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-slate-800 shadow-2xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 text-xs font-bold">
            {['Belum Lunas', 'Lunas', 'Semua'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
                {tab === 'Belum Lunas' && ` (${rekap.countBelumLunas})`}
              </button>
            ))}
          </div>
        </div>

        {/* 4. LIST KASBON CARDS */}
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-amber-600" />
            <p className="text-xs font-bold">Memuat data kasbon...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <h4 className="font-bold text-slate-700 text-xs">Belum Ada Data Kasbon</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery ? 'Tidak ada hasil yang cocok dengan pencarian.' : 'Klik tombol "+ Kasbon" untuk mencatat pinjaman baru.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredList.map((item) => {
              const isLunas = item.status === 'Lunas';
              const persenBayar = Number(item.nominal) > 0
                ? Math.min(100, Math.round((Number(item.terbayar) / Number(item.nominal)) * 100))
                : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5 transition-all"
                >
                  {/* Row 1: Header (No Kasbon & Status) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {item.noKasbon}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.tglKasbon ? String(item.tglKasbon).slice(0, 10) : '-'}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        isLunas
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isLunas ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                      <span>{item.status}</span>
                    </span>
                  </div>

                  {/* Row 2: Nama Karyawan & Bagian */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-black text-sm text-slate-900">
                          {item.namaPetugas}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.kategoriPetugas || 'Karyawan'}
                      </span>
                    </div>
                    {item.keperluan && (
                      <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                        "{item.keperluan}"
                      </p>
                    )}
                  </div>

                  {/* Row 3: Progress & Nominal Breakdown */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Pinjaman Pokok:</span>
                      <span className="font-mono font-bold text-slate-800">
                        Rp {Number(item.nominal).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Sudah Terpotong:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        Rp {Number(item.terbayar).toLocaleString('id-ID')} ({persenBayar}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isLunas ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${persenBayar}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/80 font-bold">
                      <span className="text-slate-700 text-xs">Sisa Belum Lunas:</span>
                      <span className="font-mono font-black text-sm text-amber-700">
                        Rp {Number(item.sisa).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Action Buttons */}
                  <div className="pt-1 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleOpenHistory(item)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Riwayat Potong</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Kasbon"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Kasbon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL FORM CREATE / EDIT KASBON (RESPONSIF MOBILE TIDAK TERPOTONG) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Modal Fixed */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {editingId ? 'Edit Catatan Kasbon' : 'Catat Kasbon Penjahit'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Otomatis potong saat pembayaran upah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form Scrollable */}
            <form onSubmit={handleSave} className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
              {/* Pilih Penjahit via Select Option */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Penjahit (Penerima Kasbon) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.namaPetugas}
                  onChange={(e) => setFormData({ ...formData, namaPetugas: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Nama Penjahit --</option>
                  {penjahitList.length > 0 ? (
                    penjahitList.map((p) => (
                      <option key={p.id || p.nama} value={p.nama}>
                        🧵 {p.nama} {p.tarifPerPcs ? `(Tarif: Rp ${Number(p.tarifPerPcs).toLocaleString('id-ID')})` : ''}
                      </option>
                    ))
                  ) : (
                    petugasSuggestions.map((name, i) => (
                      <option key={i} value={name}>
                        🧵 {name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Bagian / Kategori */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bagian / Kategori
                </label>
                <div className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs flex items-center">
                  🧵 Penjahit Konveksi
                </div>
              </div>

              {/* Tanggal Kasbon */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tanggal Kasbon
                </label>
                <input
                  type="date"
                  required
                  value={formData.tglKasbon}
                  onChange={(e) => setFormData({ ...formData, tglKasbon: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Nominal Kasbon Format Rupiah */}
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider block">
                    Nominal Kasbon (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
                    Rupiah
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-amber-700">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={formatRupiahDisplay(formData.nominal)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, nominal: raw ? Number(raw) : '' });
                    }}
                    className="w-full h-11 pl-10 pr-3 bg-white border border-amber-300 rounded-xl font-mono font-black text-slate-900 text-base text-right focus:border-amber-600 focus:outline-none"
                  />
                </div>

                {/* Terbilang */}
                {Number(formData.nominal) > 0 && (
                  <div className="text-[10px] text-amber-900 italic">
                    "{getTerbilang(formData.nominal)}"
                  </div>
                )}

                {/* Quick Chips */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[50000, 100000, 200000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const current = Number(formData.nominal) || 0;
                        setFormData({ ...formData, nominal: current + val });
                      }}
                      className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-mono font-bold text-amber-900 active:scale-95"
                    >
                      +{(val / 1000)}Rb
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, nominal: '' })}
                    className="px-2 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-600 ml-auto"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Keperluan / Catatan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan / Keperluan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Biaya berobat, keperluan darurat, uang bensin..."
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </form>

            {/* Footer Buttons Fixed */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {editingId ? 'Simpan Perubahan' : 'Catat Kasbon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL RIWAYAT POTONGAN KASBON */}
      {isHistoryModalOpen && selectedKasbon && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Riwayat Pemotongan Kasbon
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    {selectedKasbon.noKasbon} • {selectedKasbon.namaPetugas}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ringkasan Saldo Kasbon */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-1 text-xs shrink-0">
              <div className="flex justify-between">
                <span className="text-amber-800">Pokok Kasbon:</span>
                <span className="font-mono font-bold text-slate-900">
                  Rp {Number(selectedKasbon.nominal).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">Total Terpotong:</span>
                <span className="font-mono font-bold text-emerald-700">
                  Rp {Number(selectedKasbon.terbayar).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-amber-200/80 font-bold">
                <span className="text-amber-900">Sisa Belum Lunas:</span>
                <span className="font-mono font-black text-amber-900">
                  Rp {Number(selectedKasbon.sisa).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* List Riwayat Pemotongan */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Histori Payroll Pembayaran Upah
              </span>
              {loadingHistory ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-4 h-4 mx-auto mb-1 animate-spin text-amber-600" />
                  Memuat riwayat...
                </div>
              ) : riwayatList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  Belum ada riwayat pemotongan upah.
                </div>
              ) : (
                riwayatList.map((r, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        - Rp {Number(r.nominalDipotong).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {r.tglPotong ? String(r.tglPotong).slice(0, 10) : '-'}
                      </span>
                    </div>
                    {r.noPembayaran && (
                      <div className="text-[10.5px] text-slate-500 font-mono">
                        No. Bukti: {r.noPembayaran} ({r.tahapan || 'Upah'})
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
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

