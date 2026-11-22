import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
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
  Coins,
  KeyRound,
  User,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function Penjahit({ employees: propEmployees = [], setEmployees: propSetEmployees }) {
  const [localEmployees, setLocalEmployees] = useState([]);
  const employees = propEmployees && propEmployees.length > 0 ? propEmployees : localEmployees;
  const setEmployees = propSetEmployees || setLocalEmployees;

  const [loading, setLoading] = useState(false);

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'AKTIF' | 'BORONGAN' | 'TETAP' | 'NONAKTIF'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    kategori: 'Borongan',
    bagian: 'Penjahit',
    telepon: '',
    status: 'Aktif',
    tanggalMasuk: new Date().toISOString().slice(0, 10),
    username: '',
    password: '123456',
  });
  const [editingId, setEditingId] = useState(null);

  // Ambil list penjahit langsung dari Data Karyawan (employees)
  const penjahitList = useMemo(() => {
    return (employees || []).filter((item) => {
      const b = (item.bagian || '').toLowerCase();
      return b.includes('jahit') || b.includes('penjahit');
    });
  }, [employees]);

  // Fetch Data Karyawan dari Server
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      if (Array.isArray(data)) {
        if (setEmployees) {
          setEmployees(data);
        } else {
          setLocalEmployees(data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data karyawan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!employees || employees.length === 0) {
      fetchData();
    }
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return penjahitList.filter((item) => {
      if (activeTab === 'AKTIF' && item.status !== 'Aktif') return false;
      if (activeTab === 'BORONGAN' && item.kategori !== 'Borongan') return false;
      if (activeTab === 'TETAP' && item.kategori !== 'Tetap') return false;
      if (activeTab === 'NONAKTIF' && item.status === 'Aktif') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (item.nik || '').toLowerCase().includes(q) ||
          (item.nama || '').toLowerCase().includes(q) ||
          (item.bagian || '').toLowerCase().includes(q) ||
          (item.telepon || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filterKategori && item.kategori !== filterKategori) return false;
      if (filterStatus && item.status !== filterStatus) return false;

      return true;
    });
  }, [penjahitList, activeTab, searchTerm, filterKategori, filterStatus]);

  // Modal Handlers
  const handleOpenCreate = () => {
    const defaultNik = `JHT-${Date.now().toString().slice(-4)}`;
    setFormData({
      nik: defaultNik,
      nama: '',
      kategori: 'Borongan',
      bagian: 'Penjahit',
      telepon: '',
      status: 'Aktif',
      tanggalMasuk: new Date().toISOString().slice(0, 10),
      username: defaultNik.toLowerCase(),
      password: '123456',
    });
    setEditingId(null);
    setModalMode('create');
  };

  const handleOpenEdit = (item) => {
    setFormData({
      nik: item.nik || '',
      nama: item.nama || '',
      kategori: item.kategori || 'Borongan',
      bagian: item.bagian || 'Penjahit',
      telepon: item.telepon || '',
      status: item.status || 'Aktif',
      tanggalMasuk: item.tanggalMasuk || new Date().toISOString().slice(0, 10),
      username: item.username || (item.nik || item.nama.replace(/\s+/g, '')).toLowerCase(),
      password: item.password || '123456',
    });
    setEditingId(item.id);
    setModalMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanUsername = (formData.username || formData.nik || formData.nama.replace(/\s+/g, '')).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const payload = {
        ...formData,
        bagian: 'Penjahit',
        username: cleanUsername,
        password: formData.password || '123456',
      };

      if (modalMode === 'create') {
        await api.createEmployee(payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Ditambahkan',
          html: `
            <div style="font-size:12px; text-align:left; color:#334155;">
              <p>Penjahit <b>${formData.nama}</b> berhasil didaftarkan.</p>
              <div style="margin-top:8px; padding:8px 12px; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:6px; color:#5b21b6;">
                🔑 <b>Username:</b> ${cleanUsername}<br/>
                🔒 <b>Password:</b> ${formData.password || '123456'}
              </div>
            </div>
          `,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await api.updateEmployee(editingId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          html: `
            <div style="font-size:12px; text-align:left; color:#334155;">
              <p>Data akun <b>${formData.nama}</b> telah diperbarui.</p>
              <div style="margin-top:8px; padding:8px 12px; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:6px; color:#5b21b6;">
                🔑 <b>Username:</b> ${cleanUsername}<br/>
                🔒 <b>Password:</b> ${formData.password || '123456'}
              </div>
            </div>
          `,
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setModalMode(null);
      await fetchData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Gagal menyimpan data penjahit', 'error');
    }
  };

  const handleDelete = async (item) => {
    const res = await Swal.fire({
      title: 'Hapus Penjahit?',
      text: `Apakah Anda yakin ingin menghapus "${item.nama}" dari Data Karyawan?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (res.isConfirmed) {
      try {
        await api.deleteEmployee(item.id);
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Data penjahit berhasil dihapus dari Data Karyawan.',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal menghapus penjahit', 'error');
      }
    }
  };

  const counts = useMemo(() => {
    return {
      all: penjahitList.length,
      aktif: penjahitList.filter((p) => p.status === 'Aktif').length,
      borongan: penjahitList.filter((p) => p.kategori === 'Borongan').length,
      tetap: penjahitList.filter((p) => p.kategori === 'Tetap').length,
      nonaktif: penjahitList.filter((p) => p.status !== 'Aktif').length,
    };
  }, [penjahitList]);

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white rounded-xl py-2 px-3 sm:px-4 shadow-[0_2px_4px_rgba(79,70,229,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Scissors className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Data Tenaga Penjahit (Sewing)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10.5px] font-black">
                MASTER PENJAHIT
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 leading-tight font-medium">
              Data terintegrasi langsung dengan Data Master Karyawan (Bagian Penjahit)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const res = await api.syncPenjahitUsers();
                Swal.fire({
                  icon: 'success',
                  title: 'Sinkronisasi Akun Penjahit Berhasil!',
                  html: `
                    <div style="font-size:12px; text-align:left; color:#334155; line-height:1.6;">
                      <p>${res.message || 'Semua penjahit kini memiliki akun login masing-masing.'}</p>
                      <div style="margin-top:8px; padding:10px 14px; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:8px; color:#5b21b6;">
                        🔑 <b>Username:</b> NIK atau Nama Penjahit (huruf kecil)<br/>
                        🔒 <b>Password Default:</b> 123456<br/>
                        🎯 <b>Role:</b> Jahit (Sewing)
                      </div>
                    </div>
                  `,
                  confirmButtonColor: '#9333ea',
                });
              } catch (err) {
                Swal.fire('Gagal Sinkronisasi', err.message || 'Terjadi kesalahan sistem', 'error');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-purple-400 active:scale-95"
            title="Buat akun login otomatis untuk setiap penjahit agar bisa login dan scan SPK"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sinkron Akun Login</span>
          </button>
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
            <span>+ Tambah Penjahit</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Penjahit
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5 font-mono leading-none">
            {counts.all} <span className="text-xs font-semibold text-slate-400">Orang</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Penjahit Aktif
          </div>
          <div className="text-lg font-black text-emerald-800 mt-0.5 font-mono leading-none">
            {counts.aktif} <span className="text-xs font-semibold text-emerald-500">Siap Jahit</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            Sistem Borongan
          </div>
          <div className="text-lg font-black text-purple-800 mt-0.5 font-mono leading-none">
            {counts.borongan} <span className="text-xs font-semibold text-purple-500">Orang</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            Tenaga Tetap
          </div>
          <div className="text-lg font-black text-indigo-800 mt-0.5 font-mono leading-none">
            {counts.tetap} <span className="text-xs font-semibold text-indigo-500">Orang</span>
          </div>
        </div>
      </div>

      {/* 3. TABS FILTER */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'Semua Penjahit', count: counts.all },
          { key: 'AKTIF', label: 'Penjahit Aktif', count: counts.aktif },
          { key: 'BORONGAN', label: 'Borongan', count: counts.borongan },
          { key: 'TETAP', label: 'Tetap', count: counts.tetap },
          { key: 'NONAKTIF', label: 'Non-Aktif', count: counts.nonaktif },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`h-7.5 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab.key
                ? 'bg-purple-700 text-white shadow-xs font-extrabold'
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
            placeholder="Cari NIK, nama penjahit, spesialisasi, telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-purple-600 focus:bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-purple-600 text-slate-700"
          >
            <option value="">Semua Kategori</option>
            <option value="Borongan">Borongan</option>
            <option value="Tetap">Tetap</option>
            <option value="Makloon">Makloon</option>
            <option value="Harian Lepas">Harian Lepas</option>
          </select>
        </div>

        <div className="w-full sm:w-36">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-purple-600 text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* 5. TABEL MASTER PENJAHIT (SPREADSHEET STYLE) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px] border-r border-[#3b4c5e] text-white font-bold">KODE / NIK</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px] border-r border-[#3b4c5e] text-white font-bold">NAMA PENJAHIT</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px] border-r border-[#3b4c5e] text-white font-bold">AKUN LOGIN (USER & PASS)</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">KATEGORI</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">KONTAK / HP</th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">TGL MASUK</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[90px] border-r border-[#3b4c5e] text-white font-bold">STATUS</th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[100px] text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    {loading ? 'Memuat data penjahit dari Data Karyawan...' : 'Tidak ada data penjahit di Data Karyawan.'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center font-bold text-slate-600 border-r border-slate-200/60">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#0284c7] bg-sky-50/50 border-r border-slate-200/60">
                      {item.nik}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60">
                      <span className="font-bold text-slate-900 block leading-tight">{item.nama}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.bagian || 'Penjahit'}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60 whitespace-nowrap bg-purple-50/30">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-purple-950 font-mono text-xs font-black">
                          <User className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{item.username || (item.nik || item.nama.replace(/\s+/g, '')).toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10.5px]">
                          <Lock className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                          <span>Pass: <strong className="text-purple-900 font-black">{item.password || '123456'}</strong></span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60">
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-200/60">
                      {item.telepon || '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-mono border-r border-slate-200/60">
                      {item.tanggalMasuk ? String(item.tanggalMasuk).slice(0, 10) : '-'}
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
                          title="Edit Penjahit"
                        >
                          <Edit3 className="w-4 h-4 text-white stroke-[2.2]" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-7.5 h-7.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                          title="Hapus Penjahit"
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

      {/* MODAL CREATE / EDIT PENJAHIT */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {modalMode === 'create' ? 'Tambah Penjahit Baru' : 'Edit Data Penjahit'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Tabel khusus data tenaga kerja penjahit
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
                    Kode / NIK
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Tenaga
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                  >
                    <option value="Borongan">Borongan</option>
                    <option value="Tetap">Tetap</option>
                    <option value="Makloon">Makloon</option>
                    <option value="Harian Lepas">Harian Lepas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Penjahit
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: CEPI, Siti Aminah, Budi"
                  value={formData.nama}
                  onChange={(e) => {
                    const newNama = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      nama: newNama,
                      username:
                        modalMode === 'create' && !prev.usernameTouched
                          ? newNama.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || prev.nik.toLowerCase()
                          : prev.username,
                    }));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* AKUN LOGIN PENJAHIT (USERNAME & PASSWORD) */}
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span>Akun Login Penjahit</span>
                  </div>
                  <span className="text-[10px] text-purple-600 font-medium">Untuk Scan SPK di HP</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Username Login *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Username penjahit"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                          usernameTouched: true,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 font-mono font-bold text-purple-950 bg-white focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password Login *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 font-mono font-bold text-purple-950 bg-white focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Masuk
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalMasuk}
                    onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600"
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
                  className="flex-1 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md"
                >
                  Simpan Penjahit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

