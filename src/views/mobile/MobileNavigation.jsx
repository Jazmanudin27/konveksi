import React from 'react';
import { Home, Scissors, ArrowLeftRight, User, Fingerprint, ClipboardList, Warehouse, Plus } from 'lucide-react';

export default function MobileNavigation({
  activeTab,
  onSelectTab,
  onOpenAddAntrean,
  onOpenMenu,
  activeOrderCount = 0,
  isGudang = false,
}) {
  if (isGudang) {
    // KHUSUS ADMIN GUDANG: HANYA ADA 2 HALAMAN (SPK & MUTASI GUDANG) + TOMBOL BUAT SPK & AKUN
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a] text-slate-400 border-t border-slate-800 flex items-center justify-around px-3 z-40 shadow-2xl select-none">
        {/* 1. Halaman SPK Permintaan Produksi */}
        <button
          onClick={() => onSelectTab('antrean')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 transition-colors cursor-pointer relative ${
            activeTab === 'antrean' ? 'text-amber-400 font-black' : 'hover:text-white'
          }`}
        >
          <ClipboardList className={`w-5 h-5 ${activeTab === 'antrean' ? 'text-amber-400 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10.5px] font-bold tracking-tight">SPK Produksi</span>
          {activeOrderCount > 0 && (
            <span className="absolute top-1 right-3.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* 2. Tombol Floating FAB Tengah: + Buat SPK */}
        <div className="-mt-7 relative flex flex-col items-center">
          <button
            onClick={onOpenAddAntrean}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 text-white flex items-center justify-center border-[2.5px] border-white shadow-xl shadow-amber-950/60 active:scale-95 transition-all cursor-pointer"
            title="Buat SPK Permintaan ke Bagian Produksi"
          >
            <Plus className="w-8 h-8 text-white stroke-[3]" />
          </button>
        </div>

        {/* 3. Halaman Mutasi Gudang Jadi */}
        <button
          onClick={() => onSelectTab('mutasi')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 transition-colors cursor-pointer ${
            activeTab === 'mutasi' ? 'text-amber-400 font-black' : 'hover:text-white'
          }`}
        >
          <Warehouse className={`w-5 h-5 ${activeTab === 'mutasi' ? 'text-amber-400 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10.5px] font-bold tracking-tight">Mutasi Gudang</span>
        </button>

        {/* 4. Menu Akun & Keluar */}
        <button
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'menu' ? 'text-amber-400 font-black' : 'hover:text-white'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'menu' ? 'text-amber-400 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10.5px] font-bold tracking-tight">Akun</span>
        </button>
      </nav>
    );
  }

  // TAMPILAN ROLE SUPER ADMIN & LAINNYA
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#054338] text-emerald-200/80 border-t border-emerald-900/60 flex items-center justify-around px-2 z-40 shadow-2xl select-none">
      {/* 1. Tab Beranda */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          activeTab === 'home' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-emerald-300 stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10.5px] font-bold tracking-tight">Beranda</span>
      </button>

      {/* 2. Tab Antrean */}
      <button
        onClick={() => onSelectTab('antrean')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors relative cursor-pointer ${
          activeTab === 'antrean' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <Scissors className={`w-5 h-5 ${activeTab === 'antrean' ? 'text-emerald-300 stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10.5px] font-bold tracking-tight">Antrean</span>
        {activeOrderCount > 0 && (
          <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#054338] animate-pulse" />
        )}
      </button>

      {/* 3. TOMBOL TENGAH FLOATING BESAR */}
      <div className="-mt-7 relative flex flex-col items-center">
        <button
          onClick={onOpenAddAntrean}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center border-[2.5px] border-white shadow-xl shadow-emerald-950/50 active:scale-95 transition-all cursor-pointer"
          title="Tambah Antrean Produksi Baru"
        >
          <Fingerprint className="w-8 h-8 text-white stroke-[2.2]" />
        </button>
      </div>

      {/* 4. Tab Mutasi */}
      <button
        onClick={() => onSelectTab('mutasi')}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          activeTab === 'mutasi' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'mutasi' ? 'text-emerald-300 stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10.5px] font-bold tracking-tight">Mutasi</span>
      </button>

      {/* 5. Tab Profil / Menu */}
      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors cursor-pointer ${
          activeTab === 'menu' ? 'text-white font-bold' : 'hover:text-white'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'menu' ? 'text-emerald-300 stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10.5px] font-bold tracking-tight">Profil</span>
      </button>
    </nav>
  );
}
