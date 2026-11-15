import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  Shirt,
  RefreshCw,
  Plus,
  Search,
  Layers,
  Eye,
  Edit3,
  Trash2,
  PackageOpen,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Upload,
  Box,
  Copy,
  Tag,
  Store,
  CheckCheck,
  Maximize2,
  Minimize2,
  Sparkles,
  QrCode,
} from "lucide-react";
import { api } from "../../services/api";
import { Swal } from "../../utils/swal";
import { HARGA_POTONG_MAP } from "../../constants/appConstants";
import {
  PRODUCT_SIZES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  BAHAN_OPTIONS,
} from "../../constants/productConstants";

export default function Produk({
  products: propProducts,
  setProducts: propSetProducts,
  categories: propCategories = [],
}) {
  const [localProducts, setLocalProducts] = useState([]);
  const products = propProducts || localProducts;
  const setProducts = propSetProducts || setLocalProducts;
  const categories = propCategories;

  // Filter States
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBahan, setFilterBahan] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUkuran, setFilterUkuran] = useState("");
  const [filterTipe, setFilterTipe] = useState("");
  const [filterToko, setFilterToko] = useState("");
  const [perPage, setPerPage] = useState("25");
  const [currentPage, setCurrentPage] = useState(1);

  // Checkbox Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [isManageSizesOpen, setIsManageSizesOpen] = useState(false);

  // Dynamic Sizes State
  const [sizes, setSizes] = useState([]);

  const loadSizes = async () => {
    try {
      const data = await api.getSizes();
      if (Array.isArray(data) && data.length > 0) {
        setSizes(data);
      }
    } catch (err) {
      console.warn("Gagal load sizes:", err);
    }
  };

  useEffect(() => {
    loadSizes();
  }, []);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Card & Tab Counts
  const counts = useMemo(() => {
    return {
      all: products.length,
      tersedia: products.filter((p) => (p.stok || 0) > 0).length,
      menipis: products.filter((p) => (p.stok || 0) > 0 && (p.stok || 0) <= 100)
        .length,
      habis: products.filter((p) => (p.stok || 0) === 0 || p.status === "Habis")
        .length,
      po: products.filter(
        (p) => p.status === "Produksi" || p.status === "Sample",
      ).length,
      ready: products.filter((p) => p.status === "Aktif").length,
    };
  }, [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (activeTab === "TERSEDIA" && (item.stok || 0) <= 0) return false;
      if (
        activeTab === "MENIPIS" &&
        ((item.stok || 0) === 0 || (item.stok || 0) > 100)
      )
        return false;
      if (
        activeTab === "HABIS" &&
        (item.stok || 0) > 0 &&
        item.status !== "Habis"
      )
        return false;
      if (
        activeTab === "PO" &&
        item.status !== "Produksi" &&
        item.status !== "Sample"
      )
        return false;
      if (activeTab === "READY" && item.status !== "Aktif") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          item.sku.toLowerCase().includes(q) ||
          item.skuBahan.toLowerCase().includes(q) ||
          item.namaProduk.toLowerCase().includes(q) ||
          item.varian.toLowerCase().includes(q) ||
          (item.kategori && item.kategori.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filterBahan && !item.skuBahan.includes(filterBahan)) return false;
      if (filterKategori && item.kategori !== filterKategori) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterUkuran) {
        const hasSize = Array.isArray(item.ukuran)
          ? item.ukuran.includes(filterUkuran)
          : item.ukuran === filterUkuran;
        if (!hasSize) return false;
      }

      return true;
    });
  }, [
    products,
    activeTab,
    searchTerm,
    filterBahan,
    filterKategori,
    filterStatus,
    filterUkuran,
  ]);

  // Pagination Logic
  const pageSize = Number(perPage) || 25;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, validCurrentPage, pageSize]);

  // Checkbox Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // CRUD Actions
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setModalMode("create");
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setModalMode("edit");
  };

  const handleSaveProduct = (formData) => {
    if (modalMode === "edit" && editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...formData, id: p.id } : p,
        ),
      );
      api
        .updateProduct(editingProduct.id, formData)
        .catch((e) => console.warn("Gagal update produk ke SQLite:", e));
      Swal.success(
        "Berhasil!",
        `Produk "${formData.namaProduk}" berhasil diperbarui.`,
      );
    } else {
      const newEntry = {
        ...formData,
        id: Date.now(),
      };
      setProducts((prev) => [newEntry, ...prev]);
      api
        .createProduct(formData)
        .catch((e) => console.warn("Gagal tambah produk ke SQLite:", e));
      Swal.success(
        "Berhasil!",
        `Produk "${formData.namaProduk}" (${formData.sku}) berhasil ditambahkan.`,
      );
    }
    setModalMode(null);
    setEditingProduct(null);
  };

  const handleDeleteProductPrompt = async (item) => {
    const res = await Swal.confirm(
      "Hapus Data Produk?",
      `Yakin ingin menghapus "${item.namaProduk}" (${item.sku})? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (res.isConfirmed) {
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      api
        .deleteProduct(item.id)
        .catch((e) => console.warn("Gagal hapus produk dari SQLite:", e));
      Swal.success(
        "Terhapus!",
        `Produk "${item.namaProduk}" berhasil dihapus.`,
      );
    }
  };

  // Badge Status Style Helper
  const getBadgeClass = (status) => {
    const found = PRODUCT_STATUSES.find((s) => s.value === status);
    return found
      ? found.badgeClass
      : "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="w-full space-y-2.5">
      {/* 1. HEADER CARD (PM HEADER STYLES) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg p-2.5 sm:px-4 shadow-[0_2px_4px_rgba(2,132,199,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight leading-tight">
                Data Induk Produk & Varian Stok
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[10px] font-extrabold">
                MASTER
              </span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Kelola data produk, SKU, varian, kategori, ukuran, dan status
              produksi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => showToast("Fitur import Excel/CSV siap digunakan.")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer border border-emerald-400/30"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Update SKU</span>
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

      {/* 3. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="relative lg:col-span-1 sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, Nama Produk, Varian..."
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
              {categories.map((cat) => (
                <option key={cat.id || cat.nama} value={cat.nama}>
                  {cat.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
            >
              <option value="">Semua Tipe</option>
              <option value="Single">Single</option>
              <option value="Setelan">Setelan</option>
              <option value="Paket">Paket</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
            >
              <option value="">Semua Order</option>
              {PRODUCT_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
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
              <option value="">Semua Stok</option>
              <option value="Aktif">Stok Tersedia</option>
              <option value="Habis">Stok Habis</option>
            </select>
          </div>

          <div>
            <select
              value={filterBahan}
              onChange={(e) => setFilterBahan(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
            >
              <option value="">Semua Bahan Kain</option>
              {BAHAN_OPTIONS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABEL PRODUK CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-[0_2px_6px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] font-bold text-[10px] tracking-wide uppercase border-b border-[#cbd5e1] divide-x divide-[#cbd5e1]">
                <th className="py-2 px-2 text-center w-10 border-r border-[#cbd5e1]">
                  NO
                </th>
                <th className="py-2 px-2.5 w-36 border-r border-[#cbd5e1]">
                  SKU & BAHAN
                </th>
                <th className="py-2 px-2.5 border-r border-[#cbd5e1]">
                  NAMA PRODUK
                </th>
                <th className="py-2 px-2.5 w-36 border-r border-[#cbd5e1]">
                  VARIAN & UKURAN
                </th>
                <th className="py-2 px-2.5 text-center w-32 border-r border-[#cbd5e1]">
                  HARGA
                </th>
                <th className="py-2 px-2 text-center w-28 border-r border-[#cbd5e1] bg-sky-50/60 text-[#0369a1]">
                  POTONG
                </th>
                <th className="py-2 px-2 text-center w-20 border-r border-[#cbd5e1] bg-slate-50">
                  STOK
                </th>
                <th className="py-2 px-2 text-center w-20 border-r border-[#cbd5e1]">
                  STATUS
                </th>
                <th className="py-2 px-2 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd5e1] font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <PackageOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">
                      Tidak ada produk ditemukan
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Coba ubah kata kunci pencarian atau filter
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item, index) => {
                  const globalIndex =
                    (validCurrentPage - 1) * pageSize + index + 1;
                  const catMatch = categories.find(
                    (c) => c.nama === item.kategori,
                  );
                  const hppVal =
                    item.hpp !== undefined &&
                    item.hpp !== null &&
                    Number(item.hpp) > 0
                      ? Number(item.hpp)
                      : Math.round(Number(item.harga || 0) * 0.7);
                  const hargaJualVal = Number(item.harga || 0);
                  const stokVal = Number(item.stok || 0);
                  const hargaPotongVal = Number(
                    item.hargaPotong !== undefined &&
                      item.hargaPotong !== null &&
                      Number(item.hargaPotong) > 0
                      ? item.hargaPotong
                      : catMatch && catMatch.hargaPotong
                        ? catMatch.hargaPotong
                        : HARGA_POTONG_MAP[item.kategori?.toUpperCase()] || 0,
                  );

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f1f5f9] transition-colors divide-x divide-[#cbd5e1]"
                    >
                      {/* NO */}
                      <td className="py-[2px] px-2 text-center text-[#64748b] font-semibold text-[11px]">
                        {globalIndex}
                      </td>

                      {/* SKU & BAHAN */}
                      <td className="py-[2px] px-2.5">
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="font-mono text-xs font-bold text-[#0284c7] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe] inline-block">
                            {item.sku}
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {item.skuBahan}
                          </span>
                        </div>
                      </td>

                      {/* NAMA PRODUK */}
                      <td className="py-[2px] px-2.5">
                        <div
                          className="font-bold text-[#0f172a] leading-snug text-xs truncate"
                          title={item.namaProduk}
                        >
                          {item.namaProduk}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          Kategori:{" "}
                          <span className="text-slate-600 font-medium">
                            {item.kategori}
                          </span>
                        </div>
                      </td>

                      {/* VARIAN & UKURAN */}
                      <td className="py-[2px] px-2.5">
                        <div className="flex flex-col gap-0.5 items-start">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-200 max-w-full truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                              style={{
                                backgroundColor: item.warnaHex || "#64748b",
                              }}
                            />
                            <span className="truncate">{item.varian}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-semibold pl-0.5">
                            Size:{" "}
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded font-bold border border-slate-200">
                              {Array.isArray(item.ukuran)
                                ? item.ukuran[0]
                                : item.ukuran}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* HARGA (JUAL & HPP) */}
                      <td className="py-[2px] px-2.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Jual:
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              Rp {hargaJualVal.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[10.5px]">
                            <span className="text-[10px] text-slate-400">
                              HPP:
                            </span>
                            <span className="font-mono font-medium text-slate-600">
                              Rp {hppVal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ONGKOS POTONG (KOLOM TERPISAH) */}
                      <td className="py-[2px] px-2 text-center bg-sky-50/20">
                        <span className="font-mono font-extrabold text-[11.5px] text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block shadow-2xs">
                          Rp {hargaPotongVal.toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* STOK GUDANG (KOLOM TERPISAH) */}
                      <td className="py-[2px] px-2 text-center">
                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded border inline-block shadow-2xs ${
                            stokVal > 20
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : stokVal > 0
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {stokVal.toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-[2px] px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-[2px] px-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewProduct(item)}
                            className="w-6 h-6 rounded bg-[#00a8cc] hover:bg-[#0091b3] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Lihat Detail Produk"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-6 h-6 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Edit Produk"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteProductPrompt(item)}
                            className="w-6 h-6 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3 h-3" />
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

        {/* FOOTER TABEL DENGAN PAGINATION DINAMIS */}
        <div className="px-3.5 py-2 bg-[#f8fafc] border-t border-[#cbd5e1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px] text-[#64748b]">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan{" "}
              <strong className="text-[#0f172a]">
                {filteredProducts.length === 0
                  ? 0
                  : (validCurrentPage - 1) * pageSize + 1}{" "}
                -{" "}
                {Math.min(validCurrentPage * pageSize, filteredProducts.length)}
              </strong>{" "}
              dari{" "}
              <strong className="text-[#0f172a]">
                {filteredProducts.length}
              </strong>{" "}
              data produk
            </span>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[11px] text-slate-400">Tampilkan:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 text-xs bg-white border border-[#cbd5e1] rounded text-slate-700 font-bold cursor-pointer"
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                validCurrentPage <= 1
                  ? "border-[#cbd5e1] bg-white text-slate-400 cursor-not-allowed"
                  : "border-[#cbd5e1] bg-white text-[#334155] hover:bg-slate-100 cursor-pointer"
              }`}
            >
              Sebelumnya
            </button>

            {/* Tombol Halaman */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - validCurrentPage) <= 2,
              )
              .map((p, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && p - prevPage > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`px-2.5 py-1 rounded border text-xs font-bold transition-colors cursor-pointer ${
                        validCurrentPage === p
                          ? "border-[#0284c7] bg-[#0284c7] text-white shadow-2xs"
                          : "border-[#cbd5e1] bg-white text-[#334155] hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                validCurrentPage >= totalPages
                  ? "border-[#cbd5e1] bg-white text-slate-400 cursor-not-allowed"
                  : "border-[#cbd5e1] bg-white text-[#334155] hover:bg-slate-100 cursor-pointer"
              }`}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT PRODUK */}
      {modalMode && (
        <FormModalProduk
          isOpen={Boolean(modalMode)}
          editingProduct={editingProduct}
          categories={categories}
          sizes={sizes}
          onOpenManageSizes={() => setIsManageSizesOpen(true)}
          onClose={() => {
            setModalMode(null);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {/* 5.1 MODAL KELOLA MASTER UKURAN DINAMIS */}
      {isManageSizesOpen && (
        <ManageSizesModal
          sizes={sizes}
          onClose={() => setIsManageSizesOpen(false)}
          onRefreshSizes={loadSizes}
        />
      )}

      {/* 6. MODAL LIHAT DETAIL PRODUK */}
      {viewProduct && (
        <DetailModalProduk
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          getBadgeClass={getBadgeClass}
        />
      )}

      {/* 7. MODAL KONFIRMASI HAPUS PRODUK */}
      {deleteProduct && (
        <DeleteModalProduk
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* 8. NOTIFIKASI TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

// Sub-komponen Modal Form Fullscreen & Simple Menarik
function FormModalProduk({
  isOpen,
  editingProduct,
  onClose,
  onSave,
  categories = [],
  sizes = [],
  onOpenManageSizes,
}) {
  const [formData, setFormData] = useState({
    sku: editingProduct?.sku || `PRD-${Math.floor(100 + Math.random() * 900)}`,
    skuBahan: editingProduct?.skuBahan || "BHN-CT30S-BLK",
    namaProduk: editingProduct?.namaProduk || "",
    kategori:
      editingProduct?.kategori || categories[0]?.nama || "Kaos / T-Shirt",
    varian: editingProduct?.varian || "Hitam Solid",
    warnaHex: editingProduct?.warnaHex || "#111827",
    ukuran:
      typeof editingProduct?.ukuran === "string"
        ? editingProduct.ukuran
        : editingProduct?.ukuran?.[0] || "L",
    status: editingProduct?.status || "Aktif",
    harga: editingProduct?.harga || 0,
    hpp:
      editingProduct?.hpp !== undefined && editingProduct?.hpp !== null
        ? editingProduct.hpp
        : 0,
    hargaPotong:
      editingProduct?.hargaPotong !== undefined &&
      editingProduct?.hargaPotong !== null &&
      Number(editingProduct.hargaPotong) > 0
        ? editingProduct.hargaPotong
        : categories.find(
            (c) => c.nama === (editingProduct?.kategori || categories[0]?.nama),
          )?.hargaPotong ||
          HARGA_POTONG_MAP[
            (editingProduct?.kategori || categories[0]?.nama)?.toUpperCase()
          ] ||
          0,
    stok: editingProduct?.stok || 0,
  });

  if (!isOpen) return null;

  const quickColors = [
    { name: "Hitam", hex: "#111827" },
    { name: "Putih", hex: "#ffffff" },
    { name: "Navy", hex: "#1e3a8a" },
    { name: "Sage", hex: "#84a98c" },
    { name: "Maroon", hex: "#7f1d1d" },
    { name: "Khaki", hex: "#a3825a" },
    { name: "Army", hex: "#365314" },
    { name: "Abu", hex: "#64748b" },
  ];

  const handleSelectSize = (sz) => {
    setFormData((prev) => ({
      ...prev,
      ukuran: sz,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.sku || !formData.namaProduk) {
      alert("SKU dan Nama Produk wajib diisi!");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-2xs animate-fade-in font-sans">
      <div className="bg-[#f8fafc] border border-slate-300 rounded-xl shadow-2xl flex flex-col w-full h-[96vh] max-w-[1300px] overflow-hidden text-slate-800">
        {/* ================================================================= */}
        {/* TOP BAR / BANNER HEADER (COMPACT DARK BLUE THEME) */}
        {/* ================================================================= */}
        <div className="h-9 px-3.5 bg-[#0b1b36] text-white flex items-center justify-between shrink-0 select-none border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <Box className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <h2 className="text-xs font-bold text-white tracking-wide truncate">
              {editingProduct
                ? "Edit Data Master Produk"
                : "Tambah Data Master Produk Baru"}
            </h2>
            <span className="hidden md:inline-block text-[11px] text-slate-400 truncate">
              • Kelola spesifikasi SKU, bahan kain, varian warna, ukuran dan
              live preview
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup (Batal)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* SCROLLABLE FORM BODY (2-COLUMN SIMPLE & ATTRACTIVE) */}
        {/* ================================================================= */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-3.5 space-y-3 bg-[#f1f5f9]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* =============================================================== */}
            {/* KOLOM KIRI: IDENTITAS PRODUK & SKU */}
            {/* =============================================================== */}
            <div className="bg-white border border-[#bfdbfe] rounded-lg p-3 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0369a1] uppercase tracking-wide border-b border-slate-100 pb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                <span>1. IDENTITAS & SKU PRODUK</span>
              </div>

              {/* Grid SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    SKU Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sku: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="misal: PRD-TSH-001"
                    className="w-full h-7 px-2 text-xs font-mono font-bold bg-[#eff6ff] border border-[#bfdbfe] rounded text-[#0369a1] focus:outline-none focus:border-[#0284c7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    SKU Bahan Kain <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.skuBahan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skuBahan: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="misal: BHN-CT30S-BLK"
                    className="w-full h-7 px-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaProduk}
                  onChange={(e) =>
                    setFormData({ ...formData, namaProduk: e.target.value })
                  }
                  placeholder="misal: Kaos Polos Cotton Combed 30s Premium"
                  className="w-full h-7 px-2 text-xs font-semibold bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Kategori Produk
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => {
                      const selectedCat = e.target.value;
                      const catObj = categories.find(
                        (c) => c.nama === selectedCat,
                      );
                      setFormData({
                        ...formData,
                        kategori: selectedCat,
                        hargaPotong:
                          catObj?.hargaPotong !== undefined &&
                          catObj.hargaPotong > 0
                            ? catObj.hargaPotong
                            : HARGA_POTONG_MAP[selectedCat?.toUpperCase()] ||
                              formData.hargaPotong,
                      });
                    }}
                    className="w-full h-7 px-2 text-xs font-medium bg-white border border-slate-300 rounded focus:outline-none focus:border-[#0284c7] cursor-pointer text-slate-800"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id || cat.nama} value={cat.nama}>
                        {cat.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Status Produksi / Stok
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full h-7 px-2 text-xs font-bold bg-white border border-slate-300 rounded focus:outline-none focus:border-[#0284c7] cursor-pointer text-slate-800"
                  >
                    {PRODUCT_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Potong, HPP, Harga Jual & Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Harga Potong / Pcs (@Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-[11px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.hargaPotong}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hargaPotong: Number(e.target.value),
                        })
                      }
                      className="w-full h-7 pl-8 pr-2 text-xs font-mono font-bold bg-sky-50 border border-sky-300 rounded text-sky-900 focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Harga HPP / Modal (@Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-[11px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.hpp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hpp: Number(e.target.value),
                        })
                      }
                      className="w-full h-7 pl-8 pr-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Harga Jual Standar (@Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-[11px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.harga}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          harga: Number(e.target.value),
                        })
                      }
                      className="w-full h-7 pl-8 pr-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Stok Gudang (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={(e) =>
                      setFormData({ ...formData, stok: Number(e.target.value) })
                    }
                    className="w-full h-7 px-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* KOLOM KANAN: VARIAN WARNA, UKURAN & LIVE CARD PREVIEW */}
            {/* =============================================================== */}
            <div className="space-y-3">
              {/* Card Varian & Ukuran */}
              <div className="bg-white border border-[#bfdbfe] rounded-lg p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0369a1] uppercase tracking-wide border-b border-slate-100 pb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                  <span>2. VARIAN WARNA & PILIHAN UKURAN</span>
                </div>

                {/* Varian Warna & Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Varian Warna / Motif
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.varian}
                      onChange={(e) =>
                        setFormData({ ...formData, varian: e.target.value })
                      }
                      placeholder="misal: Hitam Solid, Navy Blue, Sage"
                      className="w-full h-7 px-2 text-xs font-semibold bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#0284c7]"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="color"
                        value={formData.warnaHex}
                        onChange={(e) =>
                          setFormData({ ...formData, warnaHex: e.target.value })
                        }
                        className="w-7 h-7 rounded border border-slate-300 p-0.5 bg-white cursor-pointer"
                        title="Pilih Warna Hex"
                      />
                    </div>
                  </div>

                  {/* Quick Color Swatches */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Pintas warna:
                    </span>
                    {quickColors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            varian:
                              prev.varian && prev.varian !== "Hitam Solid"
                                ? prev.varian
                                : c.name,
                            warnaHex: c.hex,
                          }))
                        }
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name} (${c.hex})`}
                      />
                    ))}
                  </div>
                </div>

                {/* Pilihan Ukuran Dinamis (Master Database) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>Pilihan Ukuran Utama (Klik Size):</span>
                    </label>
                    <button
                      type="button"
                      onClick={onOpenManageSizes}
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0284c7] hover:text-[#0369a1] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                      title="Tambah, edit atau hapus ukuran di master"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Kelola Ukuran</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1 p-1.5 bg-slate-50/80 rounded-lg border border-slate-200">
                    {(sizes.length > 0
                      ? sizes.map((s) => s.nama || s)
                      : PRODUCT_SIZES
                    ).map((sz) => {
                      const isSelected = formData.ukuran === sz;
                      return (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => handleSelectSize(sz)}
                          className={`px-2.5 h-6 rounded text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#0284c7] text-white shadow-xs"
                              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LIVE PRODUCT PREVIEW CARD (MENARIK & VISUAL REALTIME) */}
              <div className="bg-gradient-to-br from-[#0c1a30] to-[#1e293b] rounded-lg p-3 text-white border border-slate-700 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-700/80 pb-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Preview Kartu Produk</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[9.5px]">
                    {formData.sku || "PRD-XXX"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 border-2 border-white/30 shadow-xs flex items-center justify-center text-white font-extrabold text-xs"
                    style={{ backgroundColor: formData.warnaHex || "#111827" }}
                  >
                    <Shirt className="w-5 h-5 drop-shadow-sm opacity-90" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
                      {formData.namaProduk || "Nama Produk Belum Diisi"}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10.5px]">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {formData.kategori}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-sky-900/60 border border-sky-700 text-sky-200 font-bold">
                        Varian: {formData.varian || "Polos"}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                        Size: {formData.ukuran}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-medium">
                      Harga / Pcs
                    </div>
                    <div className="font-mono font-bold text-xs text-emerald-400">
                      Rp {Number(formData.harga || 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      Stok:{" "}
                      <strong className="text-white">
                        {formData.stok || 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BOTTOM BAR (SUMMARY & ACTION BUTTONS) */}
          {/* ================================================================= */}
          <div className="mt-auto pt-2 bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="text-[11.5px] text-slate-500 font-medium">
              Mode:{" "}
              <strong className="text-slate-800">
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </strong>{" "}
              • SKU:{" "}
              <strong className="font-mono text-[#0284c7]">
                {formData.sku}
              </strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 h-7 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 h-7 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {editingProduct ? "Simpan Perubahan" : "Simpan Produk"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-komponen Modal Detail Produk (Modern Emerald Konveksi Glassmorphism)
function DetailModalProduk({ product, onClose, getBadgeClass }) {
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  // Auto detect warna swatch hex jika belum terisi
  const getColorHex = (varian, defaultHex) => {
    if (defaultHex && defaultHex !== "#64748b" && defaultHex !== "")
      return defaultHex;
    const v = (varian || "").toLowerCase();
    if (v.includes("hitam")) return "#18181b";
    if (v.includes("putih") || v.includes("bw")) return "#ffffff";
    if (v.includes("burgundy")) return "#701a35";
    if (v.includes("maroon")) return "#881337";
    if (v.includes("navy")) return "#1e3a8a";
    if (v.includes("emerald") || v.includes("jotol")) return "#065f46";
    if (v.includes("khaki") || v.includes("sand")) return "#d4b996";
    if (v.includes("tanah") || v.includes("choco")) return "#78350f";
    if (v.includes("milo") || v.includes("cookies")) return "#92400e";
    if (v.includes("denim") || v.includes("jeans")) return "#2563eb";
    if (v.includes("dove") || v.includes("taupe")) return "#a8a29e";
    if (v.includes("dusty") || v.includes("pink") || v.includes("baby"))
      return "#ec4899";
    if (v.includes("wood") || v.includes("walnut") || v.includes("mahogany"))
      return "#543310";
    if (v.includes("machito") || v.includes("caramel")) return "#b45309";
    if (v.includes("grey") || v.includes("darkgrey") || v.includes("charcoal"))
      return "#475569";
    if (v.includes("lavender") || v.includes("mauve")) return "#9333ea";
    if (v.includes("peach") || v.includes("biskuit")) return "#f97316";
    return defaultHex || "#0284c7";
  };

  const swatchColor = getColorHex(product.varian, product.warnaHex);
  const hargaPotong = Number(product.hargaPotong || product.harga_potong || 0);
  const hargaJual = Number(product.harga || 0);
  const hppVal = Number(product.hpp || 0);
  const stokVal = Number(product.stok || 0);

  const handleCopySku = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(product.sku);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm text-xs animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-emerald-100 overflow-hidden relative">
        {/* 1. HEADER MEWAH GRADASI EMERALD */}
        <div className="relative bg-gradient-to-br from-[#064e3b] via-[#046a52] to-[#0f766e] text-white px-6 pt-5 pb-6 overflow-hidden">
          {/* Subtle background glow circle */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-100 mb-2">
                <Shirt className="w-3 h-3 text-emerald-300" />
                <span>SPESIFIKASI MASTER PRODUK</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-300" />
                <h3 className="font-mono font-black text-lg tracking-wider text-white drop-shadow-xs">
                  {product.sku}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xs"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. BODY KONTEN */}
        <div className="p-6 space-y-4 -mt-3 relative z-10 bg-white rounded-t-3xl shadow-sm">
          {/* Identitas Produk & Kategori */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 border-white shrink-0 relative overflow-hidden"
                style={{ backgroundColor: swatchColor }}
              >
                <Shirt
                  className="w-7 h-7"
                  style={{
                    color: swatchColor === "#ffffff" ? "#0f172a" : "#ffffff",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-block mb-1">
                  Kategori {product.kategori}
                </span>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {product.namaProduk}
                </h2>
                <p className="text-slate-400 font-medium text-[11px] mt-0.5">
                  Model Garment Konveksi
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                STATUS
              </span>
              <span
                className={`font-bold text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${
                  product.status === "Aktif"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    product.status === "Aktif"
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                {product.status || "Aktif"}
              </span>
            </div>
          </div>

          {/* Varian Warna & Ukuran */}
          <div className="grid grid-cols-2 gap-3">
            {/* Box Warna */}
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl shadow-xs border-2 border-white shrink-0"
                style={{ backgroundColor: swatchColor }}
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Warna Varian
                </span>
                <span className="font-extrabold text-slate-800 text-xs truncate block mt-0.5">
                  {product.varian || "-"}
                </span>
              </div>
            </div>

            {/* Box Ukuran */}
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                SZ
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ukuran SKU
                </span>
                <span className="font-extrabold text-teal-900 text-xs truncate block mt-0.5">
                  {Array.isArray(product.ukuran)
                    ? product.ukuran.join(", ")
                    : product.ukuran || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* 4 KARTU METRIK FINANSIAL & STOK (ELEGAN & JELAS) */}
          <div>
            <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
              Tarif Biaya & Stok Fisik
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Tarif Ongkos Potong */}
              <div className="p-3 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-50/50 border border-sky-200/80 text-center shadow-xs">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-sky-700 mb-1">
                  <span>Ongkos Potong</span>
                </div>
                <div className="font-mono font-black text-sm text-sky-950">
                  Rp {hargaPotong.toLocaleString("id-ID")}
                </div>
                <span className="text-[9.5px] text-sky-600/80 font-medium">
                  Per Pcs
                </span>
              </div>

              {/* 2. Estimasi HPP */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 mb-1">
                  HPP Produk
                </div>
                <div className="font-mono font-extrabold text-sm text-slate-800">
                  Rp {hppVal.toLocaleString("id-ID")}
                </div>
                <span className="text-[9.5px] text-slate-400 font-medium">
                  Modal Pokok
                </span>
              </div>

              {/* 3. Harga Jual Pasar */}
              <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-50 to-indigo-50/50 border border-purple-200/80 text-center shadow-xs">
                <div className="text-[10px] font-bold text-purple-700 mb-1">
                  Harga Jual
                </div>
                <div className="font-mono font-black text-sm text-purple-950">
                  Rp {hargaJual.toLocaleString("id-ID")}
                </div>
                <span className="text-[9.5px] text-purple-600/80 font-medium">
                  Harga Konsumen
                </span>
              </div>

              {/* 4. Stok Fisik Gudang */}
              <div
                className={`p-3 rounded-2xl border text-center shadow-xs ${
                  stokVal > 0
                    ? "bg-gradient-to-b from-emerald-50 to-teal-50/50 border-emerald-200/80 text-emerald-950"
                    : "bg-rose-50/60 border-rose-200/80 text-rose-950"
                }`}
              >
                <div
                  className={`text-[10px] font-bold mb-1 ${
                    stokVal > 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  Stok Gudang
                </div>
                <div className="font-mono font-black text-sm">
                  {stokVal.toLocaleString("id-ID")}{" "}
                  <span className="text-[10px] font-normal">Pcs</span>
                </div>
                <span
                  className={`text-[9.5px] font-semibold ${
                    stokVal > 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {stokVal > 0 ? "Tersedia" : "Stok Kosong"}
                </span>
              </div>
            </div>
          </div>

          {/* Informasi Bahan Baku Kain */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-2xs">
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Material & Bahan Baku
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {product.skuBahan || "Belum Dipetakan"}
                </span>
              </div>
            </div>
            <span className="text-[10.5px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              Kain Utama
            </span>
          </div>
        </div>

        {/* 3. FOOTER AKSI */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleCopySku}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700 font-black">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin SKU</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#054338] hover:to-[#03694f] active:scale-95 text-white font-extrabold rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-komponen Modal Hapus
function DeleteModalProduk({ product, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs text-xs">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">
          Hapus Data Produk?
        </h4>
        <p className="text-slate-500 mt-1 mb-4 leading-relaxed">
          Apakah Anda yakin ingin menghapus{" "}
          <span className="font-bold text-slate-700">{product.namaProduk}</span>{" "}
          ({product.sku})?
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(product.id)}
            className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-komponen Modal Kelola Ukuran Dinamis (Tambah, Edit, Hapus)
function ManageSizesModal({ sizes = [], onClose, onRefreshSizes }) {
  const [newSizeName, setNewSizeName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddSize = async (e) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await api.createSize({ nama: newSizeName.trim() });
      setNewSizeName("");
      await onRefreshSizes();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menambah ukuran");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (size) => {
    setEditingId(size.id);
    setEditingName(size.nama);
    setErrorMsg("");
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await api.updateSize(id, { nama: editingName.trim() });
      setEditingId(null);
      await onRefreshSizes();
    } catch (err) {
      setErrorMsg(err.message || "Gagal mengubah ukuran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus ukuran "${nama}" dari daftar master?`)) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await api.deleteSize(id);
      await onRefreshSizes();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menghapus ukuran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs text-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#064e3b] to-[#047857] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200 border border-white/20">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide">
                Kelola Master Ukuran Produk
              </h3>
              <p className="text-[10.5px] text-emerald-100/80">
                Tambah, ubah nama, dan hapus pilihan ukuran secara dinamis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Form Tambah Ukuran */}
          <form
            onSubmit={handleAddSize}
            className="bg-slate-50 p-3 rounded-2xl border border-slate-200"
          >
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              + Tambah Ukuran Baru
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                placeholder="misal: JUMBO XXL, SETELAN M, OVERSIZE..."
                className="flex-1 h-8 px-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 uppercase"
              />
              <button
                type="submit"
                disabled={loading || !newSizeName.trim()}
                className="px-4 h-8 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Tambah</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </form>

          {/* List Ukuran Terdaftar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Daftar Ukuran Aktif ({sizes.length} Ukuran)
              </span>
              <span className="text-[10px] text-slate-400 italic">
                Klik tombol edit atau hapus di samping ukuran
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-72 overflow-y-auto">
              {sizes.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <PackageOpen className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="font-semibold text-xs">
                    Belum ada ukuran tersimpan
                  </p>
                </div>
              ) : (
                sizes.map((s) => {
                  const isEditingThis = editingId === s.id;
                  return (
                    <div
                      key={s.id}
                      className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-2"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 h-7 px-2 border border-emerald-500 rounded-lg text-xs font-bold uppercase focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(s.id)}
                            className="px-2.5 h-7 bg-emerald-600 text-white rounded-lg font-bold text-[10.5px] hover:bg-emerald-700 cursor-pointer"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 h-7 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10.5px] hover:bg-slate-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-black text-xs tracking-wide">
                              {s.nama}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(s)}
                              className="w-7 h-7 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Ubah Nama Ukuran"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id, s.nama)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus Ukuran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer shadow-xs active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
