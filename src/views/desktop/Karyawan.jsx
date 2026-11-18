import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Upload,
  Briefcase,
  Layers,
  Phone,
  Calendar,
  Building2
} from 'lucide-react';
import {
  EMPLOYEE_CATEGORIES,
  EMPLOYEE_SECTIONS,
  EMPLOYEE_STATUSES,
} from '../../constants/uiConstants';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function Karyawan({
  employees: propEmployees,
  setEmployees: propSetEmployees,
}) {
  const [localEmployees, setLocalEmployees] = useState([]);
  const employees = propEmployees || localEmployees;
  const setEmployees = propSetEmployees || setLocalEmployees;

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterBagian, setFilterBagian] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [perPage, setPerPage] = useState('50');

  // Modal States
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Tab Counts
  const counts = useMemo(() => {
    return {
      all: employees.length,
      aktif: employees.filter((e) => e.status === 'Aktif').length,
      cutting: employees.filter((e) => (e.bagian || '').toLowerCase().includes('cut') || (e.bagian || '').toLowerCase().includes('pola')).length,
      jahit: employees.filter((e) => (e.bagian || '').toLowerCase().includes('jahit') || (e.bagian || '').toLowerCase().includes('penjahit')).length,
      finishing: employees.filter((e) => (e.bagian || '').toLowerCase().includes('finishing') || (e.bagian || '').toLowerCase().includes('qc')).length,
      nonAktif: employees.filter((e) => e.status !== 'Aktif').length,
    };
  }, [employees]);

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((item) => {
      const b = (item.bagian || '').toLowerCase();
      if (activeTab === 'AKTIF' && item.status !== 'Aktif') return false;
      if (activeTab === 'CUTTING' && !b.includes('cut') && !b.includes('pola')) return false;
      if (activeTab === 'JAHIT' && !b.includes('jahit') && !b.includes('penjahit')) return false;
      if (activeTab === 'FINISHING' && !b.includes('finishing') && !b.includes('qc')) return false;
      if (activeTab === 'NONAKTIF' && item.status === 'Aktif') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          item.nik.toLowerCase().includes(q) ||
          item.nama.toLowerCase().includes(q) ||
          item.bagian.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filterKategori && item.kategori !== filterKategori) return false;
      if (filterBagian && item.bagian !== filterBagian) return false;
      if (filterStatus && item.status !== filterStatus) return false;

      return true;
    });
  }, [employees, activeTab, searchTerm, filterKategori, filterBagian, filterStatus]);

  // CRUD Actions
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setModalMode('create');
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setModalMode('edit');
  };

  const handleSaveEmployee = (formData) => {
    if (modalMode === 'edit' && editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editingEmployee.id ? { ...formData, id: e.id } : e))
      );
      api.updateEmployee(editingEmployee.id, formData).catch((e) => console.warn('Gagal update karyawan ke API:', e));
      Swal.success('Berhasil Diperbarui', `Data karyawan "${formData.nama}" berhasil diperbarui.`);
    } else {
      const newEntry = {
        ...formData,
        id: Date.now(),
      };
      setEmployees((prev) => [newEntry, ...prev]);
      api.createEmployee(newEntry).catch((e) => console.warn('Gagal simpan karyawan ke API:', e));
      Swal.success('Berhasil Ditambahkan', `Karyawan "${formData.nama}" berhasil didaftarkan.`);
    }
    setModalMode(null);
    setEditingEmployee(null);
  };

  const handleDeleteEmployeePrompt = async (emp) => {
    const res = await Swal.confirm(
      'Hapus Karyawan?',
      `Apakah Anda yakin ingin menghapus data karyawan "${emp.nama}" (${emp.nik})?`
    );
    if (res.isConfirmed) {
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      api.deleteEmployee(emp.id).catch((e) => console.warn('Gagal hapus karyawan dari API:', e));
      Swal.success('Terhapus!', `Data karyawan "${emp.nama}" berhasil dihapus.`);
    }
  };

  // Helper Badge Status
  const getBadgeClass = (status) => {
    const found = EMPLOYEE_STATUSES.find((s) => s.value === status);
    return found ? found.badgeClass : 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="w-full space-y-2.5">
      {/* 1. TOP BANNER HEADER (PM HEADER STYLES) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg p-2.5 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">
                Data Master Karyawan & Tenaga Kerja
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[10px] font-extrabold">
                SDM
              </span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Kelola data NIK, nama karyawan, kategori kerja, bagian produksi, dan status aktif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => showToast('Fitur import Excel karyawan siap digunakan.')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer border border-emerald-400/30"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#0284c7] rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0284c7]" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER TABS (PM TAB STYLES) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#0284c7] text-white border border-[#0284c7] shadow-[0_1px_4px_rgba(2,132,199,0.25)]'
              : 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] hover:bg-blue-100/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Semua Karyawan ({counts.all})</span>
        </button>

        <button
          onClick={() => setActiveTab('AKTIF')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'AKTIF'
              ? 'bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]'
              : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Karyawan Aktif ({counts.aktif})</span>
        </button>

        <button
          onClick={() => setActiveTab('CUTTING')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'CUTTING'
              ? 'bg-[#0284c7] text-white border border-[#0284c7] shadow-[0_1px_4px_rgba(2,132,199,0.25)]'
              : 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] hover:bg-blue-100/60'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Bagian Cutting ({counts.cutting})</span>
        </button>

        <button
          onClick={() => setActiveTab('JAHIT')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'JAHIT'
              ? 'bg-[#0d9488] text-white border border-[#0d9488] shadow-[0_1px_4px_rgba(13,148,136,0.25)]'
              : 'bg-[#f0fdfa] text-[#0f766e] border border-[#99f6e4] hover:bg-teal-100/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bagian Jahit ({counts.jahit})</span>
        </button>

        <button
          onClick={() => setActiveTab('FINISHING')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'FINISHING'
              ? 'bg-[#ea580c] text-white border border-[#ea580c] shadow-[0_1px_4px_rgba(234,88,12,0.25)]'
              : 'bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] hover:bg-orange-100/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Finishing & QC ({counts.finishing})</span>
        </button>

        <button
          onClick={() => setActiveTab('NONAKTIF')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'NONAKTIF'
              ? 'bg-[#ef4444] text-white border border-[#ef4444] shadow-[0_1px_4px_rgba(239,68,68,0.25)]'
              : 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] hover:bg-red-100/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Cuti / Non-Aktif ({counts.nonAktif})</span>
        </button>
      </div>

      {/* 3. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NIK, Nama Karyawan, Bagian, Kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] focus:bg-white text-[#0f172a] transition-all"
            />
          </div>

          <div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {EMPLOYEE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterBagian}
              onChange={(e) => setFilterBagian(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
            >
              <option value="">Semua Bagian</option>
              {EMPLOYEE_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
            >
              <option value="">Semua Status</option>
              {EMPLOYEE_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABEL KARYAWAN CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2.5 text-center w-12 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-2.5 min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">NIK</th>
                <th className="py-2.5 px-2.5 min-w-[200px] border-r border-[#3b4c5e] text-white font-bold">NAMA KARYAWAN</th>
                <th className="py-2.5 px-2.5 min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">KATEGORI</th>
                <th className="py-2.5 px-2.5 min-w-[160px] border-r border-[#3b4c5e] text-white font-bold">BAGIAN</th>
                <th className="py-2.5 px-2.5 text-center w-28 border-r border-[#3b4c5e] text-white font-bold">STATUS</th>
                <th className="py-2.5 px-2.5 text-center w-24 text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Tidak ada karyawan ditemukan</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau filter</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* NO */}
                    <td className="py-2 px-2.5 text-center text-slate-700 font-bold text-xs border-r border-slate-200/60">
                      {index + 1}
                    </td>

                    {/* NIK */}
                    <td className="py-2 px-2.5 border-r border-slate-200/60">
                      <span className="font-mono text-xs font-bold text-[#0284c7]">
                        {emp.nik}
                      </span>
                    </td>

                    {/* NAMA KARYAWAN */}
                    <td className="py-2 px-2.5 border-r border-slate-200/60">
                      <div className="font-bold text-slate-900 leading-snug text-xs">
                        {emp.nama}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{emp.telepon || '-'}</span>
                      </div>
                    </td>

                    {/* KATEGORI */}
                    <td className="py-2 px-2.5 border-r border-slate-200/60">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        {emp.kategori}
                      </span>
                    </td>

                    {/* BAGIAN */}
                    <td className="py-2 px-2.5 border-r border-slate-200/60">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        <Briefcase className="w-3 h-3 text-slate-600" />
                        <span>{emp.bagian}</span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-2 px-2.5 text-center border-r border-slate-200/60">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${getBadgeClass(
                          emp.status
                        )}`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="py-2 px-2.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewEmployee(emp)}
                          className="w-7 h-7 rounded-lg bg-[#00a8cc] hover:bg-[#0091b3] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Lihat Detail Karyawan"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="w-7 h-7 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Edit Karyawan"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-white" />
                        </button>

                        <button
                          onClick={() => handleDeleteEmployeePrompt(emp)}
                          className="w-7 h-7 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER TABEL */}
        <div className="px-3.5 py-2 bg-[#f8fafc] border-t border-[#cbd5e1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-[#64748b]">
          <div>
            Menampilkan <span className="font-bold text-[#0f172a]">{filteredEmployees.length}</span> data karyawan
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="px-2.5 py-1 rounded border border-[#cbd5e1] bg-white text-slate-400 cursor-not-allowed text-xs font-semibold"
            >
              Sebelumnya
            </button>
            <button className="px-2.5 py-1 rounded border border-[#0284c7] bg-[#0284c7] text-white font-bold text-xs">
              1
            </button>
            <button className="px-2.5 py-1 rounded border border-[#cbd5e1] bg-white text-[#334155] hover:bg-slate-50 text-xs font-semibold cursor-pointer">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT KARYAWAN */}
      {modalMode && (
        <FormModalKaryawan
          isOpen={Boolean(modalMode)}
          editingEmployee={editingEmployee}
          onClose={() => {
            setModalMode(null);
            setEditingEmployee(null);
          }}
          onSave={handleSaveEmployee}
        />
      )}

      {/* 6. MODAL DETAIL KARYAWAN */}
      {viewEmployee && (
        <DetailModalKaryawan
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          getBadgeClass={getBadgeClass}
        />
      )}

      {/* 7. NOTIFIKASI TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

// Modal Form Tambah/Edit Karyawan
function FormModalKaryawan({ isOpen, editingEmployee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nik: editingEmployee?.nik || `KNV-2026-0${Math.floor(10 + Math.random() * 90)}`,
    nama: editingEmployee?.nama || '',
    kategori: editingEmployee?.kategori || 'Tetap',
    bagian: editingEmployee?.bagian || 'Jahit (Sewing)',
    status: editingEmployee?.status || 'Aktif',
    telepon: editingEmployee?.telepon || '',
    tanggalMasuk: editingEmployee?.tanggalMasuk || new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nik || !formData.nama) {
      alert('NIK dan Nama Karyawan wajib diisi!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden text-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
            </h3>
            <p className="text-xs text-slate-500">Isi NIK, nama karyawan, kategori, dan bagian kerja</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIK Karyawan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.toUpperCase() })}
                placeholder="misal: KNV-2026-010"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="misal: 0812-3456-7890"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Karyawan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="misal: Budi Santoso"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
              >
                {EMPLOYEE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bagian Kerja</label>
              <select
                value={formData.bagian}
                onChange={(e) => setFormData({ ...formData, bagian: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
              >
                {EMPLOYEE_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
              >
                {EMPLOYEE_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold cursor-pointer shadow-xs"
            >
              {editingEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Detail Karyawan
function DetailModalKaryawan({ employee, onClose, getBadgeClass }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs text-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400">
              <Users className="w-4 h-4" />
            </span>
            <span className="font-mono font-bold tracking-wider text-sm">{employee.nik}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Karyawan</span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{employee.nama}</h4>
            <p className="text-slate-500 mt-0.5">{employee.telepon || '-'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Kategori Kerja
              </span>
              <span className="font-semibold text-slate-800">{employee.kategori}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status
              </span>
              <span className={`font-semibold px-2 py-0.5 rounded border inline-block ${getBadgeClass(employee.status)}`}>
                {employee.status}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Bagian / Divisi Kerja
            </span>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-600" />
              <span className="font-semibold text-slate-800">{employee.bagian}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}



