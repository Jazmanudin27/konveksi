import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Check,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Clock,
  Package,
  Boxes
} from 'lucide-react';
import { BAHAN_SATUAN_OPTIONS } from '../../constants/uiConstants';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function Bahan({ bahan = [], setBahan }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSatuan, setFilterSatuan] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [editingBahan, setEditingBahan] = useState(null);
  const [deleteBahan, setDeleteBahan] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Format currency helper
  const formatRupiah = (val) => {
    if (!val && val !== 0) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  // Tab counters
  const counts = useMemo(() => {
    return {
      all: bahan.length,
      kg: bahan.filter((b) => b.satuan === 'Kg').length,
      meter: bahan.filter((b) => b.satuan === 'Meter').length,
      yard: bahan.filter((b) => b.satuan === 'Yard').length,
      cone: bahan.filter((b) => b.satuan === 'Cone').length,
    };
  }, [bahan]);

  // Filtering
  const filteredBahan = useMemo(() => {
    return bahan.filter((item) => {
      // Tab filter
      if (activeTab === 'KG' && item.satuan !== 'Kg') return false;
      if (activeTab === 'METER' && item.satuan !== 'Meter') return false;
      if (activeTab === 'YARD' && item.satuan !== 'Yard') return false;
      if (activeTab === 'CONE' && item.satuan !== 'Cone') return false;

      // Satuan dropdown
      if (filterSatuan && item.satuan !== filterSatuan) return false;

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchKode = item.kodeBahan?.toLowerCase().includes(query);
        const matchNama = item.namaBahan?.toLowerCase().includes(query);
        const matchKet = item.keterangan?.toLowerCase().includes(query);
        if (!matchKode && !matchNama && !matchKet) return false;
      }

      return true;
    });
  }, [bahan, activeTab, filterSatuan, searchTerm]);

  // Handlers CRUD
  const handleOpenCreate = () => {
    setEditingBahan(null);
    setModalMode('create');
  };

  const handleOpenEdit = (item) => {
    setEditingBahan(item);
    setModalMode('edit');
  };

  const handleSaveForm = (formData) => {
    if (modalMode === 'create') {
      const initialStock = Number(formData.stok || 0);
      const newItem = {
        ...formData,
        id: Date.now(),
        stok: initialStock,
        status: initialStock === 0 ? 'Habis' : initialStock < 20 ? 'Menipis' : 'Tersedia',
      };
      setBahan((prev) => [...prev, newItem]);
      api.createBahan(newItem).catch((e) => console.warn('Gagal simpan bahan ke API:', e));
      Swal.success('Bahan Ditambahkan', `Bahan "${formData.namaBahan}" berhasil disimpan.`);
    } else if (modalMode === 'edit' && editingBahan) {
      setBahan((prev) =>
        prev.map((b) =>
          b.id === editingBahan.id
            ? { ...b, ...formData, stok: formData.stok !== undefined ? formData.stok : (b.stok ?? 0) }
            : b
        )
      );
      api.updateBahan(editingBahan.id, formData).catch((e) => console.warn('Gagal update bahan ke API:', e));
      Swal.success('Bahan Diperbarui', `Bahan "${formData.namaBahan}" berhasil diperbarui.`);
    }
    setModalMode(null);
    setEditingBahan(null);
  };

  const handleDeleteBahanPrompt = async (item) => {
    const res = await Swal.confirm(
      'Hapus Bahan Baku?',
      `Yakin ingin menghapus bahan "${item.namaBahan}" (${item.kodeBahan})? Tindakan ini tidak dapat dibatalkan.`
    );
    if (res.isConfirmed) {
      setBahan((prev) => prev.filter((b) => b.id !== item.id));
      api.deleteBahan(item.id).catch((e) => console.warn('Gagal hapus bahan dari API:', e));
      Swal.success('Terhapus!', `Bahan "${item.namaBahan}" berhasil dihapus.`);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0f172a] text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER CARD (PM HEADER GRADIENT) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg p-2.5 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">
                Data Master Bahan Baku Kain
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[10px] font-extrabold">
                BAHAN
              </span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Kelola master material kain (combed, fleece, taslan, lacoste, oxford, drill) & harga beli
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={async () => {
              try {
                const data = await api.getBahan();
                if (Array.isArray(data)) setBahan(data);
                showToast('Data bahan berhasil dimuat ulang.');
              } catch (_) {
                showToast('Gagal memuat ulang bahan.');
              }
            }}
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
            <span>Tambah Bahan</span>
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
          <Boxes className="w-3.5 h-3.5" />
          <span>Semua Bahan ({counts.all})</span>
        </button>

        <button
          onClick={() => setActiveTab('KG')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'KG'
              ? 'bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]'
              : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Kilogram / Kg ({counts.kg})</span>
        </button>

        <button
          onClick={() => setActiveTab('CONE')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'CONE'
              ? 'bg-[#8b5cf6] text-white border border-[#8b5cf6] shadow-[0_1px_4px_rgba(139,92,246,0.25)]'
              : 'bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] hover:bg-purple-100/60'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Cone ({counts.cone})</span>
        </button>

        {counts.meter > 0 && (
          <button
            onClick={() => setActiveTab('METER')}
            className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'METER'
                ? 'bg-[#0d9488] text-white border border-[#0d9488] shadow-[0_1px_4px_rgba(13,148,136,0.25)]'
                : 'bg-[#f0fdfa] text-[#0f766e] border border-[#99f6e4] hover:bg-teal-100/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Meter ({counts.meter})</span>
          </button>
        )}

        {counts.yard > 0 && (
          <button
            onClick={() => setActiveTab('YARD')}
            className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'YARD'
                ? 'bg-[#ea580c] text-white border border-[#ea580c] shadow-[0_1px_4px_rgba(234,88,12,0.25)]'
                : 'bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] hover:bg-orange-100/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Yard ({counts.yard})</span>
          </button>
        )}
      </div>

      {/* 3. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode bahan, jenis kain, spesifikasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] focus:bg-white text-[#0f172a] transition-all"
          />
        </div>
        <div className="w-full sm:w-44">
          <select
            value={filterSatuan}
            onChange={(e) => setFilterSatuan(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Satuan</option>
            {BAHAN_SATUAN_OPTIONS.map((sat) => (
              <option key={sat} value={sat}>
                {sat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. TABEL BAHAN RINGKAS (KOLOM TERPADU, ANTI-SCROLL HORIZONTAL) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-12 border-r border-[#3b4c5e] text-white font-bold">NO</th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-[#3b4c5e] text-white font-bold">KODE & NAMA BAHAN</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-[#3b4c5e] text-white font-bold">SUPPLIER UTAMA</th>
                <th className="py-2.5 px-3 text-right min-w-[180px] border-r border-[#3b4c5e] text-white font-bold">HARGA & STOK</th>
                <th className="py-2.5 px-2 text-center w-20 text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredBahan.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Tidak ada bahan baku ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredBahan.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center text-slate-700 font-bold text-xs border-r border-slate-200/60">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60">
                      <div className="flex flex-col gap-0.5 items-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#0284c7]">
                            {item.kodeBahan}
                          </span>
                          {item.satuan && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                              {item.satuan}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-900 font-bold text-xs">
                            {item.namaBahan}
                          </span>
                        </div>
                        {item.keterangan && (
                          <p className="text-[10px] text-slate-500 font-normal">
                            {item.keterangan}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200/60 text-slate-800 font-semibold text-xs">
                      {item.supplier || '-'}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200/60">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Harga:</span>
                          <span className="font-mono font-bold text-slate-900">
                            Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Stok:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {Number(item.stok || 0).toLocaleString('id-ID')} {item.satuan}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="w-7 h-7 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Edit Bahan"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteBahanPrompt(item)}
                          className="w-7 h-7 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Hapus Bahan"
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

        <div className="px-3.5 py-2.5 bg-[#f8fafc] border-t border-[#cbd5e1] text-[11.5px] text-[#64748b] flex items-center justify-between">
          <div>
            Menampilkan <span className="font-bold text-[#0f172a]">{filteredBahan.length}</span> bahan baku kain
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT BAHAN */}
      {modalMode && (
        <FormModalBahan
          isOpen={Boolean(modalMode)}
          editingBahan={editingBahan}
          onClose={() => {
            setModalMode(null);
            setEditingBahan(null);
          }}
          onSave={handleSaveForm}
        />
      )}

    </div>
  );
}

// Sub-komponen Form Modal Bahan
function FormModalBahan({ isOpen, editingBahan, onClose, onSave }) {
  const [kodeBahan, setKodeBahan] = useState(editingBahan?.kodeBahan || '');
  const [namaBahan, setNamaBahan] = useState(editingBahan?.namaBahan || '');
  const [satuan, setSatuan] = useState(editingBahan?.satuan || 'Kg');
  const [supplier, setSupplier] = useState(editingBahan?.supplier || '');
  const [harga, setHarga] = useState(editingBahan?.harga ?? 0);
  const [stok, setStok] = useState(editingBahan?.stok ?? 0);
  const [keterangan, setKeterangan] = useState(editingBahan?.keterangan || '');
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!kodeBahan.trim()) errs.kodeBahan = 'Kode bahan wajib diisi';
    if (!namaBahan.trim()) errs.namaBahan = 'Nama bahan wajib diisi';
    if (Number(harga) < 0) errs.harga = 'Harga tidak boleh negatif';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      kodeBahan: kodeBahan.trim().toUpperCase(),
      namaBahan: namaBahan.trim(),
      satuan,
      supplier: supplier.trim(),
      harga: Number(harga),
      stok: Number(stok),
      keterangan: keterangan.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">
              {editingBahan ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Modal */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kode Bahan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={kodeBahan}
              onChange={(e) => setKodeBahan(e.target.value.toUpperCase())}
              placeholder="Contoh: BHN-001"
              className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                errors.kodeBahan
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-[#0284c7]'
              }`}
            />
            {errors.kodeBahan && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.kodeBahan}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Bahan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaBahan}
              onChange={(e) => setNamaBahan(e.target.value)}
              placeholder="Contoh: Fleece Hitam 280gsm"
              className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                errors.namaBahan
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-[#0284c7]'
              }`}
            />
            {errors.namaBahan && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.namaBahan}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan <span className="text-rose-500">*</span>
              </label>
              <select
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284c7] text-slate-800 cursor-pointer"
              >
                {BAHAN_SATUAN_OPTIONS.map((sat) => (
                  <option key={sat} value={sat}>
                    {sat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supplier Utama
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Contoh: CV Tekstil Priangan"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Terakhir / Satuan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                value={stok}
                onChange={(e) => setStok(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Karakteristik Kain
            </label>
            <textarea
              rows="2"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan tekstur, gramasi, atau kegunaan..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>

          {/* Footer Modal */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingBahan ? 'Simpan Perubahan' : 'Tambah Bahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
