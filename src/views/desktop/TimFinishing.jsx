import React, { useState, useEffect, useMemo } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  Phone,
  Calendar,
  Sparkles,
  RefreshCw,
  Warehouse,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function TimFinishing() {
  const [finishingList, setFinishingList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'AKTIF' | 'INTERNAL' | 'BORONGAN' | 'NONAKTIF'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState({
    kodeTim: '',
    namaTim: '',
    kategori: 'Internal',
    spesialisasi: 'Finishing, Setrika Uap & Packing',
    kapasitasHarian: 250,
    telepon: '',
    status: 'Aktif',
    catatan: '',
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getTimFinishing();
      if (Array.isArray(data)) {
        setFinishingList(data);
      }
    } catch (err) {
      console.warn('Gagal memuat tim finishing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return finishingList.filter((item) => {
      if (activeTab === 'AKTIF' && item.status !== 'Aktif') return false;
      if (activeTab === 'INTERNAL' && item.kategori !== 'Internal') return false;
      if (activeTab === 'BORONGAN' && item.kategori !== 'Borongan') return false;
      if (activeTab === 'NONAKTIF' && item.status === 'Aktif') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (item.kodeTim || '').toLowerCase().includes(q) ||
          (item.namaTim || '').toLowerCase().includes(q) ||
          (item.spesialisasi || '').toLowerCase().includes(q) ||
          (item.telepon || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filterKategori && item.kategori !== filterKategori) return false;
      if (filterStatus && item.status !== filterStatus) return false;

      return true;
    });
  }, [finishingList, activeTab, searchTerm, filterKategori, filterStatus]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setFormData({
      kodeTim: `FIN-${Date.now().toString().slice(-4)}`,
      namaTim: '',
      kategori: 'Internal',
      spesialisasi: 'Finishing, Setrika Uap & Packing',
      kapasitasHarian: 250,
      telepon: '',
      status: 'Aktif',
      catatan: '',
    });
    setEditingId(null);
    setModalMode('create');
  };

  const handleOpenEdit = (item) => {
    setFormData({
      kodeTim: item.kodeTim || '',
      namaTim: item.namaTim || '',
      kategori: item.kategori || 'Internal',
      spesialisasi: item.spesialisasi || 'Finishing, Setrika Uap & Packing',
      kapasitasHarian: Number(item.kapasitasHarian) || 250,
      telepon: item.telepon || '',
      status: item.status || 'Aktif',
      catatan: item.catatan || '',
    });
    setEditingId(item.id);
    setModalMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await api.createTimFinishing(formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Ditambahkan',
          text: `Tim Finishing "${formData.namaTim}" berhasil didaftarkan.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.updateTimFinishing(editingId, formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: `Data tim "${formData.namaTim}" telah diupdate.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setModalMode(null);
      await fetchData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal menyimpan tim finishing', 'error');
    }
  };

  const handleDelete = async (item) => {
    const res = await Swal.fire({
      title: 'Hapus Tim Finishing?',
      text: `Apakah Anda yakin ingin menghapus "${item.namaTim}" dari tabel tim finishing?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (res.isConfirmed) {
      try {
        await api.deleteTimFinishing(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Data tim finishing berhasil dihapus.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal menghapus tim finishing', 'error');
      }
    }
  };

  const counts = useMemo(() => {
    return {
      all: finishingList.length,
      aktif: finishingList.filter((f) => f.status === 'Aktif').length,
      internal: finishingList.filter((f) => f.kategori === 'Internal').length,
      borongan: finishingList.filter((f) => f.kategori === 'Borongan').length,
      totalKapasitas: finishingList
        .filter((f) => f.status === 'Aktif')
        .reduce((sum, f) => sum + (Number(f.kapasitasHarian) || 0), 0),
    };
  }, [finishingList]);

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-emerald-800 text-white rounded-xl py-2 px-3 sm:px-4 shadow-[0_2px_4px_rgba(5,150,105,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <PackageCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Data Tim Finishing & Packing
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10.5px] font-black">
                MASTER TIM FINISHING
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 leading-tight font-medium">
              Tabel terpisah khusus tim finishing, setrika uap, pemasangan hangtag barcode & pengemasan akhir OPP
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
            <span>+ Tambah Tim Finishing</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Tim Finishing
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5 font-mono leading-none">
            {counts.all} <span className="text-xs font-semibold text-slate-400">Tim</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Tim Aktif
          </div>
          <div className="text-lg font-black text-emerald-800 mt-0.5 font-mono leading-none">
            {counts.aktif} <span className="text-xs font-semibold text-emerald-500">Siap Proses</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
            Tim Internal
          </div>
          <div className="text-lg font-black text-teal-800 mt-0.5 font-mono leading-none">
            {counts.internal} <span className="text-xs font-semibold text-teal-500">Reguler</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
            Total Kapasitas Harian
          </div>
          <div className="text-lg font-black text-cyan-800 mt-0.5 font-mono leading-none">
            {counts.totalKapasitas.toLocaleString('id-ID')} <span className="text-xs font-semibold text-cyan-500">Pcs/Hari</span>
          </div>
        </div>
      </div>

      {/* 3. TABS FILTER */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'Semua Tim', count: counts.all },
          { key: 'AKTIF', label: 'Tim Aktif', count: counts.aktif },
          { key: 'INTERNAL', label: 'Internal', count: counts.internal },
          { key: 'BORONGAN', label: 'Borongan', count: counts.borongan },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab.key
                ? 'bg-teal-700 text-white shadow-xs font-extrabold'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
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
            placeholder="Cari kode tim, nama tim finishing, spesialisasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-teal-600 text-slate-700"
          >
            <option value="">Semua Kategori</option>
            <option value="Internal">Internal</option>
            <option value="Borongan">Borongan</option>
            <option value="Mitra Luar">Mitra Luar</option>
          </select>
        </div>

        <div className="w-full sm:w-36">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-teal-600 text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* 5. TABEL TIM FINISHING (SPREADSHEET STYLE) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px] border-r border-[#3b4c5e] text-white font-bold">KODE TIM</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[200px] border-r border-[#3b4c5e] text-white font-bold">NAMA TIM FINISHING</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">KATEGORI</th>
                <th className="py-2.5 px-3 min-w-[240px] border-r border-[#3b4c5e] text-white font-bold">SPESIALISASI PENGERJAAN</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">KAPASITAS / HARI</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">KONTAK / HP</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[90px] border-r border-[#3b4c5e] text-white font-bold">STATUS</th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[100px] text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    {loading ? 'Memuat tim finishing...' : 'Tidak ada data tim finishing yang sesuai.'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center font-bold text-slate-600 border-r border-slate-200/60">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-teal-700 bg-teal-50/50 border-r border-slate-200/60">
                      {item.kodeTim}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200/60">
                      {item.namaTim}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60">
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 border-r border-slate-200/60">
                      {item.spesialisasi}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200/60">
                      {Number(item.kapasitasHarian).toLocaleString('id-ID')} Pcs
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-200/60">
                      {item.telepon || '-'}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200/60">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="w-7.5 h-7.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                          title="Edit Tim Finishing"
                        >
                          <Edit3 className="w-4 h-4 text-white stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-7.5 h-7.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                          title="Hapus Tim Finishing"
                        >
                          <Trash2 className="w-4 h-4 text-white stroke-[2.2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREATE / EDIT TIM FINISHING */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {modalMode === 'create' ? 'Tambah Tim Finishing Baru' : 'Edit Tim Finishing'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Tabel khusus data divisi finishing & packing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kode Tim
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kodeTim}
                    onChange={(e) => setFormData({ ...formData, kodeTim: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Tim
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-teal-600"
                  >
                    <option value="Internal">Internal</option>
                    <option value="Borongan">Borongan</option>
                    <option value="Mitra Luar">Mitra Luar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Tim Finishing & Packing
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Tim Finishing 1 (Uap & Lipat), Tim Packing OPP"
                  value={formData.namaTim}
                  onChange={(e) => setFormData({ ...formData, namaTim: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kapasitas Harian (Pcs/Hari)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.kapasitasHarian}
                    onChange={(e) => setFormData({ ...formData, kapasitasHarian: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-teal-600 text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-teal-600"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Spesialisasi Pengerjaan
                </label>
                <input
                  type="text"
                  placeholder="Cth: Setrika Uap Gantung, Pasang Hangtag, Plastik OPP, Quality Final"
                  value={formData.spesialisasi}
                  onChange={(e) => setFormData({ ...formData, spesialisasi: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kontak / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Cth: Meja uap 4 line, packing dus karton"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-md"
                >
                  Simpan Tim Finishing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

