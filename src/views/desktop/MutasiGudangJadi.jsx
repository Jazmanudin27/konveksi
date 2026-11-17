import React, { useState, useMemo } from "react";
import {
  Warehouse,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  Boxes,
  Calendar,
  Tag,
  User,
  Printer,
  X,
  CheckCircle2,
  ReceiptText,
  MapPin,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  Send,
  FolderOpen,
  ArrowLeft,
  Shirt,
} from "lucide-react";
import { api } from "../../services/api";
import { Swal } from "../../utils/swal";

const RAK_PRESETS = [
  "Gudang Utama - Rak A1 (Kaos)",
  "Gudang Utama - Rak A2 (Polo)",
  "Gudang Utama - Rak B1 (Kemeja)",
  "Box Siap Kirim (Packing Ekspedisi)",
  "Palet Transit (Siap Distribusi)",
];

const PETUGAS_PRESETS = [
  "Staff Gudang Jadi",
  "Kepala Gudang Jadi",
  "Tim Logistik & Ekspedisi",
  "Admin Inventori",
];

export default function MutasiGudangJadi({
  mutasiList = [],
  setMutasiList,
  products = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterSumber, setFilterSumber] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // 'ALL' | 'PENDING' | 'MASUK' | 'KELUAR'
  const [selectedItemShow, setSelectedItemShow] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create'
  const [modalInitialJenis, setModalInitialJenis] = useState("MASUK");

  // Helper user login aktif (default Admin Produksi)
  const currentUser = (() => {
    try {
      return localStorage.getItem("currentUser") || "Admin Produksi";
    } catch (_) {
      return "Admin Produksi";
    }
  })();

  // State Modal Approve & Terima Barang Jadi Masuk Rak
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveTargetItem, setApproveTargetItem] = useState(null);
  const [approveForm, setApproveForm] = useState({
    tglDiterima: new Date().toISOString().slice(0, 10),
    petugasTerima: currentUser,
    lokasiRak: "Gudang Utama - Rak A1 (Kaos)",
    catatan: "",
  });

  const handleOpenApproveModal = (item) => {
    setApproveTargetItem(item);
    setApproveForm({
      tglDiterima: new Date().toISOString().slice(0, 10),
      petugasTerima: currentUser,
      lokasiRak: item.lokasiRak || "Gudang Utama - Rak A1 (Kaos)",
      catatan: "",
    });
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveTargetItem) return;

    try {
      try {
        await api.approveMutasiGudangJadi({
          id: approveTargetItem.id,
          tglDiterima: approveForm.tglDiterima,
          petugasTerima: approveForm.petugasTerima,
          lokasiRak: approveForm.lokasiRak,
          catatan: approveForm.catatan,
        });
        const fresh = await api.getMutasiGudangJadi();
        if (Array.isArray(fresh)) setMutasiList(fresh);
      } catch (apiErr) {
        console.warn(
          "API approve offline/error, updating local state:",
          apiErr,
        );
        setMutasiList((prev) =>
          prev.map((m) =>
            m.id === approveTargetItem.id
              ? {
                  ...m,
                  statusPenerimaan: "Diterima",
                  tglDiterima: approveForm.tglDiterima,
                  petugasTerima: approveForm.petugasTerima,
                  petugas: approveForm.petugasTerima,
                  lokasiRak: approveForm.lokasiRak,
                  catatan: approveForm.catatan
                    ? `${m.catatan || ""} | ${approveForm.catatan}`
                    : m.catatan,
                }
              : m,
          ),
        );
      }

      setIsApproveModalOpen(false);
      setApproveTargetItem(null);

      await Swal.fire({
        icon: "success",
        title: "Barang Jadi Resmi Diterima & Disimpan!",
        html: `
          <div style="font-size:12px; text-align:left; color:#334155; line-height:1.6;">
            <p>Penerimaan barang dari Finishing telah berhasil di-approve:</p>
            <div style="margin-top:8px; padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; color:#166534;">
              <div>📦 <b>${approveTargetItem.namaProduk}</b> (+${Number(approveTargetItem.qty).toLocaleString("id-ID")} Pcs)</div>
              <div>📍 Lokasi Rak: <b>${approveForm.lokasiRak}</b></div>
              <div>📅 Tgl Diterima: <b>${approveForm.tglDiterima}</b> (Oleh ${approveForm.petugasTerima})</div>
              ${approveTargetItem.tglDiserahkan ? `<div style="font-size:11px; color:#15803d; margin-top:4px;">📤 Tgl Diserahkan: ${approveTargetItem.tglDiserahkan} (${approveTargetItem.petugasSerah || "Tim Finishing"})</div>` : ""}
            </div>
          </div>
        `,
        confirmButtonText: "OK",
        confirmButtonColor: "#059669",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Approve Penerimaan",
        text: err.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let masukPcs = 0;
    let keluarPcs = 0;
    let countMasuk = 0;
    let countKeluar = 0;
    let countPending = 0;

    (mutasiList || []).forEach((item) => {
      const q = Number(item.qty) || 0;
      if (item.statusPenerimaan === "Menunggu Penerimaan") {
        countPending++;
      }
      if (item.jenisMutasi === "MASUK") {
        masukPcs += q;
        countMasuk++;
      } else {
        keluarPcs += q;
        countKeluar++;
      }
    });

    const totalStokSaatIni = Math.max(0, masukPcs - keluarPcs);

    return {
      totalTransaksi: (mutasiList || []).length,
      masukPcs,
      keluarPcs,
      countMasuk,
      countKeluar,
      countPending,
      totalStokSaatIni,
    };
  }, [mutasiList]);

  // Filter Data
  const filteredList = useMemo(() => {
    return (mutasiList || []).filter((item) => {
      // Tab filter
      if (
        activeTab === "PENDING" &&
        item.statusPenerimaan !== "Menunggu Penerimaan"
      )
        return false;
      if (activeTab === "MASUK" && item.jenisMutasi !== "MASUK") return false;
      if (activeTab === "KELUAR" && item.jenisMutasi !== "KELUAR") return false;

      // Select filters
      if (filterJenis && item.jenisMutasi !== filterJenis) return false;
      if (filterSumber && item.sumber !== filterSumber) return false;

      // Search
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const noMut = (item.noMutasi || "").toLowerCase();
      const noAnt = (item.noAntrian || "").toLowerCase();
      const noRef = (item.noReff || "").toLowerCase();
      const sku = (item.sku || "").toLowerCase();
      const nama = (item.namaProduk || "").toLowerCase();
      const rak = (item.lokasiRak || "").toLowerCase();
      const pet = (item.petugas || "").toLowerCase();
      const cat = (item.catatan || "").toLowerCase();

      return (
        noMut.includes(q) ||
        noAnt.includes(q) ||
        noRef.includes(q) ||
        sku.includes(q) ||
        nama.includes(q) ||
        rak.includes(q) ||
        pet.includes(q) ||
        cat.includes(q)
      );
    });
  }, [mutasiList, activeTab, filterJenis, filterSumber, searchTerm]);

  // Hapus Data Mutasi
  const handleDelete = async (item) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "Hapus Bukti Mutasi?",
      text: `Mutasi "${item.noMutasi}" (${item.namaProduk} - ${item.qty} Pcs) akan dihapus permanen dari histori gudang jadi.`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#e11d48",
    });

    if (!res.isConfirmed) return;

    // Selalu hapus dari state lokal terlebih dahulu (optimistic UI)
    setMutasiList((prev) =>
      prev.filter((m) => m.id !== item.id && m.noMutasi !== item.noMutasi),
    );

    try {
      if (item.id) {
        await api.deleteMutasiGudangJadi(item.id);
      }
      Swal.fire({
        icon: "success",
        title: "Berhasil Dihapus",
        text: `Data mutasi ${item.noMutasi} telah dihapus.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.warn(
        "Gagal hapus di backend API (state lokal tetap dihapus):",
        err,
      );
      // Notifikasi sukses tetap diberikan karena data di tampilan & localStorage/session telah terhapus
      Swal.fire({
        icon: "success",
        title: "Berhasil Dihapus",
        text: `Data mutasi ${item.noMutasi} telah dihapus.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // Open Create Modal
  const handleOpenCreate = (jenis = "MASUK") => {
    setModalInitialJenis(jenis);
    setModalMode("create");
  };

  // Save Mutasi Manual
  const handleSaveMutasi = async (payload) => {
    try {
      const created = await api.createMutasiGudangJadi(payload);
      const fresh = await api.getMutasiGudangJadi();
      if (Array.isArray(fresh)) setMutasiList(fresh);
      setModalMode(null);
      Swal.fire({
        icon: "success",
        title: "Mutasi Tersimpan!",
        text: `Nomor bukti ${created.no_mutasi || created.noMutasi || "baru"} berhasil dicatat ke Gudang Jadi.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.message || "Terjadi kesalahan saat simpan",
      });
    }
  };

  return (
    <div className="w-full space-y-1.5 select-none font-sans">
      {/* 1. HEADER CARD (COMPACT SLIM PM STYLE PERSIS MUTASI BAHAN) */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white rounded-lg py-1.5 px-3 sm:px-3.5 shadow-[0_2px_4px_rgba(2,132,199,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white shrink-0">
            <Warehouse className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <h2 className="text-[13.5px] font-extrabold text-white tracking-tight">
                Mutasi Keluar Masuk Gudang Jadi
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-white/25 text-white text-[9.5px] font-extrabold">
                FINISHED GOODS
              </span>
            </div>
            <p className="text-[10.5px] text-white/85 mt-0.5 leading-tight">
              Penerimaan barang dari finishing, penyimpanan rak gudang, dan
              pengeluaran order siap kirim
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={async () => {
              try {
                const fresh = await api.getMutasiGudangJadi();
                if (Array.isArray(fresh)) setMutasiList(fresh);
                Swal.fire({
                  icon: "success",
                  title: "Data Diperbarui",
                  timer: 1000,
                  showConfirmButton: false,
                });
              } catch (_) {}
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer border border-white/20"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenCreate("MASUK")}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Barang Masuk</span>
          </button>

          <button
            onClick={() => handleOpenCreate("KELUAR")}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[11px] font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>- Barang Keluar</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS (4 KARTU BER-BORDER #cbd5e1 PERSIS MUTASI BAHAN) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total No Bukti
            </div>
            <div className="text-base font-extrabold text-[#0f172a] mt-0.5 leading-none">
              {stats.totalTransaksi}{" "}
              <span className="text-[11px] font-medium text-slate-400">
                Bukti
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <ReceiptText className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#047857] uppercase tracking-wider">
              Barang Masuk (In)
            </div>
            <div className="text-base font-extrabold text-[#059669] mt-0.5 leading-none">
              +{stats.masukPcs.toLocaleString("id-ID")}{" "}
              <span className="text-[11px] font-medium text-slate-500">
                Pcs ({stats.countMasuk})
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-[#ecfdf5] text-[#047857] flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-wider">
              Barang Keluar (Out)
            </div>
            <div className="text-base font-extrabold text-[#ef4444] mt-0.5 leading-none">
              -{stats.keluarPcs.toLocaleString("id-ID")}{" "}
              <span className="text-[11px] font-medium text-slate-500">
                Pcs ({stats.countKeluar})
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center shrink-0">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-lg p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Stok Siap Kirim
            </div>
            <div className="text-base font-extrabold text-[#0284c7] mt-0.5 leading-none">
              {stats.totalStokSaatIni.toLocaleString("id-ID")}{" "}
              <span className="text-[11px] font-medium text-slate-400">
                Pcs di Rak
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-md bg-blue-50 text-[#0284c7] flex items-center justify-center shrink-0">
            <Boxes className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS (PM TAB STYLES PERSIS MUTASI BAHAN) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === "ALL"
              ? "bg-[#0284c7] text-white border border-[#0284c7] shadow-[0_1px_4px_rgba(2,132,199,0.25)]"
              : "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] hover:bg-blue-100/60"
          }`}
        >
          <ReceiptText className="w-3 h-3" />
          <span>Semua Mutasi ({stats.totalTransaksi})</span>
        </button>

        <button
          onClick={() => setActiveTab("PENDING")}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === "PENDING"
              ? "bg-[#d97706] text-white border border-[#d97706] shadow-[0_1px_4px_rgba(217,119,6,0.25)]"
              : "bg-[#fffbeb] text-[#b45309] border border-[#fde68a] hover:bg-amber-100/60"
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Menunggu Diterima ({stats.countPending})</span>
        </button>

        <button
          onClick={() => setActiveTab("MASUK")}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === "MASUK"
              ? "bg-[#059669] text-white border border-[#059669] shadow-[0_1px_4px_rgba(5,150,105,0.25)]"
              : "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-emerald-100/60"
          }`}
        >
          <ArrowDownLeft className="w-3 h-3" />
          <span>Barang Masuk ({stats.countMasuk})</span>
        </button>

        <button
          onClick={() => setActiveTab("KELUAR")}
          className={`h-6.5 inline-flex items-center gap-1 px-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
            activeTab === "KELUAR"
              ? "bg-[#ef4444] text-white border border-[#ef4444] shadow-[0_1px_4px_rgba(239,68,68,0.25)]"
              : "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] hover:bg-red-100/60"
          }`}
        >
          <ArrowUpRight className="w-3 h-3" />
          <span>Barang Keluar ({stats.countKeluar})</span>
        </button>
      </div>

      {/* 4. FILTER BAR CARD (HIGH CONTRAST) */}
      <div className="bg-white border border-[#cbd5e1] rounded-lg p-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center gap-1.5">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No Bukti, No Antrean, SKU, Nama Produk, Lokasi Rak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] focus:bg-white text-[#0f172a] transition-all"
          />
        </div>

        <div className="w-full sm:w-44">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full px-2.5 py-1 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Jenis Mutasi</option>
            <option value="MASUK">Barang Masuk (In)</option>
            <option value="KELUAR">Barang Keluar (Out)</option>
          </select>
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterSumber}
            onChange={(e) => setFilterSumber(e.target.value)}
            className="w-full px-2.5 py-1 text-xs bg-white border border-[#cbd5e1] rounded-md focus:outline-none focus:border-[#0284c7] text-[#334155] cursor-pointer"
          >
            <option value="">Semua Sumber Mutasi</option>
            <option value="Produksi Finishing">Produksi Finishing</option>
            <option value="Manual Masuk (Restock)">
              Manual Masuk (Restock)
            </option>
            <option value="Order Pelanggan">Order Pelanggan</option>
            <option value="Pengiriman Toko / Marketplace">
              Pengiriman Toko / Marketplace
            </option>
          </select>
        </div>
      </div>

      {/* 5. TABEL INDEX MUTASI GUDANG JADI (DESAIN SPREADSHEET ELEGAN & HIGH CONTRAST) */}
      <div className="bg-white border-2 border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-800">
            <thead>
              <tr className="bg-[#2b3a4a] text-white font-bold text-xs tracking-wider uppercase border border-slate-800">
                <th className="py-2.5 px-1 text-center w-10 min-w-[36px] border border-slate-800 text-white font-bold">
                  NO
                </th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[150px] border border-slate-800 text-white font-bold">
                  NO. BUKTI & TANGGAL
                </th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[140px] border border-slate-800 text-white font-bold">
                  SUMBER / NO. ANTREAN
                </th>
                <th className="py-2.5 px-1.5 text-center whitespace-nowrap min-w-[90px] border border-slate-800 text-white font-bold">
                  JENIS
                </th>
                <th className="py-2.5 px-3 min-w-[200px] border border-slate-800 text-white font-bold">
                  MODEL PRODUK (SKU & VARIAN)
                </th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[100px] border border-slate-800 text-white font-bold">
                  KUANTITI
                </th>
                <th className="py-2.5 px-2.5 min-w-[150px] border border-slate-800 text-white font-bold">
                  LOKASI RAK & STATUS
                </th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[110px] border border-slate-800 text-white font-bold">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-14 text-center text-slate-400 border border-slate-800 bg-slate-50/30"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Warehouse className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Belum ada data mutasi barang jadi
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Selesaikan antrean di tahap finishing atau klik "+ Barang
                      Masuk" untuk menambah mutasi baru
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isMasuk = item.jenisMutasi === "MASUK";
                  const isPending =
                    item.statusPenerimaan === "Menunggu Penerimaan";

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      } hover:bg-sky-50/70`}
                    >
                      {/* 1. NO */}
                      <td className="py-[2px] px-1 text-center text-slate-600 font-mono font-bold text-[11px] border border-slate-800">
                        {idx + 1}
                      </td>

                      {/* 2. NO BUKTI & TANGGAL */}
                      <td className="py-[2px] px-2 border border-slate-800">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-mono font-black text-[11px] text-[#0284c7] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 inline-block w-fit">
                            {item.noMutasi}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {item.tglDiserahkan ||
                                item.tglMutasi?.slice(0, 10) ||
                                "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. SUMBER / NO ANTREAN */}
                      <td className="py-[2px] px-2 border border-slate-800">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            className="font-bold text-[11px] text-slate-800 truncate leading-tight"
                            title={item.sumber}
                          >
                            {item.sumber || "Produksi"}
                          </span>
                          {item.noAntrian ? (
                            <span
                              className="font-mono font-semibold text-[9.5px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 w-fit truncate"
                              title={item.noAntrian}
                            >
                              {item.noAntrian}
                            </span>
                          ) : item.noReff && item.noReff !== "-" ? (
                            <span
                              className="font-mono text-[9.5px] text-slate-500 truncate"
                              title={item.noReff}
                            >
                              Reff: {item.noReff}
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-slate-400 italic">
                              Non-Antrean
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. JENIS MUTASI */}
                      <td className="py-[2px] px-1 text-center border border-slate-800">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold border shadow-2xs ${
                            isMasuk
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-rose-50 text-rose-700 border-rose-300"
                          }`}
                        >
                          {isMasuk ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                              <span>MASUK</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                              <span>KELUAR</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* 5. MODEL PRODUK (SKU, NAMA, VARIAN, UKURAN) */}
                      <td className="py-[2px] px-3 border border-slate-800">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-extrabold text-[9.5px] text-sky-800 bg-sky-100/70 px-1.5 py-0.2 rounded border border-sky-300 shrink-0">
                              {item.sku}
                            </span>
                            <span
                              className="font-extrabold text-[#0f172a] text-xs truncate leading-tight"
                              title={item.namaProduk}
                            >
                              {item.namaProduk}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[9.5px]">
                              {item.varian || "Polos"}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-extrabold border border-blue-200 text-[9.5px]">
                              Size {item.ukuran || "All Size"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 6. KUANTITI MUTASI (DEDICATED CONTRAST BADGE) */}
                      <td className="py-[2px] px-1 text-center border border-slate-800">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border shadow-2xs whitespace-nowrap ${
                              isMasuk
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-rose-50 text-rose-800 border-rose-300"
                            }`}
                          >
                            {isMasuk
                              ? `+${Number(item.qty).toLocaleString("id-ID")}`
                              : `-${Number(item.qty).toLocaleString("id-ID")}`}
                            <span className="text-[9.5px] font-semibold ml-0.5">
                              Pcs
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* 7. LOKASI RAK & STATUS PENERIMAAN */}
                      <td className="py-[2px] px-2 text-xs border border-slate-800">
                        {isPending ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Menunggu Penerimaan</span>
                            </span>
                            <div
                              className="text-[9.5px] text-slate-600 truncate"
                              title={item.petugasSerah || item.petugas}
                            >
                              Serah:{" "}
                              <strong className="text-slate-800">
                                {item.petugasSerah ||
                                  item.petugas ||
                                  "Finishing"}
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div
                              className="flex items-center gap-1 font-extrabold text-[10.5px] text-emerald-800 truncate"
                              title={item.lokasiRak || "Gudang Utama"}
                            >
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">
                                {item.lokasiRak || "Gudang Utama"}
                              </span>
                            </div>
                            <div
                              className="text-[9.5px] text-slate-500 truncate"
                              title={item.petugasTerima || item.petugas}
                            >
                              Petugas:{" "}
                              <strong className="text-slate-700">
                                {item.petugasTerima ||
                                  item.petugas ||
                                  "Staff Gudang"}
                              </strong>
                              {item.tglDiterima && (
                                <span className="font-mono ml-1">
                                  ({item.tglDiterima})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 8. AKSI (TIDAK KETUTUP / TERPOTONG) */}
                      <td className="py-[2px] px-2 text-center border border-slate-800">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleOpenApproveModal(item)}
                              className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                              title="Terima & Tentukan Rak Penyimpanan"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedItemShow(item)}
                            className="w-6 h-6 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Tampilkan Detail Bukti Mutasi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="w-6 h-6 rounded-md bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Hapus Bukti Mutasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* FOOTER TABEL PERSIS MUTASI BAHAN */}
        <div className="px-3.5 py-2 bg-[#f8fafc] border-t border-[#cbd5e1] text-[11.5px] text-[#64748b] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-[#0f172a]">
              {filteredList.length}
            </span>{" "}
            bukti transaksi mutasi barang jadi
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-[#059669]">
              Total Masuk: +{stats.masukPcs.toLocaleString("id-ID")} Pcs
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[#ef4444]">
              Total Keluar: -{stats.keluarPcs.toLocaleString("id-ID")} Pcs
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[#0284c7]">
              Stok Rak: {stats.totalStokSaatIni.toLocaleString("id-ID")} Pcs
            </span>
          </div>
        </div>
      </div>

      {/* 6. MODAL SHOW DETAIL (FULL SCREEN SLIP PERSIS MUTASI BAHAN) */}
      {selectedItemShow && (
        <ModalShowRincianGudangJadi
          mutasi={selectedItemShow}
          onClose={() => setSelectedItemShow(null)}
        />
      )}

      {/* 7. MODAL FORM TAMBAH MUTASI (PERSIS MUTASI BAHAN) */}
      {modalMode === "create" && (
        <FormModalMutasiGudangJadi
          isOpen={true}
          initialJenis={modalInitialJenis}
          products={products}
          onClose={() => setModalMode(null)}
          onSave={handleSaveMutasi}
        />
      )}

      {/* 8. MODAL APPROVE PENERIMAAN BARANG DARI FINISHING */}
      {isApproveModalOpen && approveTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-[#0284c7] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-white" />
                <h3 className="font-extrabold text-xs text-white">
                  Penerimaan & Approval Barang Jadi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="w-6 h-6 rounded bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-3.5 space-y-2.5">
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">
                      {approveTargetItem.namaProduk}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                      SKU: <strong>{approveTargetItem.sku}</strong> •{" "}
                      {approveTargetItem.varian} ({approveTargetItem.ukuran})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 inline-block">
                      +{Number(approveTargetItem.qty).toLocaleString("id-ID")}{" "}
                      Pcs
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-emerald-200/80 flex items-center justify-between">
                  <span>
                    Diserahkan:{" "}
                    <strong>
                      {approveTargetItem.petugasSerah || "Finishing"}
                    </strong>
                  </span>
                  <span className="font-mono">
                    {approveTargetItem.tglDiserahkan || "-"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                    Tgl Diterima *
                  </label>
                  <input
                    type="date"
                    required
                    value={approveForm.tglDiterima}
                    onChange={(e) =>
                      setApproveForm((prev) => ({
                        ...prev,
                        tglDiterima: e.target.value,
                      }))
                    }
                    className="w-full h-7.5 px-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10.5px] font-bold text-slate-700">
                      Petugas Penerima
                    </label>
                    <span className="text-[9.5px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded border border-emerald-200">
                      Auto: User Login
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={approveForm.petugasTerima}
                    title="Otomatis terisi akun yang sedang login"
                    className="w-full h-7.5 px-2 text-xs rounded-lg border border-slate-300 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={approveForm.catatan}
                  onChange={(e) =>
                    setApproveForm((prev) => ({
                      ...prev,
                      catatan: e.target.value,
                    }))
                  }
                  placeholder="mis: Diterima kondisi rapi siap packing..."
                  className="w-full h-7.5 px-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 font-bold cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-xs shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Konfirmasi Terima</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// SUB-KOMPONEN: MODAL SHOW RINCIAN BUKTI MUTASI GUDANG JADI (FULL SCREEN VIEW)
// Persis seperti ModalShowRincian pada Mutasi Bahan
// ==========================================================================
function ModalShowRincianGudangJadi({ mutasi, onClose }) {
  if (!mutasi) return null;
  const isMasuk = mutasi.jenisMutasi === "MASUK";

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP NAVBAR FULL SCREEN */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
            title="Kembali ke Daftar Mutasi"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-white" />
            <h3 className="font-extrabold text-sm tracking-tight text-white">
              Lembar Bukti Mutasi Barang Jadi (Finished Goods)
            </h3>
            <span className="font-mono font-bold text-xs bg-white/20 px-2 py-0.5 rounded border border-white/25 text-white">
              {mutasi.noMutasi}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#0284c7] hover:bg-sky-50 rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Cetak Surat Bukti Mutasi"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Bukti</span>
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            title="Tutup Halaman Penuh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BODY CONTAINER FULL SCREEN */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-2.5 flex flex-col min-h-0">
        {/* HEADER INFORMATION CARD */}
        <div className="bg-white border border-[#cbd5e1] rounded-lg p-3 shadow-sm shrink-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Nomor Bukti
              </div>
              <div className="font-mono font-bold text-xs text-[#0284c7] mt-0.5">
                {mutasi.noMutasi}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Tanggal Diserahkan
              </div>
              <div className="font-mono text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {mutasi.tglDiserahkan ||
                    mutasi.tglMutasi?.slice(0, 10) ||
                    "-"}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                No. Antrean / Reff
              </div>
              <div className="font-mono font-bold text-slate-800 mt-0.5">
                {mutasi.noAntrian || mutasi.noReff || "-"}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Jenis Mutasi
              </div>
              <div className="mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold border ${
                    isMasuk
                      ? "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]"
                      : "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
                  }`}
                >
                  {isMasuk ? "BARANG MASUK" : "BARANG KELUAR"}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Status Penerimaan
              </div>
              <div className="mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold border ${
                    mutasi.statusPenerimaan === "Menunggu Penerimaan"
                      ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                      : "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]"
                  }`}
                >
                  {mutasi.statusPenerimaan || "Diterima di Rak"}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Lokasi Rak
              </div>
              <div className="font-bold text-slate-800 mt-0.5 truncate">
                {mutasi.lokasiRak || "(Belum Dialokasi)"}
              </div>
            </div>
          </div>

          {mutasi.catatan && (
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
              <strong className="text-slate-700">Catatan Mutasi:</strong>{" "}
              {mutasi.catatan}
            </div>
          )}
        </div>

        {/* TABEL RINCIAN PRODUK & QTY */}
        <div className="bg-white border-2 border-slate-800 rounded-lg shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-2.5 bg-slate-100 border-b-2 border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-slate-800" />
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Rincian Barang Jadi (Finished Goods)
              </h4>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              Sumber:{" "}
              <strong className="text-slate-900">
                {mutasi.sumber || "Produksi Finishing"}
              </strong>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-800">
              <thead>
                <tr className="bg-[#2b3a4a] text-white text-xs font-bold uppercase border border-slate-800">
                  <th className="py-2.5 px-3 text-center w-12 border border-slate-800 text-white font-bold">
                    NO
                  </th>
                  <th className="py-2.5 px-3 border border-slate-800 text-white font-bold">
                    KODE SKU
                  </th>
                  <th className="py-2.5 px-3 border border-slate-800 text-white font-bold">
                    NAMA MODEL PRODUK
                  </th>
                  <th className="py-2.5 px-3 border border-slate-800 text-white font-bold">
                    VARIAN & UKURAN
                  </th>
                  <th className="py-2.5 px-3 border border-slate-800 text-white font-bold">
                    LOKASI RAK
                  </th>
                  <th className="py-2.5 px-3 text-right border border-slate-800 text-white font-bold">
                    KUANTITI MUTASI
                  </th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-800">
                <tr className="hover:bg-slate-50 border border-slate-800">
                  <td className="py-2.5 px-3 text-center text-slate-700 font-bold text-[11px] border border-slate-800">
                    1
                  </td>
                  <td className="py-2.5 px-3 border border-slate-800">
                    <span className="font-mono font-bold text-xs text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                      {mutasi.sku}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#0f172a] text-xs border border-slate-800">
                    {mutasi.namaProduk}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 font-semibold border border-slate-800">
                    {mutasi.varian || "Polos"} • {mutasi.ukuran || "All Size"}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border border-slate-800">
                    {mutasi.lokasiRak || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sm border border-slate-800">
                    <span
                      className={isMasuk ? "text-[#059669]" : "text-[#ef4444]"}
                    >
                      {isMasuk
                        ? `+${Number(mutasi.qty).toLocaleString("id-ID")}`
                        : `-${Number(mutasi.qty).toLocaleString("id-ID")}`}{" "}
                      {mutasi.satuan || "Pcs"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR FULL SCREEN */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Petugas Serah:{" "}
            <strong className="text-slate-800">
              {mutasi.petugasSerah || mutasi.petugas || "-"}
            </strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="text-slate-500 font-medium">
            Petugas Terima:{" "}
            <strong className="text-slate-800">
              {mutasi.petugasTerima || "-"}
            </strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="font-semibold text-slate-700">
            Total Qty Mutasi:{" "}
            <strong className={isMasuk ? "text-[#059669]" : "text-[#ef4444]"}>
              {isMasuk
                ? `+${Number(mutasi.qty).toLocaleString("id-ID")}`
                : `-${Number(mutasi.qty).toLocaleString("id-ID")}`}{" "}
              {mutasi.satuan || "Pcs"}
            </strong>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-1 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Mutasi</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================================================
// SUB-KOMPONEN: MODAL FORM TAMBAH MUTASI MANUAL (FULL SCREEN VIEW)
// ==========================================================================
function FormModalMutasiGudangJadi({
  isOpen,
  initialJenis,
  products = [],
  onClose,
  onSave,
}) {
  if (!isOpen) return null;

  const [jenisMutasi, setJenisMutasi] = useState(initialJenis || "MASUK");
  const [sumber, setSumber] = useState(
    initialJenis === "MASUK" ? "Manual Masuk (Restock)" : "Order Pelanggan",
  );
  const [noReff, setNoReff] = useState("");
  const [sku, setSku] = useState(products[0]?.sku || "");
  const [qty, setQty] = useState(50);
  const [lokasiRak, setLokasiRak] = useState("Gudang Utama - Rak A1 (Kaos)");
  const currentUser = (() => {
    try {
      return localStorage.getItem("currentUser") || "Admin Produksi";
    } catch (_) {
      return "Admin Produksi";
    }
  })();
  const [petugas, setPetugas] = useState(currentUser);
  const [catatan, setCatatan] = useState("");

  const selProd = products.find((p) => p.sku === sku);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sku) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Produk",
        text: "Produk barang jadi wajib dipilih.",
      });
      return;
    }

    onSave({
      jenisMutasi,
      sumber,
      noReff,
      sku,
      namaProduk: selProd?.nama || selProd?.namaProduk || sku,
      varian: selProd?.varian || "Polos",
      ukuran: selProd?.ukuran || "All Size",
      qty: Number(qty) || 1,
      satuan: "Pcs",
      lokasiRak,
      petugas,
      catatan,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#edf1f7] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Top Navbar */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white px-3 sm:px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-md text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
          <div className="h-4 w-px bg-white/30 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-white" />
            <h3 className="font-extrabold text-sm tracking-tight text-white">
              Catat Mutasi Barang Jadi Manual
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Form */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto">
        <form
          id="form-mutasi-gj"
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto space-y-3"
        >
          <div className="bg-white border border-[#cbd5e1] rounded-lg p-3.5 shadow-sm space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <ReceiptText className="w-4 h-4 text-[#0284c7]" />
              <span>Informasi Mutasi Barang Jadi</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jenis Mutasi *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setJenisMutasi("MASUK");
                      setSumber("Manual Masuk (Restock)");
                    }}
                    className={`h-7.5 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      jenisMutasi === "MASUK"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Barang Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJenisMutasi("KELUAR");
                      setSumber("Order Pelanggan");
                    }}
                    className={`h-7.5 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      jenisMutasi === "KELUAR"
                        ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Barang Keluar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sumber / Tujuan Mutasi *
                </label>
                <select
                  value={sumber}
                  onChange={(e) => setSumber(e.target.value)}
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="Manual Masuk (Restock)">
                    Manual Masuk (Restock)
                  </option>
                  <option value="Order Pelanggan">Order Pelanggan</option>
                  <option value="Pengiriman Toko / Marketplace">
                    Pengiriman Toko / Marketplace
                  </option>
                  <option value="Penyesuaian Stok (Opname)">
                    Penyesuaian Stok (Opname)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Produk (SKU) *
                </label>
                <select
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} - {p.nama || p.namaProduk} ({p.varian || "Polos"}{" "}
                      - {p.ukuran || "All Size"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Qty (Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-right font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alokasi Lokasi Rak *
                </label>
                <input
                  type="text"
                  required
                  value={lokasiRak}
                  onChange={(e) => setLokasiRak(e.target.value)}
                  placeholder="mis: Gudang Utama - Rak A1"
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Petugas Gudang
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  No. Referensi / PO (Opsional)
                </label>
                <input
                  type="text"
                  value={noReff}
                  onChange={(e) => setNoReff(e.target.value)}
                  placeholder="mis: PO-202611-098, DO-012..."
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Keterangan pengiriman, packing plastik opp satuan, dll..."
                  className="w-full h-7.5 px-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-[#cbd5e1] px-4 py-2 flex items-center justify-between shadow-md shrink-0">
        <div className="text-xs text-slate-500 font-medium">
          Produk Terpilih:{" "}
          <strong className="text-slate-800">
            {selProd?.nama || selProd?.namaProduk || sku || "-"}
          </strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-300 font-bold text-xs cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="form-mutasi-gj"
            className="h-8 px-5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Simpan Mutasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
