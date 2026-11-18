import React, { useState, useMemo, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  Search,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  Package,
  Layers,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { Swal } from '../../utils/swal';

export default function PermintaanProduksiGudang({
  antreanList = [],
  setAntreanList,
  products = [],
  mutasiGudangJadiList = [],
  setMutasiGudangJadiList,
  onNavigateToMutasiGudang,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPrioritas, setFilterPrioritas] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State untuk Tambah Permintaan Baru oleh Gudang
  const [formData, setFormData] = useState({
    noAntrian: '',
    tglMasuk: new Date().toISOString().slice(0, 10),
    sumberPermintaan: 'Stok Gudang',
    noReff: '',
    selectedProductSku: '',
    qty: 50,
    prioritas: 'Normal',
    deadline: '',
    catatan: 'Permintaan restock persediaan gudang jadi.',
  });

  // Generate No Antrean Otomatis
  const generateNoReq = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `REQ-${yyyy}${mm}${dd}-${rand}`;
  };

  const handleOpenModal = () => {
    // Deadline default 7 hari ke depan
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const deadlineStr = d.toISOString().slice(0, 10);

    setFormData({
      noAntrian: generateNoReq(),
      tglMasuk: new Date().toISOString().slice(0, 10),
      sumberPermintaan: 'Stok Gudang',
      noReff: `RESTOCK-GDG-${new Date().getMonth() + 1}`,
      selectedProductSku: products.length > 0 ? products[0].sku : '',
      qty: 50,
      prioritas: 'Normal',
      deadline: deadlineStr,
      catatan: 'Permintaan restock persediaan gudang jadi siap jual.',
    });
    setIsModalOpen(true);
  };

  // Muat ulang antrean secara mandiri
  const refreshData = async () => {
    setLoading(true);
    try {
      const fresh = await api.getAntrean();
      if (Array.isArray(fresh) && setAntreanList) {
        setAntreanList(fresh);
      }
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Filter antrean khusus yang relevan dengan Gudang atau seluruh antrean
  const filteredList = useMemo(() => {
    return antreanList.filter((item) => {
      // Filter Status
      if (filterStatus === 'DIPROSES') {
        if (item.status === 'Selesai' || item.status === 'Menunggu Penerimaan Gudang') return false;
      } else if (filterStatus === 'SIAP_TERIMA') {
        if (item.status !== 'Menunggu Penerimaan Gudang' && item.status !== 'Selesai') return false;
      }

      // Filter Prioritas
      if (filterPrioritas && item.prioritas !== filterPrioritas) return false;

      // Filter Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const no = (item.noAntrian || '').toLowerCase();
        const reff = (item.noReff || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const nama = (item.namaProduk || '').toLowerCase();
        const varian = (item.varian || '').toLowerCase();
        if (!no.includes(q) && !reff.includes(q) && !sku.includes(q) && !nama.includes(q) && !varian.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [antreanList, filterStatus, filterPrioritas, searchTerm]);

  // Statistik KPI Permintaan Gudang
  const stats = useMemo(() => {
    const total = antreanList.length;
    const diproses = antreanList.filter(
      (a) => a.status !== 'Selesai' && a.status !== 'Menunggu Penerimaan Gudang'
    ).length;
    const siapTerima = antreanList.filter(
      (a) => a.status === 'Menunggu Penerimaan Gudang' || a.status === 'Proses Finishing'
    ).length;
    const selesai = antreanList.filter((a) => a.status === 'Selesai').length;
    const totalPcs = antreanList.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

    return { total, diproses, siapTerima, selesai, totalPcs };
  }, [antreanList]);

  // Submit Simpan Permintaan Baru ke Antrean Produksi
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.selectedProductSku) {
      Swal.fire('Peringatan', 'Silakan pilih model produk konveksi!', 'warning');
      return;
    }

    const selectedProd = products.find((p) => p.sku === formData.selectedProductSku) || {};

    const payload = {
      noAntrian: formData.noAntrian || generateNoReq(),
      tglMasuk: formData.tglMasuk,
      sumberPermintaan: formData.sumberPermintaan,
      noReff: formData.noReff || '-',
      sku: selectedProd.sku || formData.selectedProductSku,
      namaProduk: selectedProd.namaProduk || selectedProd.nama || '-',
      kategori: selectedProd.kategori || '-',
      varian: selectedProd.varian || 'Polos',
      ukuran: selectedProd.ukuran || 'All Size',
      skuBahan: selectedProd.skuBahan || '-',
      qty: Number(formData.qty) || 1,
      prioritas: formData.prioritas || 'Normal',
      status: 'Menunggu Cutting',
      deadline: formData.deadline || null,
      catatan: formData.catatan || '',
      kebutuhanBahan: [],
      totalBiayaBahan: 0,
      totalHpp: 0,
      hppPerPcs: 0,
    };

    try {
      const res = await api.createAntrean(payload);
      const newEntry = res?.id ? { ...payload, id: res.id } : { ...payload, id: Date.now() };

      if (setAntreanList) {
        setAntreanList((prev) => [newEntry, ...prev]);
      }

      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Permintaan Berhasil Dikirim!',
        text: `Nomor ${newEntry.noAntrian} (${newEntry.namaProduk} - ${newEntry.qty} Pcs) telah masuk ke Divisi Cutting untuk diproses.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem saat membuat permintaan.', 'error');
    }
  };

  // Helper Badge Status Tahapan Pabrik
  const getTahapBadge = (status) => {
    if (status === 'Menunggu Cutting') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          Menunggu Cutting (Di Divisi Cutting)
        </span>
      );
    }
    if (status === 'Proses Cutting' || status === 'Sedang Diproses') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
          Proses Cutting
        </span>
      );
    }
    if (status === 'Proses Jahit') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
          Proses Jahit
        </span>
      );
    }
    if (status === 'Proses QC') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
          Proses QC
        </span>
      );
    }
    if (status === 'Proses Finishing') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Proses Finishing
        </span>
      );
    }
    if (status === 'Menunggu Penerimaan Gudang') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">
          ★ Siap Diterima Gudang
        </span>
      );
    }
    if (status === 'Selesai') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          <span>Selesai di Rak</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        {status}
      </span>
    );
  };

  return (
    <div className="w-full space-y-2.5 select-none">
      {/* 1. TOP BANNER HEADER KHUSUS ADMIN GUDANG */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white rounded-xl p-3 sm:px-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Permintaan Produksi (Input Gudang)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-white/25 text-white text-[10px] font-black uppercase">
                Admin Gudang
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Input permintaan restock persediaan barang jadi atau pesanan klien langsung ke lini antrean produksi pabrik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3] text-amber-700" />
            <span>+ Buat Permintaan Produksi</span>
          </button>
        </div>
      </div>

      {/* 2. KPI RINGKASAN PERMINTAAN GUDANG */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Permintaan</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1 font-mono leading-none">
            {stats.total}{' '}
            <span className="text-xs font-medium text-slate-500 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Total {stats.totalPcs.toLocaleString('id-ID')} Pcs target
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-sky-700 uppercase tracking-wider flex items-center justify-between">
            <span>Sedang Dikerjakan</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-lg font-black text-sky-900 mt-1 font-mono leading-none">
            {stats.diproses}{' '}
            <span className="text-xs font-medium text-sky-600 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-sky-700 mt-0.5">
            Cutting, Jahit, QC, Finishing
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Siap Diterima Gudang</span>
            <Package className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-900 mt-1 font-mono leading-none">
            {stats.siapTerima}{' '}
            <span className="text-xs font-medium text-emerald-600 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">
            Finishing beres, siap masuk rak
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Selesai di Rak</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-800 mt-1 font-mono leading-none">
            {stats.selesai}{' '}
            <span className="text-xs font-medium text-slate-500 font-sans">Batch</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Sudah di rak gudang jadi
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR FILTER & SEARCH */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-amber-700 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('DIPROSES')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'DIPROSES'
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sedang Diproduksi ({stats.diproses})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('SIAP_TERIMA')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'SIAP_TERIMA'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Siap Diterima ({stats.siapTerima})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari No Req, Reff PO, SKU, Model Produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-amber-600 text-slate-800"
            />
          </div>

          <select
            value={filterPrioritas}
            onChange={(e) => setFilterPrioritas(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 text-slate-700 cursor-pointer"
          >
            <option value="">Semua Prioritas</option>
            <option value="Urgent">Urgent</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* 4. TABEL PERMINTAAN PRODUKSI OLEH GUDANG (STYLE ELEGAN & SOFT GRAY BORDER) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-10 border-r border-[#3b4c5e] text-white font-bold">
                  NO
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  NO. REQ & TGL
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  TUJUAN & REFF PO
                </th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-[#3b4c5e] text-white font-bold">
                  MODEL PRODUK (SKU & VARIAN)
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">
                  TARGET QTY
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[110px] border-r border-[#3b4c5e] text-white font-bold">
                  DEADLINE TARGET
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[140px] border-r border-[#3b4c5e] text-white font-bold">
                  STATUS DI PABRIK
                </th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[100px] text-white font-bold">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="font-medium text-slate-800 divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Warehouse className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-700">
                      Belum ada permintaan produksi
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik "+ Buat Permintaan Produksi" untuk mengajukan kebutuhan stok baru ke lini produksi
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isUrgent = item.prioritas === 'Urgent';
                  const isReadyForGudang =
                    item.status === 'Menunggu Penerimaan Gudang' || item.status === 'Selesai';

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                      {/* NO */}
                      <td className="py-2 px-2 text-center text-slate-600 font-bold font-mono border-r border-slate-200/60">
                        {idx + 1}
                      </td>

                      {/* NO REQ & TANGGAL */}
                      <td className="py-2 px-3 border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-xs text-[#0284c7]">
                            {item.noAntrian}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{item.tglMasuk}</span>
                          </div>
                        </div>
                      </td>

                      {/* TUJUAN & REFF PO */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.sumberPermintaan || 'Stok Gudang'}
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                            Reff: <strong>{item.noReff || '-'}</strong>
                          </span>
                        </div>
                      </td>

                      {/* MODEL PRODUK */}
                      <td className="py-2 px-3 border-r border-slate-200/60">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-extrabold text-[10px] text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 shrink-0">
                              {item.sku}
                            </span>
                            <span className="font-bold text-slate-900 text-xs truncate" title={item.namaProduk}>
                              {item.namaProduk}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200 text-[10px]">
                              {item.varian || 'Polos'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                              {item.ukuran || 'All Size'}
                            </span>
                            {item.catatan && (
                              <span className="text-slate-400 italic truncate max-w-xs text-[10px]">
                                • {item.catatan}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* TARGET QTY & PRIORITAS */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                            {Number(item.qty).toLocaleString('id-ID')}{' '}
                            <span className="text-[10px] font-medium text-slate-500 font-sans">Pcs</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {isUrgent && <Flame className="w-3 h-3 text-rose-600" />}
                            <span>{item.prioritas}</span>
                          </span>
                        </div>
                      </td>

                      {/* DEADLINE TARGET */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200/60 whitespace-nowrap">
                        <div className="flex flex-col items-center font-mono text-xs">
                          <span className="font-bold text-slate-800">
                            {item.deadline || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400">Target Masuk</span>
                        </div>
                      </td>

                      {/* STATUS DI PABRIK */}
                      <td className="py-2 px-3 text-center border-r border-slate-200/60 whitespace-nowrap">
                        {getTahapBadge(item.status)}
                      </td>

                      {/* AKSI */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Terima ke Gudang Jadi jika sudah selesai finishing */}
                          {item.status === 'Menunggu Penerimaan Gudang' && onNavigateToMutasiGudang && (
                            <button
                              type="button"
                              onClick={() => onNavigateToMutasiGudang(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Buka Mutasi Gudang Jadi untuk Penerimaan Rak"
                            >
                              <Package className="w-3 h-3" />
                              <span>Terima</span>
                            </button>
                          )}

                          {/* Tombol Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedItemDetail(item)}
                            className="w-7 h-7 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Lihat Detail Permintaan"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </button>

                          {/* Tombol Hapus (hanya jika belum mulai dipotong) */}
                          {item.status === 'Menunggu Cutting' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await Swal.confirm(
                                  'Batalkan Permintaan?',
                                  `Yakin ingin menghapus permintaan ${item.noAntrian} (${item.namaProduk})?`
                                );
                                if (res.isConfirmed) {
                                  try {
                                    await api.deleteAntrean(item.id);
                                    if (setAntreanList) {
                                      setAntreanList((prev) => prev.filter((a) => a.id !== item.id));
                                    }
                                    Swal.success('Terhapus', 'Permintaan produksi berhasil dibatalkan.');
                                  } catch (err) {
                                    Swal.fire('Gagal', err.message || 'Tidak dapat membatalkan permintaan', 'error');
                                  }
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Batalkan Permintaan (Hanya sebelum cutting)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SUMMARY FOOTER */}
        <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredList.length}</span> dari{' '}
            <span className="font-bold text-slate-900">{antreanList.length}</span> permintaan produksi
          </div>
          <div className="text-slate-400 text-[11px]">
            * Data tersinkronisasi otomatis dengan Antrean Produksi di Pabrik
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM: INPUT PERMINTAAN PRODUKSI BARU OLEH ADMIN GUDANG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0b1329] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black text-sm text-white">
                    Form Permintaan Produksi Baru (Gudang)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Otomatis mendaftarkan batch baru ke antrean kerja pabrik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* No Req & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Permintaan (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={formData.noAntrian}
                    readOnly
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-slate-100 font-mono font-bold text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Permintaan *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tglMasuk}
                    onChange={(e) => setFormData({ ...formData, tglMasuk: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Sumber & No Reff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tujuan Permintaan *
                  </label>
                  <select
                    value={formData.sumberPermintaan}
                    onChange={(e) => setFormData({ ...formData, sumberPermintaan: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="Stok Gudang">Restock Gudang Jadi</option>
                    <option value="Pesanan Pelanggan">Pesanan Pelanggan (PO)</option>
                    <option value="Sample / Uji Model">Sample / Uji Coba Model</option>
                    <option value="Toko / Marketplace">Persediaan Toko / Marketplace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Referensi / PO
                  </label>
                  <input
                    type="text"
                    placeholder="misal: PO-CLIENT-08 atau RESTOCK-BULANAN"
                    value={formData.noReff}
                    onChange={(e) => setFormData({ ...formData, noReff: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Pilih Model Produk */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Model Produk Konveksi *
                </label>
                <select
                  required
                  value={formData.selectedProductSku}
                  onChange={(e) => setFormData({ ...formData, selectedProductSku: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="">-- Pilih Produk / SKU --</option>
                  {products.map((p) => (
                    <option key={p.id || p.sku} value={p.sku}>
                      {p.sku} - {p.namaProduk || p.nama} ({p.varian || 'Polos'} - {p.ukuran || 'All Size'}) [Stok: {p.stok || 0} Pcs]
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Produk yang dipilih */}
              {formData.selectedProductSku && (
                (() => {
                  const curr = products.find((p) => p.sku === formData.selectedProductSku);
                  if (!curr) return null;
                  const stokVal = Number(curr.stok || 0);

                  return (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-amber-700" />
                          <span>{curr.namaProduk || curr.nama}</span>
                        </div>
                        <div className="text-[11px] text-amber-800 flex items-center gap-2">
                          <span>Kategori: {curr.kategori || '-'}</span>
                          <span>•</span>
                          <span>Warna: {curr.varian || '-'}</span>
                          <span>•</span>
                          <span>Size: {curr.ukuran || '-'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Sisa Stok Gudang Saat Ini:</span>
                        <span
                          className={`font-mono font-black text-sm px-2 py-0.5 rounded-md inline-block ${
                            stokVal > 20
                              ? 'bg-emerald-100 text-emerald-800'
                              : stokVal > 0
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {stokVal} Pcs
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Target Kuantitas & Prioritas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Kuantitas (Pcs) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: Math.max(1, Number(e.target.value)) })}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-amber-600"
                    />
                    {/* Shortcut Tombol Cepat */}
                    {[24, 50, 100].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setFormData({ ...formData, qty: quick })}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        +{quick}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tingkat Prioritas Pabrik *
                  </label>
                  <select
                    value={formData.prioritas}
                    onChange={(e) => setFormData({ ...formData, prioritas: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-600 cursor-pointer font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">🔥 Urgent (Prioritas Tinggi)</option>
                    <option value="Low">Low (Bisa Santai)</option>
                  </select>
                </div>
              </div>

              {/* Deadline Target Selesai */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Target Tanggal Selesai (Deadline Masuk Gudang)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Catatan Khusus untuk Tim Produksi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan SOP / Instruksi untuk Pabrik
                </label>
                <textarea
                  rows="2"
                  placeholder="mis: kemasan polybag satuan, sablon dada warna emas, dll..."
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Footer Tombol Simpan */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Kirim ke Pabrik Produksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL PERMINTAAN */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#0b1329] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-sm text-white">
                  Rincian Permintaan Produksi ({selectedItemDetail.noAntrian})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">No. Permintaan</span>
                  <strong className="text-slate-900 font-mono">{selectedItemDetail.noAntrian}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tanggal Pengajuan</span>
                  <strong className="text-slate-900 font-mono">{selectedItemDetail.tglMasuk}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tujuan & Reff</span>
                  <strong className="text-slate-900">{selectedItemDetail.sumberPermintaan} ({selectedItemDetail.noReff || '-'})</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Deadline Target</span>
                  <strong className="text-slate-900 font-mono">{selectedItemDetail.deadline || '-'}</strong>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Produk yang Diproduksi</span>
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedItemDetail.namaProduk}
                </div>
                <div className="text-slate-600 flex items-center gap-2">
                  <span>SKU: {selectedItemDetail.sku}</span>
                  <span>•</span>
                  <span>Varian: {selectedItemDetail.varian || 'Polos'}</span>
                  <span>•</span>
                  <span>Ukuran: {selectedItemDetail.ukuran || 'All Size'}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Jumlah Target Produksi:</span>
                  <strong className="font-mono text-base text-amber-700">
                    {Number(selectedItemDetail.qty).toLocaleString('id-ID')} Pcs
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-800 uppercase font-bold">Status Saat Ini di Pabrik</span>
                <div className="pt-1">{getTahapBadge(selectedItemDetail.status)}</div>
                {selectedItemDetail.catatan && (
                  <p className="text-[11px] text-amber-900 pt-1 italic">
                    Instruksi: "{selectedItemDetail.catatan}"
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
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

