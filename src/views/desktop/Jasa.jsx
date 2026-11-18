import React, { useState, useMemo } from 'react';
import {
  Wrench,
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
  Layers,
  Coins,
  FileSpreadsheet
} from 'lucide-react';
import { JASA_SATUAN_OPTIONS } from '../../constants/uiConstants';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function Jasa({ jasa = [], setJasa }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSatuan, setFilterSatuan] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [editingJasa, setEditingJasa] = useState(null);
  const [deleteJasa, setDeleteJasa] = useState(null);
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
      all: jasa.length,
      pcs: jasa.filter((j) => j.satuan === 'Pcs').length,
      titik: jasa.filter((j) => j.satuan === 'Titik').length,
      other: jasa.filter((j) => j.satuan !== 'Pcs' && j.satuan !== 'Titik').length,
    };
  }, [jasa]);

  // Filtering
  const filteredJasa = useMemo(() => {
    return jasa.filter((item) => {
      // Tab filter
      if (activeTab === 'PCS' && item.satuan !== 'Pcs') return false;
      if (activeTab === 'TITIK' && item.satuan !== 'Titik') return false;

      // Satuan dropdown
      if (filterSatuan && item.satuan !== filterSatuan) return false;

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchKode = item.kodeJasa?.toLowerCase().includes(query);
        const matchSku = item.sku?.toLowerCase().includes(query);
        const matchNama = item.namaJasa?.toLowerCase().includes(query);
        const matchKet = item.keterangan?.toLowerCase().includes(query);
        if (!matchKode && !matchSku && !matchNama && !matchKet) return false;
      }

      return true;
    });
  }, [jasa, activeTab, filterSatuan, searchTerm]);

  // Handlers CRUD
  const handleOpenCreate = () => {
    setEditingJasa(null);
    setModalMode('create');
  };

  const handleOpenEdit = (item) => {
    setEditingJasa(item);
    setModalMode('edit');
  };

  const handleSaveForm = (formData) => {
    if (modalMode === 'create') {
      const newItem = {
        ...formData,
        id: Date.now(),
      };
      setJasa((prev) => [...prev, newItem]);
      api.createJasa(newItem).catch((e) => console.warn('Gagal simpan jasa ke API:', e));
      Swal.success('Jasa Ditambahkan', `Tarif jasa "${formData.namaJasa}" berhasil disimpan.`);
    } else if (modalMode === 'edit' && editingJasa) {
      setJasa((prev) =>
        prev.map((j) => (j.id === editingJasa.id ? { ...j, ...formData } : j))
      );
      api.updateJasa(editingJasa.id, formData).catch((e) => console.warn('Gagal update jasa ke API:', e));
      Swal.success('Jasa Diperbarui', `Tarif jasa "${formData.namaJasa}" berhasil diperbarui.`);
    }
    setModalMode(null);
    setEditingJasa(null);
  };

  const handleDeleteJasaPrompt = async (item) => {
    const res = await Swal.confirm(
      'Hapus Tarif Jasa?',
      `Yakin ingin menghapus jasa "${item.namaJasa}" (${item.kodeJasa})?`
    );
    if (res.isConfirmed) {
      setJasa((prev) => prev.filter((j) => j.id !== item.id));
      api.deleteJasa(item.id).catch((e) => console.warn('Gagal hapus jasa dari API:', e));
      Swal.success('Terhapus!', `Jasa "${item.namaJasa}" berhasil dihapus.`);
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
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">
                Data Master Tarif & Jasa Konveksi
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[10px] font-extrabold">
                JASA
              </span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Kelola tarif upah kerja per pcs/titik (ongkos jahit, sablon, bordir, cutting, finishing)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => showToast('Data jasa berhasil dimuat ulang.')}
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
            <span>Tambah Jasa</span>
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
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Jasa ({counts.all})</span>
        </button>

        <button
          onClick={() => setActiveTab('PCS')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'PCS'
              ? 'bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]'
              : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Satuan Pcs ({counts.pcs})</span>
        </button>

        <button
          onClick={() => setActiveTab('TITIK')}
          className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'TITIK'
              ? 'bg-[#ea580c] text-white border border-[#ea580c] shadow-[0_1px_4px_rgba(234,88,12,0.25)]'
              : 'bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] hover:bg-orange-100/60'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Satuan Titik ({counts.titik})</span>
        </button>
      </div>

      {/* 3. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode jasa, SKU, nama jasa..."
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
            {JASA_SATUAN_OPTIONS.map((sat) => (
              <option key={sat} value={sat}>
                {sat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. TABEL JASA (EXACT REQUESTED COLUMNS: KODE JASA, SKU, NAMA JASA, QTY, HARGA, SATUAN) */}
      <div className="bg-white border-2 border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-800">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase border-b-2 border-slate-800">
                <th className="py-2.5 px-2.5 text-center w-12 border border-slate-800 text-white font-bold">NO</th>
                <th className="py-2.5 px-2.5 min-w-[130px] border border-slate-800 text-white font-bold">KODE JASA</th>
                <th className="py-2.5 px-2.5 min-w-[140px] border border-slate-800 text-white font-bold">SKU</th>
                <th className="py-2.5 px-2.5 min-w-[240px] border border-slate-800 text-white font-bold">NAMA JASA</th>
                <th className="py-2.5 px-2.5 text-center w-24 border border-slate-800 text-white font-bold">QTY</th>
                <th className="py-2.5 px-2.5 text-right min-w-[130px] border border-slate-800 text-white font-bold">HARGA</th>
                <th className="py-2.5 px-2.5 text-center w-24 border border-slate-800 text-white font-bold">SATUAN</th>
                <th className="py-2.5 px-2.5 text-center w-24 border border-slate-800 text-white font-bold">AKSI</th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-800">
              {filteredJasa.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 border border-slate-800">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Tidak ada jasa ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredJasa.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-800">
                    <td className="py-2 px-2 text-center text-slate-700 font-bold text-xs border border-slate-800">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 border border-slate-800">
                      <span className="font-mono font-bold text-xs text-[#0284c7]">
                        {item.kodeJasa}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 border border-slate-800">
                      <span className="font-mono text-xs text-slate-800 font-semibold">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-bold text-slate-900 text-xs border border-slate-800">
                      <div>{item.namaJasa}</div>
                      {item.keterangan && (
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {item.keterangan}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center font-bold text-slate-800 border border-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold">
                        {item.qty}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 text-xs border border-slate-800">
                      {formatRupiah(item.harga)}
                    </td>
                    <td className="py-2 px-2.5 text-center border border-slate-800">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[10.5px] font-bold">
                        {item.satuan}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-center border border-slate-800">
                      <div className="inline-flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="w-6 h-6 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="Edit Jasa"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteJasaPrompt(item)}
                          className="w-6 h-6 rounded bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="Hapus Jasa"
                        >
                          <Trash2 className="w-3 h-3" />
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
            Menampilkan <span className="font-bold text-[#0f172a]">{filteredJasa.length}</span> tarif & jasa konveksi
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT JASA */}
      {modalMode && (
        <FormModalJasa
          isOpen={Boolean(modalMode)}
          editingJasa={editingJasa}
          onClose={() => {
            setModalMode(null);
            setEditingJasa(null);
          }}
          onSave={handleSaveForm}
        />
      )}
    </div>
  );
}

// Sub-komponen Form Modal Jasa
function FormModalJasa({ isOpen, editingJasa, onClose, onSave }) {
  const [kodeJasa, setKodeJasa] = useState(editingJasa?.kodeJasa || '');
  const [sku, setSku] = useState(editingJasa?.sku || '');
  const [namaJasa, setNamaJasa] = useState(editingJasa?.namaJasa || '');
  const [qty, setQty] = useState(editingJasa?.qty ?? 1);
  const [harga, setHarga] = useState(editingJasa?.harga ?? 0);
  const [satuan, setSatuan] = useState(editingJasa?.satuan || 'Pcs');
  const [keterangan, setKeterangan] = useState(editingJasa?.keterangan || '');
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!kodeJasa.trim()) errs.kodeJasa = 'Kode jasa wajib diisi';
    if (!sku.trim()) errs.sku = 'SKU wajib diisi';
    if (!namaJasa.trim()) errs.namaJasa = 'Nama jasa wajib diisi';
    if (Number(qty) < 0) errs.qty = 'Qty tidak boleh negatif';
    if (Number(harga) < 0) errs.harga = 'Harga tidak boleh negatif';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      kodeJasa: kodeJasa.trim().toUpperCase(),
      sku: sku.trim().toUpperCase(),
      namaJasa: namaJasa.trim(),
      qty: Number(qty),
      harga: Number(harga),
      satuan,
      keterangan: keterangan.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">
              {editingJasa ? 'Edit Tarif & Data Jasa' : 'Tambah Jasa Baru'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Jasa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={kodeJasa}
                onChange={(e) => setKodeJasa(e.target.value.toUpperCase())}
                placeholder="Contoh: JS-JHT-003"
                className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                  errors.kodeJasa
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-[#0284c7]'
                }`}
              />
              {errors.kodeJasa && (
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.kodeJasa}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Contoh: SKU-JS-JHT03"
                className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                  errors.sku
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-300 focus:border-[#0284c7]'
                }`}
              />
              {errors.sku && (
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.sku}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Jasa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaJasa}
              onChange={(e) => setNamaJasa(e.target.value)}
              placeholder="Contoh: Jasa Pasang Kancing & Lubang Kancing"
              className={`w-full px-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                errors.namaJasa
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-300 focus:border-[#0284c7]'
              }`}
            />
            {errors.namaJasa && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.namaJasa}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qty Standar <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0284c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga (Rp) <span className="text-rose-500">*</span>
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
                Satuan <span className="text-rose-500">*</span>
              </label>
              <select
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284c7] text-slate-800 cursor-pointer"
              >
                {JASA_SATUAN_OPTIONS.map((sat) => (
                  <option key={sat} value={sat}>
                    {sat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Rincian Pekerjaan
            </label>
            <textarea
              rows="2"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan tambahan spesifikasi jasa..."
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
              <span>{editingJasa ? 'Simpan Perubahan' : 'Tambah Jasa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

