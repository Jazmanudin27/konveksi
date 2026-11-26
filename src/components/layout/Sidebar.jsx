import React, { useState } from "react";
import {
  Home,
  Package,
  Tag,
  ChevronDown,
  ChevronRight,
  Database,
  Shirt,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
  Users,
  GitCommit,
  Wrench,
  Boxes,
  ArrowLeftRight,
  ListOrdered,
  Warehouse,
  FileSpreadsheet,
  Coins,
  Scissors,
  PackageCheck,
  Wallet,
  X,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { USER_ROLES } from "../../constants/userRoles";

export default function Sidebar({
  isOpen,
  onClose,
  activeMenu,
  onSelectMenu,
  userRole = "superadmin",
  currentUser = null,
  onLogout = null,
}) {
  // State collapse sub-menu Data Master, Laporan, & Settings
  const [isDataMasterOpen, setIsDataMasterOpen] = useState(true);
  const [isLaporanOpen, setIsLaporanOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Navigasi menu sekaligus tutup drawer
  const handleMenuClick = (menuKey) => {
    onSelectMenu(menuKey);
    if (onClose) onClose();
  };

  const roleConfig = USER_ROLES[userRole] || USER_ROLES.superadmin;
  const isSuperAdmin = userRole === "superadmin";
  const isGudang = userRole === "gudang";
  const isCutting = userRole === "cutting";
  const isJahit = userRole === "jahit";
  const isQc = userRole === "qc";
  const isFinishing = userRole === "finishing";

  return (
    <>
      {/* 1. BACKDROP OVERLAY (Klik di luar sidebar untuk menutup) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity animate-fade-in"
          title="Klik di luar untuk menutup menu"
        />
      )}

      {/* 2. DRAWER SIDEBAR (Slide in dari kiri hanya saat tombol garis tiga diklik) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#0b1329] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        {/* Brand Header & Tombol Tutup */}
        <div className="h-12 flex items-center justify-between px-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-600 p-0.5 shadow-md shadow-cyan-950/50 shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[6px] bg-[#0b1329]/40 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-cyan-200" />
              </div>
            </div>
            <div className="leading-tight overflow-hidden">
              <div className="flex items-center gap-1">
                <h1 className="font-extrabold text-white text-[13px] tracking-wide">
                  RUANG KONVEKSI
                </h1>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
              <p className="text-[9.5px] font-semibold text-cyan-400/90 uppercase tracking-widest">
                Sistem Manajemen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Dinamis Sesuai Role Pengguna */}
        <div className="px-3 pt-2.5">
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div
                className={`w-7 h-7 rounded-lg text-white font-black text-[11px] flex items-center justify-center shadow-xs bg-gradient-to-br ${roleConfig.themeGradient}`}
              >
                {roleConfig.avatarText}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b1329]" />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-[11.5px] font-bold text-white truncate leading-tight">
                {roleConfig.name}
              </div>
              <div className="text-[9.5px] font-medium text-cyan-400/90 truncate flex items-center gap-1">
                <span className="text-slate-300 font-bold truncate">
                  {roleConfig.division}
                </span>
                <span>•</span>
                <span className="text-emerald-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menus (Scrollbar Tersembunyi tapi Tetap Bisa Scroll) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-xs font-medium no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* MENU DASHBOARD UTAMA (Role Cutting langsung ke halaman Cutting tanpa Dashboard) */}
          {!isCutting && (
            <button
              onClick={() => handleMenuClick("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                activeMenu === "dashboard"
                  ? `bg-gradient-to-r ${roleConfig.themeGradient} text-white shadow-md`
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Dashboard</span>
            </button>
          )}

          {/* 1. KHUSUS ROLE ADMIN GUDANG */}
          {isGudang && (
            <div className="space-y-3">
              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-amber-400">
                  PERGUDANGAN & RESTOCK
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("antrean")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                      activeMenu === "antrean"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm font-black"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <ListOrdered className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>SPK</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("permintaan-produksi")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "permintaan-produksi"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm font-black"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Warehouse className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Permintaan Produksi</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("mutasi-gudang-jadi")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "mutasi-gudang-jadi"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Mutasi Gudang Jadi</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("bahan")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "bahan"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Boxes className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>Katalog Bahan Baku</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("mutasi-bahan")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "mutasi-bahan"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>Mutasi Bahan Baku</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  LAPORAN GUDANG
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("laporan-stok-gudang")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "laporan-stok-gudang"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Laporan Stok Gudang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. KHUSUS ROLE ADMIN CUTTING (HANYA SATU MENU: CUTTING) */}
          {isCutting && (
            <div className="space-y-1">
              <button
                onClick={() => handleMenuClick("divisi-cutting")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                  activeMenu === "divisi-cutting"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-black"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Scissors className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Cutting</span>
              </button>
            </div>
          )}

          {/* 3. KHUSUS ROLE ADMIN JAHIT */}
          {isJahit && (
            <div className="space-y-3">
              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-purple-400">
                  DIVISI JAHIT (SEWING)
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("divisi-jahit")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                      activeMenu === "divisi-jahit"
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm font-black"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Shirt className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>Halaman Divisi Jahit</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("penjahit")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "penjahit"
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Scissors className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>Data Tenaga Penjahit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. KHUSUS ROLE ADMIN QC */}
          {isQc && (
            <div className="space-y-3">
              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-teal-400">
                  QUALITY CONTROL (QC)
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("divisi-qc")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                      activeMenu === "divisi-qc"
                        ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm font-black"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
                    <span>Halaman Divisi QC (Inspeksi)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. KHUSUS ROLE ADMIN FINISHING */}
          {isFinishing && (
            <div className="space-y-3">
              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-rose-400">
                  FINISHING & PACKING
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("divisi-finishing")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                      activeMenu === "divisi-finishing"
                        ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm font-black"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Halaman Divisi Finishing</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("tim-finishing")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "tim-finishing"
                        ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Data Tim Finishing</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("mutasi-gudang-jadi")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "mutasi-gudang-jadi"
                        ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Warehouse className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Serah Terima ke Gudang Jadi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. KHUSUS SUPER ADMIN: TAMPILKAN SELURUH MENU MASTER, PRODUKSI, KASBON & LAPORAN */}
          {isSuperAdmin && (
            <>
              {/* GRUP MENU DATA MASTER */}
              <div>
                <button
                  onClick={() => setIsDataMasterOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
                  title="Klik untuk buka/tutup Data Master"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-200">
                      Data Master
                    </span>
                  </div>
                  {isDataMasterOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Sub Menu Data Master */}
                {isDataMasterOpen && (
                  <div className="mt-1 space-y-0.5 border-l border-slate-800 ml-4 pl-2">
                    {/* 1. Produk */}
                    <button
                      onClick={() => handleMenuClick("products")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "products"
                          ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Produk & Varian</span>
                    </button>

                    {/* 2. Kategori Produk */}
                    <button
                      onClick={() => handleMenuClick("categories")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "categories"
                          ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>Kategori Produk</span>
                    </button>

                    {/* 3. Data Penjahit (Terpisah) */}
                    <button
                      onClick={() => handleMenuClick("penjahit")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "penjahit"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                      <span>Data Penjahit</span>
                    </button>

                    {/* 4. Data Tim Finishing */}
                    <button
                      onClick={() => handleMenuClick("tim-finishing")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "tim-finishing"
                          ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <PackageCheck className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                      <span>Data Tim Finishing</span>
                    </button>

                    {/* 5. Semua Karyawan */}
                    <button
                      onClick={() => handleMenuClick("employees")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "employees"
                          ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Semua Karyawan</span>
                    </button>

                    {/* 6. Bahan Baku */}
                    <button
                      onClick={() => handleMenuClick("bahan")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "bahan"
                          ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                      <span>Bahan Baku (Kain)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PRODUKSI & ORDER GROUP */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  PRODUKSI & ORDER
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("antrean")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "antrean"
                        ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <ListOrdered className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>SPK</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("permintaan-produksi")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "permintaan-produksi"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Warehouse className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Permintaan Gudang</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("mutasi-bahan")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "mutasi-bahan"
                        ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 shrink-0" />
                    <span>Mutasi Bahan Baku</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("mutasi-gudang-jadi")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "mutasi-gudang-jadi"
                        ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 shrink-0" />
                    <span>Mutasi Gudang Jadi</span>
                  </button>
                </div>
              </div>

              {/* KEUANGAN & PAYROLL BORONGAN */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  KEUANGAN & PAYROLL
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleMenuClick("pembayaran-upah")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "pembayaran-upah"
                        ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Coins className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Pembayaran Upah</span>
                  </button>

                  <button
                    onClick={() => handleMenuClick("kasbon")}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeMenu === "kasbon"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Wallet className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Kasbon Karyawan</span>
                  </button>
                </div>
              </div>

              {/* GRUP MENU LAPORAN (DROPDOWN) */}
              <div className="pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => setIsLaporanOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
                  title="Klik untuk buka/tutup Menu Laporan"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-200">
                      Laporan
                    </span>
                  </div>
                  {isLaporanOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Sub Menu Laporan */}
                {isLaporanOpen && (
                  <div className="mt-1 space-y-0.5 border-l border-slate-800 ml-4 pl-2">
                    <button
                      onClick={() => handleMenuClick("laporan-stok-gudang")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "laporan-stok-gudang"
                          ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5 shrink-0" />
                      <span>Stok Gudang Jadi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* GRUP MENU PENGATURAN (SETTINGS DROPDOWN) */}
              <div className="pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
                  title="Klik untuk buka/tutup Pengaturan"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-200">
                      Settings
                    </span>
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Sub Menu Settings */}
                {isSettingsOpen && (
                  <div className="mt-1 space-y-0.5 border-l border-slate-800 ml-4 pl-2">
                    <button
                      onClick={() => handleMenuClick("users")}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                        activeMenu === "users"
                          ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm shadow-indigo-950 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                      <span>Users (Pengguna)</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Logout Button */}
        {onLogout && (
          <div className="p-3 border-t border-slate-800/80 bg-[#080e1e]">
            <button
              onClick={() => {
                if (onClose) onClose();
                onLogout();
              }}
              className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/50 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
