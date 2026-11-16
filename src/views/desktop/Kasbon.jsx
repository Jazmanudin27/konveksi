import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Receipt,
  User,
  Calendar,
  History,
  Trash2,
  Edit3,
  X,
  RefreshCw,
  Coins,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function Kasbon() {
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
  const [activeTab, setActiveTab] = useState('Belum Lunas'); // 'Semua' | 'Belum Lunas' | 'Lunas'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

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

  // List Penjahit untuk Select Option
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

      // Gabungkan nama unik untuk suggestions
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
      if (filterKategori && item.kategoriPetugas !== filterKategori) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const no = (item.noKasbon || '').toLowerCase();
        const nama = (item.namaPetugas || '').toLowerCase();
        const kep = (item.keperluan || '').toLowerCase();
        if (!no.includes(q) && !nama.includes(q) && !kep.includes(q)) return false;
      }
      return true;
    });
  }, [kasbonList, activeTab, filterKategori, searchQuery]);

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

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      namaPetugas: '',
      kategoriPetugas: 'Penjahit',
      tglKasbon: new Date().toISOString().slice(0, 10),
      nominal: '',
      keperluan: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    if (Number(item.terbayar) > 0) {
      Swal.fire(
        'Perhatian',
        'Kasbon yang sudah terpotong sebagian dari upah tidak dapat diubah nominalnya.',
        'warning'
      );
      return;
    }
    setFormData({
      namaPetugas: item.namaPetugas,
      kategoriPetugas: item.kategoriPetugas || 'Penjahit',
      tglKasbon: item.tglKasbon,
      nominal: item.nominal,
      keperluan: item.keperluan || '',
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNominal = Number(String(formData.nominal).replace(/\D/g, ''));
    if (!formData.namaPetugas.trim() || !cleanNominal || cleanNominal <= 0) {
      Swal.fire('Perhatian', 'Pilih nama penjahit dan isi nominal kasbon yang valid.', 'warning');
      return;
    }

    const payload = {
      ...formData,
      nominal: cleanNominal,
    };

    try {
      if (editingId) {
        await api.updateKasbon(editingId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: 'Data kasbon telah diupdate.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.createKasbon(payload);
        Swal.fire({
          icon: 'success',
          title: 'Kasbon Dicatat',
          text: `Kasbon sebesar Rp ${cleanNominal.toLocaleString('id-ID')} atas nama ${formData.namaPetugas} berhasil dicatat. Akan otomatis dipotong saat pembayaran upah.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal menyimpan kasbon', 'error');
    }
  };

  // Delete Kasbon
  const handleDelete = async (item) => {
    if (Number(item.terbayar) > 0) {
      Swal.fire(
        'Tidak Dapat Dihapus',
        'Kasbon ini sudah memiliki riwayat pemotongan upah. Batalkan terlebih dahulu transaksi pembayaran upahnya.',
        'warning'
      );
      return;
    }

    const res = await Swal.fire({
      title: 'Hapus Kasbon?',
      text: `Hapus catatan kasbon "${item.noKasbon}" atas nama ${item.namaPetugas}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (res.isConfirmed) {
      try {
        await api.deleteKasbon(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Data kasbon berhasil dihapus.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal menghapus kasbon', 'error');
      }
    }
  };

  // View Riwayat Potongan
  const handleViewHistory = async (item) => {
    setSelectedKasbon(item);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const data = await api.getKasbonRiwayat(item.id);
      setRiwayatList(Array.isArray(data) ? data : []);
    } catch (err) {
      setRiwayatList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 text-white rounded-xl py-2 px-3 sm:px-4 shadow-[0_2px_4px_rgba(217,119,6,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Wallet className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Kasbon & Pinjaman Karyawan / Penjahit
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10.5px] font-black">
                POTONG GAJI OTOMATIS
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 leading-tight font-medium">
              Pencatatan pinjaman sementara tenaga kerja yang otomatis terpotong saat pembayaran upah borongan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/25"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Catat Kasbon Baru</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Sisa Kasbon Belum Lunas</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-950 mt-1 font-mono leading-none">
            Rp {(rekap.totalSisa || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">
            {rekap.countBelumLunas || 0} pinjaman belum lunas
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Total Terpotong dari Upah</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-950 mt-1 font-mono leading-none">
            Rp {(rekap.totalTerbayar || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">
            Sudah dipotong saat gajian
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Total Pinjaman Diberikan</span>
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1 font-mono leading-none">
            Rp {(rekap.totalKasbon || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Akumulasi seluruh kasbon
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Peminjam Aktif</span>
            <User className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-indigo-950 mt-1 font-mono leading-none">
            {rekap.jumlahPeminjamAktif || 0} <span className="text-xs font-semibold text-indigo-500">Orang</span>
          </div>
          <div className="text-[10px] text-indigo-600/80 mt-0.5">
            Memiliki saldo kasbon
          </div>
        </div>
      </div>

      {/* 3. TABS FILTER */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'Belum Lunas', label: 'Belum Lunas (Aktif)', count: rekap.countBelumLunas },
          { key: 'Lunas', label: 'Sudah Lunas', count: rekap.countLunas },
          { key: 'Semua', label: 'Semua Riwayat', count: rekap.totalTransaksi },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab.key
                ? 'bg-amber-700 text-white shadow-xs font-extrabold'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 4. SEARCH & FILTER DROPDOWN */}
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-2 shadow-2xs flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari no kasbon, nama karyawan / penjahit, keperluan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-amber-600 focus:bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-amber-600 text-slate-700"
          >
            <option value="">Semua Divisi</option>
            <option value="Penjahit">Penjahit</option>
            <option value="Cutting">Pemotong (Cutting)</option>
            <option value="QC">Quality Control (QC)</option>
            <option value="Finishing">Finishing & Packing</option>
            <option value="Karyawan">Karyawan Lainnya</option>
          </select>
        </div>
      </div>

      {/* 5. TABEL KASBON */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-[#cbd5e1]">
            <thead>
              <tr className="bg-[#f8fafc] text-[#334155] font-extrabold text-xs tracking-wider uppercase">
                <th className="py-2 px-2 text-center w-10 border border-[#cbd5e1]">NO</th>
                <th className="py-2 px-3 whitespace-nowrap min-w-[130px] border border-[#cbd5e1]">NO KASBON</th>
                <th className="py-2 px-3 whitespace-nowrap min-w-[100px] border border-[#cbd5e1]">TGL KASBON</th>
                <th className="py-2 px-3 whitespace-nowrap min-w-[160px] border border-[#cbd5e1]">NAMA PETUGAS</th>
                <th className="py-2 px-3 whitespace-nowrap min-w-[110px] border border-[#cbd5e1]">DIVISI</th>
                <th className="py-2 px-3 text-right whitespace-nowrap min-w-[120px] border border-[#cbd5e1]">NOMINAL</th>
                <th className="py-2 px-3 text-right whitespace-nowrap min-w-[120px] border border-[#cbd5e1]">TERPOTONG</th>
                <th className="py-2 px-3 text-right whitespace-nowrap min-w-[130px] border border-[#cbd5e1]">SISA KASBON</th>
                <th className="py-2 px-3 text-center whitespace-nowrap min-w-[95px] border border-[#cbd5e1]">STATUS</th>
                <th className="py-2 px-3 min-w-[180px] border border-[#cbd5e1]">KEPERLUAN</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[110px] border border-[#cbd5e1]">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-700 divide-y divide-[#cbd5e1]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400 border border-[#cbd5e1]">
                    {loading ? 'Memuat data kasbon...' : 'Tidak ada data kasbon yang sesuai.'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isLunas = item.status === 'Lunas';
                  const sisa = Number(item.sisa) || 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 text-center font-bold text-slate-500 border border-[#cbd5e1]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-800 bg-amber-50/50 border border-[#cbd5e1]">
                        {item.noKasbon}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 border border-[#cbd5e1]">
                        {item.tglKasbon}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 border border-[#cbd5e1]">
                        {item.namaPetugas}
                      </td>
                      <td className="py-2 px-3 border border-[#cbd5e1]">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.kategoriPetugas}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border border-[#cbd5e1]">
                        Rp {Number(item.nominal).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold border border-[#cbd5e1]">
                        Rp {Number(item.terbayar).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black border border-[#cbd5e1]">
                        <span className={sisa > 0 ? 'text-amber-700' : 'text-slate-400'}>
                          Rp {sisa.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center border border-[#cbd5e1]">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isLunas
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] border border-[#cbd5e1]">
                        {item.keperluan || '-'}
                      </td>
                      <td className="py-2 px-2.5 text-center border border-[#cbd5e1]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewHistory(item)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            title="Riwayat Potongan Upah"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                            title="Edit Kasbon"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Hapus Kasbon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* MODAL 1: CATAT / EDIT KASBON (FORMAT RUPIAH & UI PREMIUM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-0">
            {/* Header Modal Bar */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white shadow-inner">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    {editingId ? 'Edit Catatan Kasbon' : 'Catat Kasbon Penjahit'}
                  </h3>
                  <p className="text-[11px] text-amber-100/90 font-medium mt-0.5">
                    Otomatis memotong upah kerja saat gajian borongan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {/* 1. Pilih Penjahit via Select Option */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Pilih Penjahit (Penerima Kasbon) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Master Penjahit
                  </span>
                </label>
                <select
                  required
                  value={formData.namaPetugas}
                  onChange={(e) => setFormData({ ...formData, namaPetugas: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 text-xs sm:text-sm focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/15 cursor-pointer transition-all"
                >
                  <option value="">-- Klik untuk Pilih Nama Penjahit --</option>
                  {penjahitList.length > 0 ? (
                    penjahitList.map((p) => (
                      <option key={p.id || p.nama} value={p.nama}>
                        🧵 {p.nama} {p.tarifPerPcs ? `• (Tarif Jahit: Rp ${Number(p.tarifPerPcs).toLocaleString('id-ID')} / Pcs)` : ''}
                      </option>
                    ))
                  ) : (
                    petugasSuggestions.map((name) => (
                      <option key={name} value={name}>
                        🧵 {name}
                      </option>
                    ))
                  )}
                </select>

                {/* Card Info Penjahit Terpilih */}
                {formData.namaPetugas && (
                  <div className="mt-2 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">
                        🧵
                      </div>
                      <div>
                        <span className="font-extrabold text-amber-950 block">{formData.namaPetugas}</span>
                        <span className="text-[10.5px] text-amber-800">Bagian: Tim Penjahit Borongan</span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Aktif
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Tanggal Kasbon & Divisi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Kasbon
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tglKasbon}
                    onChange={(e) => setFormData({ ...formData, tglKasbon: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-xs focus:bg-white focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Divisi / Bagian
                  </label>
                  <div className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 flex items-center text-xs">
                    🧵 Penjahit Konveksi
                  </div>
                </div>
              </div>

              {/* 3. INPUT NOMINAL KASBON DENGAN FORMAT RUPIAH INTERAKTIF */}
              <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-4 rounded-2xl border-2 border-amber-300/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider block">
                    Nominal Pinjaman / Kasbon <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                    Format Rupiah Otomatis
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-base text-amber-700 select-none">
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
                    className="w-full h-12 pl-12 pr-4 bg-white border-2 border-amber-400 rounded-xl font-mono font-black text-xl text-slate-900 text-right focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 shadow-inner tracking-tight"
                  />
                </div>

                {/* Terbilang Rupiah */}
                {Number(formData.nominal) > 0 && (
                  <div className="p-2 bg-white/80 rounded-lg border border-amber-200/80 text-[11px] text-amber-950 font-medium italic flex items-center gap-1.5 animate-in fade-in">
                    <span className="font-bold text-amber-700 not-italic shrink-0">Terbilang:</span>
                    <span className="line-clamp-2">"{getTerbilang(formData.nominal)}"</span>
                  </div>
                )}

                {/* Quick Add Chips Nominal */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">
                    Pilihan Cepat Tambah Nominal:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[50000, 100000, 200000, 500000, 1000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const current = Number(formData.nominal) || 0;
                          setFormData({ ...formData, nominal: current + val });
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100/80 active:scale-95 border border-amber-300 rounded-lg text-[10.5px] font-mono font-bold text-amber-900 shadow-2xs transition-all cursor-pointer"
                      >
                        + Rp {(val / 1000).toLocaleString('id-ID')} Rb
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nominal: '' })}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 active:scale-95 rounded-lg text-[10.5px] font-bold text-slate-600 transition-all cursor-pointer ml-auto"
                      title="Reset Nominal ke 0"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Keperluan / Alasan Pinjam */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Keperluan / Alasan Pinjam (Opsional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Misal: Biaya berobat, keperluan mendesak keluarga, bensin..."
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-600 focus:outline-none text-xs text-slate-800"
                />
              </div>

              {/* Info Otomatisasi */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <div>
                  <strong>Otomatis Potong Upah:</strong> Saat admin membuka menu <i>Pembayaran Upah</i> untuk penjahit ini, sistem otomatis mendeteksi sisa kasbon dan memotong gaji bersihnya.
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Simpan Kasbon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RIWAYAT POTONGAN UPAH */}
      {isHistoryModalOpen && selectedKasbon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Riwayat Pemotongan Kasbon
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    No: {selectedKasbon.noKasbon} • {selectedKasbon.namaPetugas}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Sisa Pinjaman */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Nominal Kasbon:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  Rp {Number(selectedKasbon.nominal).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block">Total Terpotong:</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  Rp {Number(selectedKasbon.terbayar).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-600 block">Sisa Belum Lunas:</span>
                <span className="font-mono font-black text-amber-800 text-xs">
                  Rp {Number(selectedKasbon.sisa).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* List Riwayat Pemotongan */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-700">Daftar Transaksi Pemotongan:</div>
              {loadingHistory ? (
                <div className="p-4 text-center text-slate-400">Memuat riwayat...</div>
              ) : riwayatList.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Belum ada potongan upah yang dilakukan untuk kasbon ini.
                </div>
              ) : (
                riwayatList.map((rw) => (
                  <div
                    key={rw.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Potong Upah: {rw.noPembayaranUpah}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                        Tanggal: {rw.tglPotong} • {rw.catatan}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-700 text-xs block">
                        - Rp {Number(rw.nominalPotong).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9.5px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Terpotong
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
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

