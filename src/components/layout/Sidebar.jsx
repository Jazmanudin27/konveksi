import React, { useState } from 'react';
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
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, activeMenu, onSelectMenu }) {
  // State collapse sub-menu Data Master & Laporan
  const [isDataMasterOpen, setIsDataMasterOpen] = useState(true);
  const [isLaporanOpen, setIsLaporanOpen] = useState(true);

  // Navigasi menu sekaligus tutup drawer
  const handleMenuClick = (menuKey) => {
    onSelectMenu(menuKey);
    if (onClose) onClose();
  };

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
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
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
                <h1 className="font-extrabold text-white text-[13px] tracking-wide">RUANG KONVEKSI</h1>
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

        {/* Profile Card */}
        <div className="px-3 pt-2.5">
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                AP
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b1329]" />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-[11.5px] font-bold text-white truncate leading-tight">Admin Produksi</div>
              <div className="text-[9.5px] font-medium text-cyan-400/90 truncate flex items-center gap-1">
                <span>Super Admin</span>
                <span>•</span>
                <span className="text-emerald-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menus (Scrollbar Tersembunyi tapi Tetap Bisa Scroll) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-xs font-medium no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* MENU DASHBOARD UTAMA */}
          <button
            onClick={() => handleMenuClick('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs ${
              activeMenu === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Dashboard</span>
          </button>

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
                  onClick={() => handleMenuClick('products')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'products'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>Produk & Varian</span>
                </button>

                {/* 2. Kategori Produk */}
                <button
                  onClick={() => handleMenuClick('categories')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'categories'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span>Kategori Produk</span>
                </button>

                {/* 3. Data Penjahit (Terpisah) */}
                <button
                  onClick={() => handleMenuClick('penjahit')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'penjahit'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                  <span>Data Penjahit</span>
                </button>

                {/* 4. Tim Finishing & Packing (Terpisah) */}
                <button
                  onClick={() => handleMenuClick('tim-finishing')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'tim-finishing'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                  <span>Tim Finishing</span>
                </button>

                {/* 5. Bahan Baku */}
                <button
                  onClick={() => handleMenuClick('bahan')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'bahan'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5 shrink-0" />
                  <span>Bahan Baku</span>
                </button>

                {/* 6. Semua Karyawan */}
                <button
                  onClick={() => handleMenuClick('employees')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'employees'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Semua Karyawan</span>
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
                onClick={() => handleMenuClick('antrean')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'antrean'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ListOrdered className="w-4 h-4 shrink-0" />
                <span>Antrean Produksi</span>
              </button>

              <button
                onClick={() => handleMenuClick('mutasi-bahan')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'mutasi-bahan'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>Mutasi Bahan Baku</span>
              </button>

              <button
                onClick={() => handleMenuClick('mutasi-gudang-jadi')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'mutasi-gudang-jadi'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Warehouse className="w-4 h-4 shrink-0" />
                <span>Mutasi Gudang Jadi</span>
              </button>

              <button
                onClick={() => handleMenuClick('pembayaran-upah')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'pembayaran-upah'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Coins className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Pembayaran Upah</span>
              </button>

              <button
                onClick={() => handleMenuClick('kasbon')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'kasbon'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
                  onClick={() => handleMenuClick('laporan-stok-gudang')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                    activeMenu === 'laporan-stok-gudang'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5 shrink-0" />
                  <span>Stok Gudang Jadi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
