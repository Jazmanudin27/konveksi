import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Phone,
  RefreshCw,
  User,
  Lock,
  KeyRound,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function TimCutting() {
  const [cuttingList, setCuttingList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState({
    kodeTim: '',
    namaTim: '',
    username: '',
    password: '123456',
    kategori: 'Internal',
    spesialisasi: 'Cutting Pola, Gelar Kain & Potong',
    kapasitasHarian: 250,
    telepon: '',
    status: 'Aktif',
    catatan: '',
  });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getTimCutting();
      if (Array.isArray(data)) {
        setCuttingList(data);
      }
    } catch (err) {
      console.warn('Gagal memuat tim cutting:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredList = useMemo(() => {
    return cuttingList.filter((item) => {
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
          (item.telepon || '').toLowerCase().includes(q) ||
          (item.username || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filterKategori && item.kategori !== filterKategori) return false;
      if (filterStatus && item.status !== filterStatus) return false;

      return true;
    });
  }, [cuttingList, activeTab, searchTerm, filterKategori, filterStatus]);

  const handleOpenCreate = () => {
    setFormData({
      kodeTim: `CUT-${Date.now().toString().slice(-4)}`,
      namaTim: '',
      username: '',
      password: '123456',
      kategori: 'Internal',
      spesialisasi: 'Cutting Pola, Gelar Kain & Potong',
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
      username: item.username || '',
      password: item.password || '123456',
      kategori: item.kategori || 'Internal',
      spesialisasi: item.spesialisasi || 'Cutting Pola, Gelar Kain & Potong',
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
        await api.createTimCutting(formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Ditambahkan',
          text: `Tim Cutting "${formData.namaTim}" berhasil didaftarkan.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await api.updateTimCutting(editingId, formData);
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
      Swal.fire('Error', err.message || 'Gagal menyimpan tim cutting', 'error');
    }
  };

  const handleDelete = async (item) => {
    const res = await Swal.fire({
      title: 'Hapus Tim Cutting?',
      text: `Apakah Anda yakin ingin menghapus "${item.namaTim}" dari tabel tim cutting?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (res.isConfirmed) {
      try {
        await api.deleteTimCutting(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Data tim cutting berhasil dihapus.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal menghapus tim cutting', 'error');
      }
    }
  };

  const counts = useMemo(() => {
    return {
      all: cuttingList.length,
      aktif: cuttingList.filter((f) => f.status === 'Aktif').length,
      internal: cuttingList.filter((f) => f.kategori === 'Internal').length,
      borongan: cuttingList.filter((f) => f.kategori === 'Borongan').length,
      totalKapasitas: cuttingList
        .filter((f) => f.status === 'Aktif')
        .reduce((sum, f) => sum + (Number(f.kapasitasHarian) || 0), 0),
    };
  }, [cuttingList]);

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white rounded-xl py-2 px-3 sm:px-4 shadow-[0_2px_4px_rgba(37,99,235,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Scissors className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Data Tim Cutting & Pola
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10.5px] font-black">
                MASTER TIM CUTTING
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 leading-tight font-medium">
              Tabel terpisah khusus tim cutting, gelar kain, pembuatan pola & akun login divisi cutting
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Tim Cutting</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Tim Cutting
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5 font-mono leading-none">
            {counts.all} <span className="text-xs font-semibold text-slate-400">Tim</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Tim Aktif
          </div>
          <div className="text-lg font-black text-blue-800 mt-0.5 font-mono leading-none">
            {counts.aktif} <span className="text-xs font-semibold text-blue-500">Siap Potong</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            Tim Internal
          </div>
          <div className="text-lg font-black text-indigo-800 mt-0.5 font-mono leading-none">
            {counts.internal} <span className="text-xs font-semibold text-indigo-500">Reguler</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
            Total Kapasitas Harian
          </div>
          <div className="text-lg font-black text-cyan-800 mt-0.5 font-mono leading-none">
            {counts.totalKapasitas.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-semibold text-cyan-500">Pcs/Hari</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {[
          { key: 'ALL', label: 'Semua Tim', count: counts.all },
          { key: 'AKTIF', label: 'Tim Aktif', count: counts.aktif },
          { key: 'INTERNAL', label: 'Internal', count: counts.internal },
          { key: 'BORONGAN', label: 'Borongan', count: counts.borongan },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#cbd5e1] hover:bg-slate-50'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === t.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. SEARCH & FILTER */}
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-2 shadow-2xs flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kode tim, nama tim cutting, username, spesialisasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-blue-600 text-slate-700"
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
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-blue-600 text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* 5. TABEL TIM CUTTING (6 KOLOM RINGKAS) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-3 border-r border-[#3b4c5e] text-white font-bold">TIM CUTTING & KONTAK</th>
                <th className="py-2.5 px-3 border-r border-[#3b4c5e] text-white font-bold">KATEGORI & SPESIALISASI</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#3b4c5e] text-white font-bold">KAPASITAS & STATUS</th>
                <th className="py-2.5 px-3 whitespace-nowrap border-r border-[#3b4c5e] text-white font-bold">AKUN LOGIN</th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap w-24 text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    {loading ? 'Memuat tim cutting...' : 'Belum ada data tim cutting. Klik "+ Tambah Tim Cutting".'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center font-bold text-slate-600 border-r border-slate-200/60">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {item.kodeTim}
                        </span>
                        <span className="font-bold text-slate-900">
                          {item.namaTim}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.telepon || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60">
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                        {item.kategori}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {item.spesialisasi || '-'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">
                        {Number(item.kapasitasHarian).toLocaleString('id-ID')}{' '}
                        <span className="text-[10px] font-semibold text-slate-500">Pcs/Hr</span>
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold border inline-block ${
                            item.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60 font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.username || item.kodeTim?.toLowerCase() || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{item.password || '123456'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="w-7.5 h-7.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                          title="Edit Tim Cutting"
                        >
                          <Edit3 className="w-4 h-4 text-white stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-7.5 h-7.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                          title="Hapus Tim Cutting"
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

      {/* MODAL CREATE / EDIT TIM CUTTING */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {modalMode === 'create' ? 'Tambah Tim Cutting Baru' : 'Edit Tim Cutting'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Tabel khusus data divisi cutting & pola
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Tim
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="Internal">Internal</option>
                    <option value="Borongan">Borongan</option>
                    <option value="Mitra Luar">Mitra Luar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Tim Cutting
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Tim Cutting 1 (Meja Potong A)"
                  value={formData.namaTim}
                  onChange={(e) => setFormData({ ...formData, namaTim: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-blue-600"
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-blue-600 text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-blue-600"
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
                  placeholder="Cth: Gelar Kain, Potong Pola Gamis, Potong Kerudung"
                  value={formData.spesialisasi}
                  onChange={(e) => setFormData({ ...formData, spesialisasi: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* AKUN LOGIN TIM CUTTING */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                  <span>Akun Akses Login Divisi Cutting</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Username Login
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: cutting1"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-blue-600 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                      Password Login
                    </label>
                    <input
                      type="text"
                      placeholder="Default: 123456"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-blue-600 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Cth: Meja potong 2 unit"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Simpan Tim Cutting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
