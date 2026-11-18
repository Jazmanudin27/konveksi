import React, { useState, useMemo } from 'react';
import {
  Tag,
  RefreshCw,
  Plus,
  Search,
  Edit3,
  Trash2,
  FolderOpen,
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Swal } from '../../utils/swal';

export default function Kategori({
  categories: propCategories,
  products = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [localCategories, setLocalCategories] = useState([]);
  const categories = propCategories || localCategories;
  const setCategories = (fn) => {
    if (typeof fn === 'function') {
      setLocalCategories(fn);
    } else {
      setLocalCategories(fn);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          cat.kode.toLowerCase().includes(q) ||
          cat.nama.toLowerCase().includes(q) ||
          cat.deskripsi.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus && cat.status !== filterStatus) return false;
      return true;
    });
  }, [categories, searchTerm, filterStatus]);

  // CRUD
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalMode('create');
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setModalMode('edit');
  };

  const handleSave = (formData) => {
    if (modalMode === 'edit' && editingCategory) {
      const updatedCat = { ...formData, id: editingCategory.id };
      if (onUpdateCategory) {
        onUpdateCategory(updatedCat, editingCategory.nama);
      } else {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updatedCat : c))
        );
      }
      Swal.success('Kategori Diperbarui', `Kategori "${formData.nama}" berhasil disimpan.`);
    } else {
      const newCat = {
        ...formData,
        id: Date.now(),
        updatedAt: new Date().toISOString().split('T')[0],
      };
      if (onAddCategory) {
        onAddCategory(newCat);
      } else {
        setCategories((prev) => [newCat, ...prev]);
      }
      Swal.success('Kategori Ditambahkan', `Kategori "${formData.nama}" berhasil didaftarkan.`);
    }
    setModalMode(null);
    setEditingCategory(null);
  };

  const handleDeleteCategoryPrompt = async (cat) => {
    const res = await Swal.confirm(
      'Hapus Kategori Produk?',
      `Yakin ingin menghapus kategori "${cat.nama}" (${cat.kode})?`
    );
    if (res.isConfirmed) {
      if (onDeleteCategory) {
        onDeleteCategory(cat.id, cat.nama);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      }
      Swal.success('Terhapus!', `Kategori "${cat.nama}" berhasil dihapus.`);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* 1. HEADER CARD (PM HEADER STYLES) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg p-2.5 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">
                Data Master Kategori Produk
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[10px] font-extrabold">
                KATEGORI
              </span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Kelola pengelompokan jenis pakaian, kaos, kemeja, celana, dan jaket konveksi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => showToast('Data kategori berhasil dimuat ulang.')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#0284c7] rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0284c7]" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode kategori, nama, deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] focus:bg-white text-[#0f172a] transition-all"
          />
        </div>
        <div className="w-full sm:w-44">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* 3. TABEL KATEGORI CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2.5 text-center w-12 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-2.5 min-w-[130px] border-r border-[#3b4c5e] text-white font-bold">KODE KATEGORI</th>
                <th className="py-2.5 px-2.5 min-w-[160px] border-r border-[#3b4c5e] text-white font-bold">NAMA KATEGORI</th>
                <th className="py-2.5 px-2.5 min-w-[200px] border-r border-[#3b4c5e] text-white font-bold">DESKRIPSI PRODUK</th>
                <th className="py-2.5 px-2.5 text-right w-32 border-r border-[#3b4c5e] text-white font-bold">HARGA POTONG</th>
                <th className="py-2.5 px-2.5 text-center w-28 border-r border-[#3b4c5e] text-white font-bold">TOTAL PRODUK</th>
                <th className="py-2.5 px-2.5 text-center w-24 border-r border-[#3b4c5e] text-white font-bold">STATUS</th>
                <th className="py-2.5 px-2.5 text-center w-24 text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Tidak ada kategori ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const productCount = products.filter((p) => p.kategori === cat.nama).length;
                  const hargaPotong = Number(cat.hargaPotong || 0);

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 text-center text-slate-700 font-bold text-xs border-r border-slate-200/60">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200/60">
                        <span className="font-mono font-bold text-xs text-[#0284c7]">
                          {cat.kode}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-900 text-xs border-r border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                          <span>{cat.nama}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 max-w-sm truncate text-xs border-r border-slate-200/60">
                        {cat.deskripsi}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 text-xs border-r border-slate-200/60">
                        Rp {hargaPotong.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold text-slate-800 border-r border-slate-200/60">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold">
                          {productCount} Item
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                            cat.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {cat.status}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="w-7.5 h-7.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                            title="Edit Kategori"
                          >
                            <Edit3 className="w-4 h-4 text-white stroke-[2.2]" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryPrompt(cat)}
                            className="w-7.5 h-7.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-4 h-4 text-white stroke-[2.2]" />
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
            Menampilkan <span className="font-bold text-[#0f172a]">{filteredCategories.length}</span> kategori produk
          </div>
        </div>
      </div>

      {/* 4. MODAL FORM TAMBAH / EDIT KATEGORI */}
      {modalMode && (
        <FormModalKategori
          isOpen={Boolean(modalMode)}
          editingCategory={editingCategory}
          onClose={() => {
            setModalMode(null);
            setEditingCategory(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* 5. TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

// Sub-komponen Modal Form Kategori
function FormModalKategori({ isOpen, editingCategory, onClose, onSave }) {
  const [formData, setFormData] = useState({
    kode: editingCategory?.kode || `KAT-${Math.floor(100 + Math.random() * 900)}`,
    nama: editingCategory?.nama || '',
    deskripsi: editingCategory?.deskripsi || '',
    hargaPotong: editingCategory?.hargaPotong !== undefined && editingCategory?.hargaPotong !== null && Number(editingCategory.hargaPotong) > 0
      ? editingCategory.hargaPotong
      : (HARGA_POTONG_MAP[editingCategory?.nama?.toUpperCase()] || 0),
    status: editingCategory?.status || 'Aktif',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kode || !formData.nama) {
      alert('Kode Kategori dan Nama Kategori wajib diisi!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs text-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {editingCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}
            </h3>
            <p className="text-slate-500">Kelola master klasifikasi produk pakaian</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kode Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.kode}
              onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
              placeholder="misal: KAT-TSH"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="misal: Kaos / T-Shirt"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Harga Potong / Cutting (@Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                value={formData.hargaPotong}
                onChange={(e) => setFormData({ ...formData, hargaPotong: Number(e.target.value) })}
                placeholder="700"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Produk</label>
            <textarea
              rows="3"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Tuliskan keterangan kategori pakaian ini..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            >
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingCategory ? 'Simpan Perubahan' : 'Tambahkan Kategori'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

