import React, { useState, useEffect, useMemo } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Check,
  UserCheck,
  Warehouse,
  Scissors,
  Layers,
  PackageCheck,
  Phone,
  Mail,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';
import { USER_ROLES } from '../../constants/userRoles';

export default function Users() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'detail' | null
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    password: '',
    role: 'superadmin',
    status: 'Aktif',
    telepon: '',
    keterangan: ''
  });

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      if (Array.isArray(data)) {
        setUserList(data);
      }
    } catch (err) {
      console.warn('Gagal memuat data users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Form Handlers
  const handleOpenCreate = () => {
    setFormData({
      username: '',
      nama: '',
      email: '',
      password: '',
      role: 'superadmin',
      status: 'Aktif',
      telepon: '',
      keterangan: ''
    });
    setModalMode('create');
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      nama: user.nama || '',
      email: user.email || '',
      password: '', // kosongkan jika tidak ingin mengganti password
      role: user.role || 'superadmin',
      status: user.status || 'Aktif',
      telepon: user.telepon || '',
      keterangan: user.keterangan || ''
    });
    setModalMode('edit');
  };

  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    setModalMode('detail');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.nama.trim()) {
      Swal.fire('Form Kurang', 'Username dan Nama Lengkap wajib diisi!', 'warning');
      return;
    }

    try {
      if (modalMode === 'create') {
        const payload = {
          ...formData,
          password: formData.password.trim() || '123456'
        };
        const created = await api.createUser(payload);
        setUserList((prev) => [created, ...prev]);
        Swal.success('Berhasil!', `Pengguna "${created.username}" berhasil didaftarkan.`);
      } else if (modalMode === 'edit') {
        const payload = { ...formData };
        if (!payload.password.trim()) delete payload.password;
        await api.updateUser(selectedUser.id, payload);
        setUserList((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, ...payload } : u))
        );
        Swal.success('Berhasil!', `Data pengguna "${formData.username}" berhasil diperbarui.`);
      }
      setModalMode(null);
    } catch (err) {
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === 'admin') {
      Swal.fire('Dilarang!', 'Akun Super Admin ("admin") tidak boleh dihapus demi keamanan sistem.', 'warning');
      return;
    }

    const res = await Swal.confirm(
      'Hapus Akun Pengguna?',
      `Yakin ingin menghapus akun "${user.username}" (${user.nama})?`
    );
    if (res.isConfirmed) {
      try {
        await api.deleteUser(user.id);
        setUserList((prev) => prev.filter((u) => u.id !== user.id));
        Swal.success('Terhapus!', `Pengguna ${user.username} berhasil dihapus.`);
      } catch (err) {
        Swal.fire('Gagal Menghapus', err.message || 'Tidak dapat menghapus pengguna', 'error');
      }
    }
  };

  // Helper Ikon Role
  const getRoleIcon = (roleKey) => {
    switch (roleKey) {
      case 'superadmin':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'gudang':
        return <Warehouse className="w-3.5 h-3.5" />;
      case 'cutting':
        return <Scissors className="w-3.5 h-3.5" />;
      case 'jahit':
        return <Layers className="w-3.5 h-3.5" />;
      case 'qc':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'finishing':
        return <PackageCheck className="w-3.5 h-3.5" />;
      default:
        return <UserCheck className="w-3.5 h-3.5" />;
    }
  };

  // KPI Calculations
  const counts = useMemo(() => {
    const all = userList.length;
    const superadmin = userList.filter((u) => u.role === 'superadmin').length;
    const gudang = userList.filter((u) => u.role === 'gudang').length;
    const pabrik = userList.filter((u) => ['cutting', 'jahit', 'qc', 'finishing'].includes(u.role)).length;
    const aktif = userList.filter((u) => u.status === 'Aktif').length;
    return { all, superadmin, gudang, pabrik, aktif };
  }, [userList]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      if (filterRole !== 'ALL' && u.role !== filterRole) return false;
      if (filterStatus && u.status !== filterStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchU = (u.username || '').toLowerCase().includes(q);
        const matchN = (u.nama || '').toLowerCase().includes(q);
        const matchE = (u.email || '').toLowerCase().includes(q);
        const matchT = (u.telepon || '').toLowerCase().includes(q);
        if (!matchU && !matchN && !matchE && !matchT) return false;
      }
      return true;
    });
  }, [userList, filterRole, filterStatus, searchTerm]);

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl py-2.5 px-3 sm:px-4 shadow-[0_2px_4px_rgba(15,23,42,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-2.5 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-xs">
            <UsersIcon className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Pengaturan Pengguna & Hak Akses (Users)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-black uppercase tracking-wider">
                SETTINGS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-tight font-medium">
              Kelola akun login operator pabrik, password, dan pembatasan menu sesuai 6 role sistem konveksi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah User Baru</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Pengguna
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5 font-mono leading-none">
            {counts.all} <span className="text-xs font-semibold text-slate-400">Akun</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
            Super Admin
          </div>
          <div className="text-lg font-black text-cyan-800 mt-0.5 font-mono leading-none">
            {counts.superadmin} <span className="text-xs font-semibold text-cyan-500">Akses Penuh</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Admin Gudang
          </div>
          <div className="text-lg font-black text-amber-800 mt-0.5 font-mono leading-none">
            {counts.gudang} <span className="text-xs font-semibold text-amber-500">Stok & Logistik</span>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            Divisi Produksi Pabrik
          </div>
          <div className="text-lg font-black text-indigo-800 mt-0.5 font-mono leading-none">
            {counts.pabrik} <span className="text-xs font-semibold text-indigo-500">Cutting, Jahit, QC, Finish</span>
          </div>
        </div>
      </div>

      {/* 3. TABS FILTER ROLE */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'Semua User', count: counts.all },
          { key: 'superadmin', label: 'Super Admin', count: counts.superadmin },
          { key: 'gudang', label: 'Gudang', count: counts.gudang },
          { key: 'cutting', label: 'Cutting' },
          { key: 'jahit', label: 'Jahit' },
          { key: 'qc', label: 'QC' },
          { key: 'finishing', label: 'Finishing' },
        ].map((tab) => {
          const isActive = filterRole === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterRole(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-[#cbd5e1] hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. FILTER BAR & SEARCH */}
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-2 shadow-2xs flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Username, Nama Lengkap, Email, Telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0284c7] focus:bg-white text-slate-800"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-lg focus:outline-none focus:border-[#0284c7] text-slate-700 cursor-pointer font-medium"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* 5. TABEL PENGGUNA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-12 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-3 min-w-[180px] border-r border-[#3b4c5e] text-white font-bold">USERNAME & IDENTITAS</th>
                <th className="py-2.5 px-3 min-w-[180px] border-r border-[#3b4c5e] text-white font-bold">NAMA LENGKAP & EMAIL</th>
                <th className="py-2.5 px-3 min-w-[170px] border-r border-[#3b4c5e] text-white font-bold">ROLE & DIVISI</th>
                <th className="py-2.5 px-3 min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">KONTAK</th>
                <th className="py-2.5 px-2.5 text-center w-24 border-r border-[#3b4c5e] text-white font-bold">STATUS</th>
                <th className="py-2.5 px-2.5 text-center w-28 text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Tidak ada pengguna ditemukan</p>
                    <p className="text-[11px] text-slate-400">Klik "+ Tambah User Baru" untuk mendaftarkan akun baru</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item, idx) => {
                  const roleCfg = USER_ROLES[item.role] || USER_ROLES.superadmin;
                  const isAktif = item.status === 'Aktif';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 text-center text-slate-700 font-bold text-xs border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* USERNAME */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs bg-gradient-to-br ${roleCfg.themeGradient}`}>
                            {roleCfg.avatarText}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-xs text-[#0284c7]">
                              @{item.username}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ID: #{item.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* NAMA LENGKAP & EMAIL */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs truncate max-w-xs" title={item.nama}>
                            {item.nama}
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-normal truncate max-w-xs">
                            {item.email || '-'}
                          </span>
                        </div>
                      </td>

                      {/* ROLE & DIVISI */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            {getRoleIcon(item.role)}
                            <span>{roleCfg.name}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {roleCfg.division}
                          </span>
                        </div>
                      </td>

                      {/* KONTAK */}
                      <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-200/60">
                        {item.telepon || '-'}
                      </td>

                      {/* STATUS */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            isAktif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="w-7.5 h-7.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                            title="Lihat Detail User"
                          >
                            <Eye className="w-4 h-4 text-white stroke-[2.2]" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-7.5 h-7.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                            title="Edit User"
                          >
                            <Edit3 className="w-4 h-4 text-white stroke-[2.2]" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item)}
                            disabled={item.username === 'admin'}
                            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 ${
                              item.username === 'admin'
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-[#ef4444] hover:bg-[#dc2626] text-white cursor-pointer'
                            }`}
                            title={item.username === 'admin' ? 'Super Admin utama tidak dapat dihapus' : 'Hapus User'}
                          >
                            <Trash2 className="w-4 h-4 stroke-[2.2]" />
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

        <div className="px-3.5 py-2.5 bg-[#f8fafc] border-t border-[#cbd5e1] text-[11.5px] text-[#64748b] flex items-center justify-between">
          <div>
            Menampilkan <strong className="text-slate-900">{filteredUsers.length}</strong> akun pengguna aktif
          </div>
          <div className="text-[11px] text-slate-400">
            Tersimpan langsung di tabel MySQL <code className="text-slate-600 font-mono">users</code>
          </div>
        </div>
      </div>

      {/* MODAL FORM CREATE / EDIT USER */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {modalMode === 'create' ? 'Tambah Pengguna Baru' : 'Edit Data Pengguna'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Akun login dan konfigurasi hak akses operasional pabrik
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

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: admin, gudang1, cutting01"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {modalMode === 'create' ? 'Password Awal' : 'Password Baru (Opsional)'}
                  </label>
                  <input
                    type="password"
                    placeholder={modalMode === 'create' ? 'Default: 123456' : 'Kosongkan jika tidak diganti'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Ahmad Dahlan (Kepala Finishing)"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hak Akses (Role Sistem)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    {Object.values(USER_ROLES).map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name} ({r.division})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Aktif">Aktif (Dapat Login & Akses)</option>
                    <option value="Nonaktif">Nonaktif (Diblokir Sementara)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Pengguna (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="user@konveksi.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Tugas
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan penanggung jawab atau catatan khusus..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL USER */}
      {modalMode === 'detail' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Rincian Profil Akun
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Informasi detail hak akses pengguna di sistem
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

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs bg-gradient-to-br ${(USER_ROLES[selectedUser.role] || USER_ROLES.superadmin).themeGradient}`}>
                  {(USER_ROLES[selectedUser.role] || USER_ROLES.superadmin).avatarText}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                    {selectedUser.nama}
                  </h4>
                  <div className="font-mono text-xs text-[#0284c7] font-bold">
                    @{selectedUser.username}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Role</span>
                  <span className="font-extrabold text-slate-900">
                    {(USER_ROLES[selectedUser.role] || USER_ROLES.superadmin).name}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Akun</span>
                  <span className={`font-bold ${selectedUser.status === 'Aktif' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email: <strong>{selectedUser.email || '-'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Telepon: <strong className="font-mono">{selectedUser.telepon || '-'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dibuat: <strong>{selectedUser.createdAt ? String(selectedUser.createdAt).slice(0, 10) : '-'}</strong></span>
                </div>
              </div>

              {selectedUser.keterangan && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  <strong>Catatan Tugas:</strong> {selectedUser.keterangan}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold"
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

