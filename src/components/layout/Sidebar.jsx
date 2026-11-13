import React, { useState } from 'react';
import { 
  Home,
  Package, 
  Tag, 
  ChevronDown, 
  ChevronRight,
  Database,
  Shirt,
  FileText,
  CheckCircle2,
  TrendingUp,
  Bell,
  MessageSquare,
  ExternalLink,
  Layers,
  Sparkles,
  Users,
  GitCommit,
  Wrench,
  Boxes,
  ArrowLeftRight,
  ListOrdered,
  Warehouse,
  FileSpreadsheet
} from 'lucide-react';

export default function Sidebar({ isOpen, activeMenu, onSelectMenu }) {
  // State collapse sub-menu Data Master & Laporan
  const [isDataMasterOpen, setIsDataMasterOpen] = useState(true);
  const [isLaporanOpen, setIsLaporanOpen] = useState(true);

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-[#0b1329] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 select-none ${
        isOpen ? 'w-64' : 'w-0 lg:w-20 overflow-hidden'
      }`}
    >
      {/* Brand Header */}
      <div className="h-12 flex items-center px-4 border-b border-slate-800/80 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 p-0.5 shadow-md shadow-cyan-950/50 shrink-0 flex items-center justify-center">
          <div className="w-full h-full rounded-[10px] bg-[#0b1329]/40 flex items-center justify-center">
            <Shirt className="w-5 h-5 text-cyan-200" />
          </div>
        </div>
        {isOpen && (
          <div className="leading-tight overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-sm tracking-wide">RUANG KONVEKSI</h1>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[10px] font-semibold text-cyan-400/90 uppercase tracking-widest">
              Sistem Manajemen
            </p>
          </div>
        )}
      </div>

      {/* Profile Card */}
      {isOpen && (
        <div className="px-3 pt-3">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                AP
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0b1329]" />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">Admin Produksi</div>
              <div className="text-[10px] font-medium text-cyan-400/90 truncate flex items-center gap-1">
                <span>Super Admin</span>
                <span>•</span>
                <span className="text-emerald-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menus (Scrollbar Tersembunyi tapi Tetap Bisa Scroll) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-xs font-medium no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* MENU DASHBOARD UTAMA */}
        <button
          onClick={() => onSelectMenu('dashboard')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
            activeMenu === 'dashboard'
              ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Home className="w-4 h-4 shrink-0 text-cyan-400" />
          {isOpen && <span>Dashboard</span>}
        </button>

        {/* GRUP MENU DATA MASTER */}
        <div>
          <button
            onClick={() => setIsDataMasterOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
            title="Klik untuk buka/tutup Data Master"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              {isOpen && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Data Master
                </span>
              )}
            </div>
            {isOpen && (
              isDataMasterOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )
            )}
          </button>

          {/* Sub Menu Data Master */}
          {isDataMasterOpen && (
            <div className="mt-1 space-y-1 border-l border-slate-800 ml-4 pl-2">
              {/* 1. Produk */}
              <button
                onClick={() => onSelectMenu('products')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'products'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                {isOpen && <span>Produk & Varian</span>}
              </button>

              {/* 2. Kategori Produk */}
              <button
                onClick={() => onSelectMenu('categories')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'categories'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Tag className="w-4 h-4 shrink-0" />
                {isOpen && <span>Kategori Produk</span>}
              </button>

              {/* 3. Karyawan */}
              <button
                onClick={() => onSelectMenu('employees')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'employees'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                {isOpen && <span>Karyawan</span>}
              </button>

              {/* 4. Jasa */}
              <button
                onClick={() => onSelectMenu('jasa')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'jasa'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Wrench className="w-4 h-4 shrink-0" />
                {isOpen && <span>Tarif & Jasa</span>}
              </button>

              {/* 6. Bahan */}
              <button
                onClick={() => onSelectMenu('bahan')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'bahan'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Boxes className="w-4 h-4 shrink-0" />
                {isOpen && <span>Bahan Baku</span>}
              </button>
            </div>
          )}
        </div>

        {/* PRODUKSI & ORDER GROUP */}
        <div className="pt-2 border-t border-slate-800/60">
          {isOpen && (
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              PRODUKSI & ORDER
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => onSelectMenu('antrean')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                activeMenu === 'antrean'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ListOrdered className="w-4 h-4 shrink-0" />
              {isOpen && <span>Antrean Produksi</span>}
            </button>

            <button
              onClick={() => onSelectMenu('mutasi-bahan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                activeMenu === 'mutasi-bahan'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              {isOpen && <span>Mutasi Bahan Baku</span>}
            </button>

            <button
              onClick={() => onSelectMenu('mutasi-gudang-jadi')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                activeMenu === 'mutasi-gudang-jadi'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Warehouse className="w-4 h-4 shrink-0" />
              {isOpen && <span>Mutasi Gudang Jadi</span>}
            </button>
          </div>
        </div>

        {/* GRUP MENU LAPORAN (DROPDOWN) */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            onClick={() => setIsLaporanOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
            title="Klik untuk buka/tutup Menu Laporan"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
              {isOpen && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Laporan
                </span>
              )}
            </div>
            {isOpen && (
              isLaporanOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )
            )}
          </button>

          {/* Sub Menu Laporan */}
          {isLaporanOpen && (
            <div className="mt-1 space-y-1 border-l border-slate-800 ml-4 pl-2">
              <button
                onClick={() => onSelectMenu('laporan-stok-gudang')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  activeMenu === 'laporan-stok-gudang'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Boxes className="w-4 h-4 shrink-0" />
                {isOpen && <span>Stok Gudang Jadi</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
